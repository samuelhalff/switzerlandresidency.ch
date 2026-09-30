#!/usr/bin/env python3
"""Incremental, near-atomic deploy of out/ to the Apache web root over explicit FTPS.

Usage (CI runs exactly this; locally: set -a; . ./.env.deploy; set +a first):

    python3 scripts/deploy-ftp.py --dry-run     # print the plan, write nothing
    python3 scripts/deploy-ftp.py               # deploy
    python3 scripts/deploy-ftp.py --dry-run --old-manifest none|FILE   # plan offline, no connection

Env: DEPLOY_HOST, DEPLOY_PORT (21), DEPLOY_USER, DEPLOY_PASS, DEPLOY_DIR (web root relative
to the FTP login directory, default ".").

How it works
------------
1. Manifest: {relative_path: sha256} of every file in out/. The previous deploy's manifest is
   read from `.deploy-manifest.json` in the web root (web access denied by public/.htaccess).
   Only files whose hash changed (or that are new) are uploaded — no timestamp noise.
2. Phase 1 (assets, additive): changed/new files under `_next/`, `fonts/` and font
   files are uploaded straight to their final path. Build assets are content-hashed, so a new
   one can never be referenced by a live page before phase 2.
3. Phase 2 (swap): every other changed/new file (html, txt, xml, icons, .htaccess…) is uploaded
   to `<path>.deploy-tmp` and RENAMEd (RNFR/RNTO) over the final path. The rename is atomic
   per file on the server, so a page is never missing mid-deploy. `.htaccess` goes last.
   If the server refuses RNTO onto an existing file, the target is deleted and the rename
   retried (counted as a "non-atomic swap" in the summary).
4. The new manifest is written (tmp + rename).
5. Cleanup: files in the OLD manifest (or touched by an earlier failed run) but not in the new
   one are deleted, then their now-empty parent directories are removed (RMD fails on
   non-empty directories, so nothing unknown is ever removed). Nothing is listed or deleted
   outside manifest-known paths.

Failed runs: before writing anything, `.deploy-journal.json` records every path this run will
touch and every tmp name it may leave. The next run deletes those tmp files, treats touched
paths as changed (the server may hold a half-finished version) and deletes touched paths that
are no longer part of the site. The journal is removed after a successful run.

Bootstrap: the first run finds no manifest on the server, so it uploads everything once and
deletes nothing (there is no old manifest to diff against). Files left by the previous lftp
mirror are simply overwritten.

Safety: paths whose first segment starts with `_archive-` or equals `.ftpquota`, `.well-known`
or `cgi-bin` are protected. They are filtered out of every plan phase, and every upload,
rename, delete, mkdir and rmdir asserts it again — a violation aborts the whole run.

TLS: GoDaddy presents a valid Starfield cert for *.prod.sxb1.secureserver.net, but no name in
that zone resolves to our host IP, so the certificate chain is verified and only the hostname
match is skipped (same policy as the old lftp workflow: ssl:verify-certificate yes,
ssl:check-hostname no).
"""
from __future__ import annotations

import argparse
import ftplib
import hashlib
import io
import json
import os
import posixpath
import ssl
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Iterable

LOCAL = Path(__file__).resolve().parent.parent / "out"
MANIFEST = ".deploy-manifest.json"
JOURNAL = ".deploy-journal.json"
TMP_SUFFIX = ".deploy-tmp"
PROTECTED_TOP = (".ftpquota", ".well-known", "cgi-bin")
ASSET_TOP = ("_next", "fonts")  # content-hashed or immutable; images/ are not hashed → swapped via tmp+rename
ASSET_EXT = (".woff", ".woff2", ".ttf", ".otf")
RETRIES = 4


class SafetyError(RuntimeError):
    """A path failed the safety check — the run must abort."""


# ---------------------------------------------------------------- pure planning logic

def is_protected(rel: str) -> bool:
    top = rel.lstrip("/").split("/", 1)[0]
    return top.startswith("_archive-") or top in PROTECTED_TOP


def is_reserved(rel: str) -> bool:
    """Deploy bookkeeping files: never part of a site manifest."""
    return rel in (MANIFEST, JOURNAL) or rel.endswith(TMP_SUFFIX)


def assert_safe(rel: str) -> str:
    """Raise SafetyError unless `rel` is a clean relative path outside protected areas."""
    parts = rel.split("/")
    if (
        not rel
        or rel.startswith("/")
        or "\\" in rel
        or any(p in ("", ".", "..") for p in parts)
        or is_protected(rel)
    ):
        raise SafetyError(f"refusing to touch {rel!r}")
    return rel


