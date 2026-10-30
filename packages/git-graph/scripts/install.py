#!/usr/bin/env python3
"""Install the tracked layouts/mods into an explicit Herdr app home."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parents[1]
ENTRIES = ("layouts/main-graph.json", "layouts/main-graph.svg",
           "mods/tabs-graph", "mods/git-graph")
MANIFEST = ".herdr-app-mono-install.json"
GENERATED = {"gpui-kit.d.ts", "herdr.d.ts", "jsconfig.json"}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def sources():
    files = {}
    for entry in ENTRIES:
        source = ROOT / entry
        for path in sorted(source.rglob("*") if source.is_dir() else [source]):
            if path.is_file() and path.name not in GENERATED and not path.name.endswith(".error"):
                files[path.relative_to(ROOT).as_posix()] = path.read_bytes()
    return files


def atomic_write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def install(home):
    home = home.expanduser().resolve(strict=True)
    manifest = home / MANIFEST
    if manifest.is_symlink():
        raise ValueError(f"Installation manifest is a symlink: {manifest}")
    previous = None
    # pi-lens-ignore: unchecked-throwing-call-python
    if manifest.exists():
        try:
            previous = json.loads(manifest.read_text())
        except (OSError, json.JSONDecodeError) as error:
            raise ValueError(f"Cannot read installation manifest {manifest}: {error}") from error
    files = sources()
    # Preflight the entire package before touching the user's configuration.
    for entry in ENTRIES:
        target = home / entry
        if previous is None and (target.exists() or target.is_symlink()):
            raise ValueError(f"Name already exists: {target}")
        for part in (target, *target.parents):
            if part == home:
                break
            if part.is_symlink():
                raise ValueError(f"Symlink in destination: {part}")
    if previous is not None:
        if set(previous) != set(files):
            raise ValueError("Package file list changed; reconcile the installation before updating")
        for name, expected in previous.items():
            target = home / name
            if not target.is_file() or target.is_symlink() or digest(target.read_bytes()) != expected:
                raise ValueError(f"Installed file changed; preserve or reconcile it first: {target}")
    for name, data in files.items():
        target = home / name
        if previous is None or previous[name] != digest(data):
            atomic_write(target, data)
    atomic_write(manifest, (json.dumps({name: digest(data) for name, data in files.items()}, indent=2) + "\n").encode())
    return len(files)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("home", type=Path, help="Existing Herdr app home (e.g. ~/.config/herdr-app)")
    args = parser.parse_args()
    try:
        count = install(args.home)
    except (OSError, ValueError) as error:
        parser.exit(1, f"Install stopped: {error}\n")
    print(f"Installed {count} files into {args.home.expanduser().resolve()}")
    print("Validate: herdr-app check <home>/mods/{tabs-graph,git-graph}")
    print('Open: herdr-app do layout.switch \'{"name":"main-graph"}\'')
