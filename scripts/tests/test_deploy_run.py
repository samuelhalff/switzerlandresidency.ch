"""End-to-end run of scripts/deploy-ftp.py against an in-memory fake FTP server (no network).

Run: python3 -m pytest scripts/tests   (or: python3 scripts/tests/test_deploy_run.py)
"""
import ftplib
import importlib.util
import json
import sys
import tempfile
from pathlib import Path

_path = Path(__file__).resolve().parent.parent / "deploy-ftp.py"
_spec = importlib.util.spec_from_file_location("deploy_ftp_run", _path)
deploy = importlib.util.module_from_spec(_spec)
sys.modules["deploy_ftp_run"] = deploy
_spec.loader.exec_module(deploy)


class FakeServer:
    def __init__(self, files=None):
        self.files = dict(files or {})
        self.dirs = {"_archive-2026-09-30", "cgi-bin"}
        self.log = []  # (op, path)

    def _dir_ok(self, rel):
        parent = rel.rsplit("/", 1)[0] if "/" in rel else ""
        if parent and parent not in self.dirs:
            raise ftplib.error_perm(f"553 no such dir {parent}")


class FakeFTP:
    server: FakeServer

    def __init__(self, *a, **k):
        self._rnfr = None

    def connect(self, *a):
        pass

    def login(self, *a):
        pass

    def prot_p(self):
        pass

    def cwd(self, d):
        pass

    def quit(self):
        pass

    def close(self):
        pass

    def retrbinary(self, cmd, cb):
        rel = cmd.split(" ", 1)[1]
        if rel not in self.server.files:
            raise ftplib.error_perm("550 not found")
        cb(self.server.files[rel])

    def storbinary(self, cmd, fh):
        rel = cmd.split(" ", 1)[1]
        self.server._dir_ok(rel)
        self.server.log.append(("STOR", rel))
        self.server.files[rel] = fh.read()

    def sendcmd(self, cmd):
        verb, rel = cmd.split(" ", 1)
        assert verb == "RNFR"
        if rel not in self.server.files:
            raise ftplib.error_perm("550 no such file")
        self._rnfr = rel
        return "350 ready"

    def voidcmd(self, cmd):
        verb, dst = cmd.split(" ", 1)
        assert verb == "RNTO" and self._rnfr
        self.server.log.append(("RENAME", dst))
        self.server.files[dst] = self.server.files.pop(self._rnfr)  # atomic overwrite
        self._rnfr = None
        return "250 ok"

    def delete(self, rel):
        if rel not in self.server.files:
            raise ftplib.error_perm("550 not found")
        self.server.log.append(("DELE", rel))
        del self.server.files[rel]

    def mkd(self, rel):
        if rel in self.server.dirs:
            raise ftplib.error_perm("550 exists")
        self.server.log.append(("MKD", rel))
        self.server.dirs.add(rel)

    def rmd(self, rel):
        if any(f.startswith(rel + "/") for f in self.server.files):
            raise ftplib.error_perm("550 not empty")
        self.server.log.append(("RMD", rel))
        self.server.dirs.discard(rel)


def _site(root: Path, files: dict):
    for rel, body in files.items():
        p = root / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(body)


def _run(tmp: Path, server: FakeServer, files: dict, ftp_cls=None):
    out = tmp / "out"
    if out.exists():
        import shutil

        shutil.rmtree(out)
    _site(out, files)
    FakeFTP.server = server
    deploy.LOCAL = out
    deploy.ReusingFTP_TLS = ftp_cls or FakeFTP
    import os

    os.environ.update(DEPLOY_HOST="h", DEPLOY_USER="u", DEPLOY_PASS="p")
    assert deploy.main([]) == 0