def is_asset(rel: str) -> bool:
    return rel.split("/", 1)[0] in ASSET_TOP or rel.lower().endswith(ASSET_EXT)


def _usable(rel: str) -> bool:
    try:
        assert_safe(rel)
    except SafetyError:
        return False
    return not is_reserved(rel)


@dataclass
class Plan:
    assets: list[str] = field(default_factory=list)  # phase 1: upload in place
    swaps: list[str] = field(default_factory=list)  # phase 2: tmp + rename (.htaccess last)
    deletes: list[str] = field(default_factory=list)  # cleanup: files
    rmdirs: list[str] = field(default_factory=list)  # cleanup: dirs to try (deepest first)
    stale_tmps: list[str] = field(default_factory=list)  # tmp files from a failed run
    unchanged: int = 0
    skipped: list[str] = field(default_factory=list)  # protected/reserved/unsafe paths ignored

    @property
    def uploads(self) -> list[str]:
        return self.assets + self.swaps

    def empty(self) -> bool:
        return not (self.assets or self.swaps or self.deletes or self.stale_tmps)


def _parents(rel: str) -> list[str]:
    parts = rel.split("/")[:-1]
    return ["/".join(parts[: i + 1]) for i in range(len(parts))]


def plan_deploy(
    old: dict[str, str] | None,
    new: dict[str, str],
    touched: Iterable[str] = (),
    stale_tmps: Iterable[str] = (),
) -> Plan:
    """Diff two manifests into deploy phases.

    old      previous manifest from the server (None = bootstrap: upload all, delete nothing)
    new      manifest of the local build
    touched  paths a failed earlier run may have modified (forced re-upload / orphan delete)
    """
    p = Plan()
    old = old or {}
    touched = set(touched)
    for rel in set(old) | set(new) | touched:
        if not _usable(rel):
            p.skipped.append(rel)
    p.skipped.sort()

    new_ok = {r: h for r, h in new.items() if _usable(r)}
    old_ok = {r: h for r, h in old.items() if _usable(r)}
    touched_ok = {r for r in touched if _usable(r)}

    changed = sorted(r for r, h in new_ok.items() if old_ok.get(r) != h or r in touched_ok)
    p.unchanged = len(new_ok) - len(changed)
    p.assets = [r for r in changed if is_asset(r)]
    swaps = [r for r in changed if not is_asset(r)]
    # .htaccess files last, root one very last (deepest first).
    def swap_order(r: str) -> tuple:
        ht = posixpath.basename(r) == ".htaccess"
        return (ht, -r.count("/") if ht else 0, r)

    p.swaps = sorted(swaps, key=swap_order)

    p.deletes = sorted((set(old_ok) | touched_ok) - set(new_ok), key=lambda r: (-r.count("/"), r))
    keep_dirs = {d for r in new_ok for d in _parents(r)}
    dirs = {d for r in p.deletes for d in _parents(r)} - keep_dirs
    p.rmdirs = sorted((d for d in dirs if _usable(d)), key=lambda d: (-d.count("/"), d))

    p.stale_tmps = sorted(
        {t for t in stale_tmps if t.endswith(TMP_SUFFIX) and _usable(t[: -len(TMP_SUFFIX)])}
    )
    return p


def describe(plan: Plan, limit: int = 5) -> str:
    def block(name: str, items: list[str]) -> str:
        head = ", ".join(items[:limit]) + (f", … (+{len(items) - limit})" if len(items) > limit else "")
        return f"  {name:<22}{len(items):>5}  {head}"

    lines = [
        block("phase 1 assets", plan.assets),
        block("phase 2 swaps", plan.swaps),
        block("cleanup deletes", plan.deletes),
        block("cleanup rmdirs", plan.rmdirs),
        block("stale tmp files", plan.stale_tmps),
        f"  {'unchanged':<22}{plan.unchanged:>5}",
    ]
    if plan.skipped:
        lines.append(block("skipped (protected)", plan.skipped))
    return "\n".join(lines)


# ---------------------------------------------------------------- local manifest

