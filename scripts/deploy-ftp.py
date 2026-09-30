#!/usr/bin/env python3
"""Mirror out/ to the GoDaddy web root over explicit FTPS (fallback to the GitHub workflow).

Usage:  set -a; . ./.env.deploy; set +a; python3 scripts/deploy-ftp.py [--dry-run]

- Uploads every file from out/ (new or changed size), deletes remote files that no longer
  exist locally, and never touches protected paths (old-site archive, quota file, ACME
  challenges, cgi-bin).
- TLS: GoDaddy presents a valid Starfield cert for *.prod.sxb1.secureserver.net, but no name
  in that zone resolves to our IP, so the chain is verified and the hostname check skipped
  (same policy as the workflow).
"""
import ftplib
import os
import ssl
import sys
from pathlib import Path

LOCAL = Path(__file__).resolve().parent.parent / "out"
PROTECTED = (".ftpquota", ".well-known", "cgi-bin")
DRY = "--dry-run" in sys.argv


def protected(rel: str) -> bool:
    top = rel.split("/", 1)[0]
    return top.startswith("_archive-") or top in PROTECTED


def connect() -> ftplib.FTP_TLS:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False  # see module docstring; chain is still verified
    ftp = ftplib.FTP_TLS(context=ctx, timeout=60)
    ftp.connect(os.environ["DEPLOY_HOST"], int(os.environ.get("DEPLOY_PORT", "21")))
    ftp.login(os.environ["DEPLOY_USER"], os.environ["DEPLOY_PASS"])
    ftp.prot_p()
    return ftp


def remote_tree(ftp: ftplib.FTP_TLS, path: str = "") -> tuple[dict, set]:
    """Return ({file: size}, {dirs}) below path, skipping protected entries."""
    files, dirs = {}, set()
    for name, facts in ftp.mlsd(path or ".", facts=["type", "size"]):
        if name in (".", ".."):
            continue
        rel = f"{path}/{name}" if path else name
        if protected(rel):
            continue
        if facts.get("type") == "dir":
            dirs.add(rel)
            sub_files, sub_dirs = remote_tree(ftp, rel)
            files.update(sub_files)
            dirs |= sub_dirs
        elif facts.get("type") == "file":
            files[rel] = int(facts.get("size", -1))
    return files, dirs


def main() -> None:
    if not (LOCAL / "index.html").exists():
        sys.exit("out/ is missing — run the build first")
    local = {p.relative_to(LOCAL).as_posix(): p for p in LOCAL.rglob("*") if p.is_file()}
    bad = [r for r in local if protected(r)]
    if bad:
        sys.exit(f"refusing: build output contains protected paths {bad[:3]}")

    ftp = connect()
    remote_files, remote_dirs = remote_tree(ftp)
    uploaded = deleted = 0

    for rel in sorted({str(Path(r).parent.as_posix()) for r in local} - {"."}, key=len):
        parts = rel.split("/")
        for i in range(1, len(parts) + 1):
            d = "/".join(parts[:i])
            if d not in remote_dirs:
                if not DRY:
                    ftp.mkd(d)
                remote_dirs.add(d)

    for rel, p in sorted(local.items()):
        if remote_files.get(rel) == p.stat().st_size and not rel.endswith((".html", ".xml", ".txt", ".htaccess")):
            continue  # hashed assets: same size ⇒ unchanged
        if not DRY:
            with open(p, "rb") as fh:
                ftp.storbinary(f"STOR {rel}", fh)
        uploaded += 1

    for rel in sorted(set(remote_files) - set(local), reverse=True):
        if not DRY:
            ftp.delete(rel)
        deleted += 1
    for d in sorted(remote_dirs - {str(Path(r).parent.as_posix()) for r in local}, key=len, reverse=True):
        if any(r.startswith(d + "/") for r in local):
            continue
        if not DRY:
            try:
                ftp.rmd(d)
            except ftplib.error_perm:
                pass

    ftp.quit()
    print(f"{'[dry-run] ' if DRY else ''}uploaded {uploaded}, deleted {deleted}, local files {len(local)}")


if __name__ == "__main__":
    main()