def test_two_deploys_are_incremental_and_never_touch_protected():
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        protected = {"_archive-2026-09-30/index.php": b"old", ".ftpquota": b"q", "cgi-bin/x": b"c"}
        server = FakeServer(protected)
        v1 = {
            "index.html": b"root",
            ".htaccess": b"rules",
            "en/index.html": b"en1",
            "en/old/index.html": b"old",
            "_next/static/a.js": b"a",
        }
        _run(tmp, server, v1)
        manifest = json.loads(server.files[".deploy-manifest.json"])["files"]
        assert set(manifest) == set(v1)
        assert ".deploy-journal.json" not in server.files
        # .htaccess is the last site file swapped in
        site_renames = [p for op, p in server.log if op == "RENAME" and p != ".deploy-manifest.json"]
        assert site_renames[-1] == ".htaccess"

        server.log.clear()
        v2 = {
            "index.html": b"root",
            ".htaccess": b"rules",
            "en/index.html": b"en2",
            "_next/static/b.js": b"b",
        }
        _run(tmp, server, v2)
        ops = server.log
        # only what changed was uploaded; html went through tmp + rename
        assert ("STOR", "_next/static/b.js") in ops
        assert ("STOR", "en/index.html.deploy-tmp") in ops and ("RENAME", "en/index.html") in ops
        assert ("STOR", "en/index.html") not in ops
        assert not any(p in ("index.html", ".htaccess", "index.html.deploy-tmp") for _, p in ops)
        # asset before swap, swap before deletes
        idx = {op_p: i for i, op_p in enumerate(ops)}
        assert idx[("STOR", "_next/static/b.js")] < idx[("RENAME", "en/index.html")] < idx[("DELE", "_next/static/a.js")]
        assert ("DELE", "en/old/index.html") in ops and ("RMD", "en/old") in ops
        for _, p in ops:
            assert not deploy.is_protected(p), p
        for rel, body in protected.items():
            assert server.files[rel] == body
        assert not any(k.endswith(".deploy-tmp") for k in server.files)


def test_rerun_after_crash_cleans_tmp_and_orphans():
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        server = FakeServer()
        server.dirs |= {"en", "tmpdir"}
        # State left by a crashed run: journal, a stale tmp, an orphan file, no manifest.
        server.files.update(
            {
                ".deploy-journal.json": json.dumps(
                    {"touched": ["tmpdir/orphan.html", "en/index.html"], "tmp": ["en/index.html.deploy-tmp"]}
                ).encode(),
                "en/index.html.deploy-tmp": b"half",
                "tmpdir/orphan.html": b"orphan",
                "en/index.html": b"half-new",
            }
        )
        _run(tmp, server, {"index.html": b"r", "en/index.html": b"final"})
        assert server.files["en/index.html"] == b"final"
        assert "en/index.html.deploy-tmp" not in server.files
        assert "tmpdir/orphan.html" not in server.files and "tmpdir" not in server.dirs
        assert ".deploy-journal.json" not in server.files


def test_crash_during_cleanup_is_finished_by_next_run():
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        server = FakeServer()
        _run(tmp, server, {"index.html": b"1", "en/old/index.html": b"old"})

        class Flaky(FakeFTP):
            def delete(self, rel):
                if rel == "en/old/index.html":
                    raise OSError("connection reset")
                return super().delete(rel)

        retries = deploy.RETRIES
        deploy.RETRIES = 1
        try:
            try:
                _run(tmp, server, {"index.html": b"2"}, Flaky)
            except OSError:
                pass
            else:
                raise AssertionError("expected the flaky delete to abort the run")
        finally:
            deploy.RETRIES = retries
        # manifest already swapped (no longer lists the old page), journal still present
        assert "en/old/index.html" not in json.loads(server.files[".deploy-manifest.json"])["files"]
        assert "en/old/index.html" in json.loads(server.files[".deploy-journal.json"])["touched"]

        _run(tmp, server, {"index.html": b"2"})  # same build, healthy connection
        assert "en/old/index.html" not in server.files and "en/old" not in server.dirs
        assert ".deploy-journal.json" not in server.files


def test_safety_violation_aborts():
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        server = FakeServer()
        FakeFTP.server = server
        deploy.ReusingFTP_TLS = FakeFTP
        remote = deploy.Remote("h", 21, "u", "p", ".")
        for call in (
            lambda: remote.delete("_archive-2026-09-30/index.php"),
            lambda: remote.put(".well-known/x", b""),
            lambda: remote.rename("a.deploy-tmp", "cgi-bin/a"),
            lambda: remote.rmdir("_archive-2026-09-30"),
        ):
            try:
                call()
            except deploy.SafetyError:
                continue
            raise AssertionError("expected SafetyError")
        assert server.log == []


if __name__ == "__main__":
    tests = [(n, f) for n, f in sorted(globals().items()) if n.startswith("test_") and callable(f)]
    for name, fn in tests:
        fn()
        print(f"ok  {name}")
    print(f"{len(tests)} passed")