def build_manifest(root: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    for f in sorted(root.rglob("*")):
        if f.is_file():
            rel = f.relative_to(root).as_posix()
            out[rel] = hashlib.sha256(f.read_bytes()).hexdigest()
    return out


# ---------------------------------------------------------------- FTP session

class ReusingFTP_TLS(ftplib.FTP_TLS):
    """Reuse the control-channel TLS session on data connections (required by many servers)."""

    def ntransfercmd(self, cmd, rest=None):
        conn, size = ftplib.FTP.ntransfercmd(self, cmd, rest)
        if self._prot_p:
            conn = self.context.wrap_socket(conn, server_hostname=self.host, session=self.sock.session)
        return conn, size


class Remote:
    def __init__(self, host: str, port: int, user: str, password: str, root: str):
        self.args = (host, port, user, password)
        self.root = root
        self.ftp: ftplib.FTP_TLS | None = None
        self.connect()

    def connect(self) -> None:
        if self.ftp is not None:
            try:
                self.ftp.close()
            except Exception:
                pass
        host, port, user, password = self.args
        ctx = ssl.create_default_context()
        ctx.check_hostname = False  # see module docstring; the chain is still verified
        ftp = ReusingFTP_TLS(context=ctx, timeout=60)
        ftp.connect(host, port)
        ftp.login(user, password)
        ftp.prot_p()
        if self.root not in ("", ".", "./"):
            ftp.cwd(self.root)
        self.ftp = ftp

    def retry(self, what: str, fn: Callable[[ftplib.FTP_TLS], object]):
        """Run fn(ftp); retry transient failures with exponential backoff and a fresh connection.
        Permanent (5xx) replies are raised immediately for the caller to handle."""
        for attempt in range(1, RETRIES + 1):
            try:
                assert self.ftp is not None
                return fn(self.ftp)
            except ftplib.error_perm:
                raise
            except ftplib.all_errors as exc:  # transient: timeouts, resets, 4xx, TLS errors
                if attempt == RETRIES:
                    raise
                delay = 2**attempt
                print(f"  retry {attempt}/{RETRIES - 1} {what}: {exc!r} (waiting {delay}s)", flush=True)
                time.sleep(delay)
                try:
                    self.connect()
                except Exception as cexc:  # keep retrying; the next fn() call will fail again if down
                    print(f"  reconnect failed: {cexc!r}", flush=True)

    # --- reads
    def read_json(self, rel: str) -> dict | None:
        assert_safe(rel)
        buf = io.BytesIO()
        try:
            self.retry(f"RETR {rel}", lambda f: (buf.seek(0), buf.truncate(), f.retrbinary(f"RETR {rel}", buf.write)))
        except ftplib.error_perm as exc:
            if str(exc).startswith("550"):
                return None
            raise
        try:
            data = json.loads(buf.getvalue().decode("utf-8"))
        except ValueError:
            print(f"  warning: {rel} is not valid JSON — ignoring it", flush=True)
            return None
        return data if isinstance(data, dict) else None

    # --- writes (every one asserts the path first)
    def put(self, rel: str, data: bytes) -> None:
        assert_safe(rel)
        self.retry(f"STOR {rel}", lambda f: f.storbinary(f"STOR {rel}", io.BytesIO(data)))

    def rename(self, src: str, dst: str) -> bool:
        """Atomic rename; returns False if a delete-then-rename fallback was needed.

        The fallback only runs when RNFR succeeded (the tmp file exists) and RNTO was
        refused — so a live file is never deleted without its replacement in place."""
        assert_safe(src)
        assert_safe(dst)

        def attempt(f: ftplib.FTP_TLS) -> bool:
            resp = f.sendcmd(f"RNFR {src}")  # 5xx raises error_perm: tmp missing → abort
            if not resp.startswith("3"):
                raise ftplib.error_reply(resp)
            try:
                f.voidcmd(f"RNTO {dst}")
                return True
            except ftplib.error_perm:
                return False

        if self.retry(f"RENAME {src}", attempt):
            return True
        self.delete(dst, missing_ok=True)
        if not self.retry(f"RENAME {src}", attempt):
            raise RuntimeError(f"cannot rename {src} → {dst}")
        return False

    def swap(self, rel: str, data: bytes) -> bool:
        tmp = rel + TMP_SUFFIX
        self.put(tmp, data)
        return self.rename(tmp, rel)

    def delete(self, rel: str, missing_ok: bool = True) -> bool:
        assert_safe(rel)
        try:
            self.retry(f"DELE {rel}", lambda f: f.delete(rel))
            return True
        except ftplib.error_perm as exc:
            if missing_ok and str(exc).startswith("550"):
                return False
            raise

    def mkdir(self, rel: str) -> None:
        assert_safe(rel)
        try:
            self.retry(f"MKD {rel}", lambda f: f.mkd(rel))
        except ftplib.error_perm:
            pass  # already exists

    def rmdir(self, rel: str) -> bool:
        assert_safe(rel)
        try:
            self.retry(f"RMD {rel}", lambda f: f.rmd(rel))
            return True
        except ftplib.error_perm:
            return False  # not empty (holds files we don't own) or already gone

    def quit(self) -> None:
        try:
            assert self.ftp is not None
            self.ftp.quit()
        except Exception:
            pass


# ---------------------------------------------------------------- run

def load_old_manifest(arg: str) -> dict[str, str] | None:
    if arg == "none":
        return None
    data = json.loads(Path(arg).read_text())
    return data.get("files", data)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--dry-run", action="store_true", help="print the plan, write nothing")
    ap.add_argument(
        "--old-manifest",
        help="with --dry-run: plan against this local manifest file ('none' = bootstrap) without connecting",
    )
    args = ap.parse_args(argv)
    if args.old_manifest and not args.dry_run:
        ap.error("--old-manifest is only allowed with --dry-run")

    started = time.time()
    if not (LOCAL / "index.html").exists():
        sys.exit("out/ is missing — run the build first")
    new = build_manifest(LOCAL)
    bad = [r for r in new if not _usable(r)]
    if bad:
        sys.exit(f"refusing: build output contains protected/reserved paths {bad[:3]}")

    remote: Remote | None = None
    journal: dict = {}
    if args.old_manifest:
        old = load_old_manifest(args.old_manifest)
    else:
        missing = [k for k in ("DEPLOY_HOST", "DEPLOY_USER", "DEPLOY_PASS") if not os.environ.get(k)]
        if missing:
            sys.exit(f"missing env: {', '.join(missing)} (or plan offline: --dry-run --old-manifest none)")
        remote = Remote(
            os.environ["DEPLOY_HOST"],
            int(os.environ.get("DEPLOY_PORT") or 21),
            os.environ["DEPLOY_USER"],
            os.environ["DEPLOY_PASS"],
            os.environ.get("DEPLOY_DIR") or ".",
        )
        raw = remote.read_json(MANIFEST)
        old = raw.get("files") if raw else None
        journal = remote.read_json(JOURNAL) or {}

    plan = plan_deploy(old, new, journal.get("touched", []), journal.get("tmp", []))
    mode = "bootstrap (no manifest on server: upload all, delete nothing)" if old is None else "incremental"
    print(f"deploy plan — {mode}; {len(new)} local files" + ("; resuming after a failed run" if journal else ""))
    print(describe(plan))

    if args.dry_run:
        print("[dry-run] nothing written")
        if remote:
            remote.quit()
        return 0
    assert remote is not None
    if plan.empty() and not journal:
        print("deploy: already up to date")
        remote.quit()
        return 0

    # Journal first, so a crash anywhere below is recoverable by the next run.
    # Deletes are journalled too: if we crash after the manifest swap, the next run's old
    # manifest no longer lists them, so only the journal can still schedule their removal.
    touched = sorted(set(journal.get("touched", [])) | set(plan.uploads) | set(plan.deletes))
    tmps = sorted(set(journal.get("tmp", [])) | {r + TMP_SUFFIX for r in plan.swaps} | {MANIFEST + TMP_SUFFIX})
    remote.put(JOURNAL, json.dumps({"touched": touched, "tmp": tmps}).encode())

    for t in plan.stale_tmps:
        remote.delete(t)

    known_dirs = {d for r in (old or {}) for d in _parents(r)}
    for d in sorted({d for r in plan.uploads for d in _parents(r)} - known_dirs, key=lambda d: d.count("/")):
        remote.mkdir(d)

    def body(rel: str) -> bytes:
        return (LOCAL / rel).read_bytes()

    for i, rel in enumerate(plan.assets, 1):
        remote.put(rel, body(rel))
        if i % 50 == 0:
            print(f"  phase 1: {i}/{len(plan.assets)}", flush=True)
    non_atomic = 0
    for i, rel in enumerate(plan.swaps, 1):
        if not remote.swap(rel, body(rel)):
            non_atomic += 1
        if i % 50 == 0:
            print(f"  phase 2: {i}/{len(plan.swaps)}", flush=True)

    remote.swap(MANIFEST, json.dumps({"version": 1, "files": new}, indent=1, sort_keys=True).encode())

    deleted = sum(remote.delete(r) for r in plan.deletes)
    removed_dirs = sum(remote.rmdir(d) for d in plan.rmdirs)
    remote.delete(JOURNAL)
    remote.quit()

    print(
        f"deploy: {len(plan.assets)} assets uploaded, {len(plan.swaps)} files swapped"
        f" ({non_atomic} non-atomic), {deleted}/{len(plan.deletes)} deleted, {removed_dirs} dirs removed,"
        f" {len(plan.stale_tmps)} stale tmp cleaned, {plan.unchanged} unchanged, {time.time() - started:.0f}s"
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SafetyError as exc:
        print(f"::error::ABORT — safety check failed: {exc}", file=sys.stderr)
        sys.exit(2)
