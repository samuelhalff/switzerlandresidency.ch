"""Tests for the pure planning logic of scripts/deploy-ftp.py.

Run: python3 -m pytest scripts/tests   (or, without pytest: python3 scripts/tests/test_deploy_plan.py)
"""
import importlib.util
import sys
from pathlib import Path

_path = Path(__file__).resolve().parent.parent / "deploy-ftp.py"
_spec = importlib.util.spec_from_file_location("deploy_ftp", _path)
deploy = importlib.util.module_from_spec(_spec)
sys.modules["deploy_ftp"] = deploy
_spec.loader.exec_module(deploy)

PROTECTED = [
    "_archive-2026-09-30/index.php",
    "_archive-x/.htaccess",
    ".ftpquota",
    ".well-known/acme-challenge/token",
    "cgi-bin/script.cgi",
]
RESERVED = [".deploy-manifest.json", ".deploy-journal.json", "en/index.html.deploy-tmp"]
UNSAFE = ["../etc/passwd", "/abs/path", "en//x.html", "en/./x.html", "a\\b"]


def all_phase_paths(plan):
    paths = plan.assets + plan.swaps + plan.deletes + plan.rmdirs
    return paths + [t[: -len(deploy.TMP_SUFFIX)] for t in plan.stale_tmps]


def test_bootstrap_uploads_everything_and_deletes_nothing():
    new = {"index.html": "a", "en/index.html": "b", "_next/static/x.js": "c", ".htaccess": "d"}
    p = deploy.plan_deploy(None, new)
    assert sorted(p.uploads) == sorted(new)
    assert p.assets == ["_next/static/x.js"]
    assert p.deletes == [] and p.rmdirs == []
    assert p.swaps[-1] == ".htaccess"


def test_unchanged_files_are_skipped():
    m = {"index.html": "a", "_next/static/x.js": "c"}
    p = deploy.plan_deploy(m, dict(m))
    assert p.empty() and p.unchanged == 2


def test_changed_new_and_removed_files():
    old = {"en/index.html": "1", "_next/static/old.js": "o", "en/gone/index.html": "g", "images/a.webp": "i"}
    new = {"en/index.html": "2", "_next/static/new.js": "n", "images/a.webp": "i", "fr/index.html": "f"}
    p = deploy.plan_deploy(old, new)
    assert p.assets == ["_next/static/new.js"]
    assert p.swaps == ["en/index.html", "fr/index.html"]
    assert p.deletes == ["_next/static/old.js", "en/gone/index.html"]  # deepest first, then a-z
    assert p.rmdirs == ["en/gone"]  # _next/static and en still hold new files
    assert p.unchanged == 1


def test_asset_classification():
    assert deploy.is_asset("_next/static/chunks/a.js")
    assert deploy.is_asset("images/photo.webp")
    assert deploy.is_asset("fonts/x.woff2")
    assert deploy.is_asset("some/dir/font.woff2")
    for rel in ("index.html", "en/index.txt", "sitemap.xml", ".htaccess", "favicon.ico", "apple-icon.png", "icon.svg"):
        assert not deploy.is_asset(rel), rel


def test_htaccess_swapped_last_deepest_first():
    new = {".htaccess": "1", "sub/.htaccess": "2", "z.html": "3", "a.html": "4", "en/index.html": "5"}
    p = deploy.plan_deploy(None, new)
    assert p.swaps == ["a.html", "en/index.html", "z.html", "sub/.htaccess", ".htaccess"]


def test_failed_run_journal_forces_reupload_and_deletes_orphans():
    old = {"en/index.html": "1"}
    new = {"en/index.html": "1", "fr/index.html": "2"}
    touched = ["en/index.html", "orphan/page.html"]
    tmps = ["en/index.html.deploy-tmp", "orphan/page.html.deploy-tmp", "not-a-tmp.html"]
    p = deploy.plan_deploy(old, new, touched, tmps)
    assert p.swaps == ["en/index.html", "fr/index.html"]  # en forced despite identical hash
    assert p.deletes == ["orphan/page.html"]
    assert p.rmdirs == ["orphan"]
    assert p.stale_tmps == ["en/index.html.deploy-tmp", "orphan/page.html.deploy-tmp"]


def test_protected_paths_never_in_any_phase():
    old = {r: "old" for r in PROTECTED}
    new = {r: "new" for r in PROTECTED}
    new["index.html"] = "x"
    tmps = [r + deploy.TMP_SUFFIX for r in PROTECTED]
    for o, n in ((old, new), (None, new), (old, {"index.html": "x"}), (dict(old, **{"index.html": "y"}), new)):
        p = deploy.plan_deploy(o, n, touched=PROTECTED, stale_tmps=tmps)
        for rel in all_phase_paths(p):
            assert not deploy.is_protected(rel), rel
        assert set(PROTECTED) <= set(p.skipped)
    assert deploy.plan_deploy(old, {"index.html": "x"}, PROTECTED, tmps).deletes == []


def test_protected_directories_never_removed():
    # A protected file listed in the old manifest must not make its directory an rmdir candidate.
    p = deploy.plan_deploy({"_archive-1/a/b.html": "1", "cgi-bin/x": "2"}, {})
    assert p.deletes == [] and p.rmdirs == []


def test_reserved_and_unsafe_paths_are_filtered():
    bad = RESERVED + UNSAFE
    p = deploy.plan_deploy({r: "1" for r in bad}, {r: "2" for r in bad}, touched=bad)
    assert p.empty()
    assert sorted(p.skipped) == sorted(bad)


def test_assert_safe():
    assert deploy.assert_safe("en/index.html") == "en/index.html"
    assert deploy.assert_safe("_archivexyz/ok.html")  # only the "_archive-" prefix is protected
    assert deploy.assert_safe("en/_archive-2026/x.html")  # protection is on the first segment only
    for rel in PROTECTED + UNSAFE + ["", "_archive-2026-09-30", ".well-known"]:
        try:
            deploy.assert_safe(rel)
        except deploy.SafetyError:
            continue
        raise AssertionError(f"assert_safe accepted {rel!r}")


def test_describe_mentions_every_phase():
    p = deploy.plan_deploy({"a/old.html": "1"}, {"_next/x.js": "1", "b.html": "2"})
    text = deploy.describe(p)
    for label in ("phase 1 assets", "phase 2 swaps", "cleanup deletes", "cleanup rmdirs", "unchanged"):
        assert label in text


if __name__ == "__main__":
    tests = [(n, f) for n, f in sorted(globals().items()) if n.startswith("test_") and callable(f)]
    for name, fn in tests:
        fn()
        print(f"ok  {name}")
    print(f"{len(tests)} passed")
