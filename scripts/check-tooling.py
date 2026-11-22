"""Validate tracked tooling metadata and the bundled Spec Kit installation."""

import hashlib
import json
from pathlib import Path
import subprocess
import tomllib


ROOT = Path(__file__).resolve().parents[1]


# The hosting contract (docs/hosting.md): these headers on every path.
ISOLATION_HEADERS = {
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-embedder-policy": "require-corp",
}


def check_headers():
    """public/_headers must send exactly the isolation headers on every path."""
    rules, path = {}, None
    for line in (ROOT / "public/_headers").read_text().splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if not line[0].isspace():
            path = line.strip()
            rules[path] = {}
            continue
        name, value = line.split(":", 1)
        rules[path][name.strip().lower()] = value.strip()
    if rules != {"/*": ISOLATION_HEADERS}:
        raise ValueError("public/_headers must have one /* rule with exactly the isolation headers")


def main():
    tracked = subprocess.check_output(
        ["git", "ls-files", "-z"], cwd=ROOT
    ).decode().split("\0")
    for name in filter(None, tracked):
        path = ROOT / name
        if path.suffix == ".json":
            json.loads(path.read_text())
        elif path.suffix == ".toml" or path.name == "uv.lock":
            tomllib.loads(path.read_text())

    check_headers()

    count = 0
    for manifest in sorted((ROOT / ".specify/integrations").glob("*.manifest.json")):
        for name, expected in json.loads(manifest.read_text())["files"].items():
            actual = hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
            if actual != expected:
                raise ValueError(f"Manifest mismatch: {name}")
            count += 1

    for script in sorted((ROOT / ".specify/scripts/bash").glob("*.sh")):
        subprocess.run(["bash", "-n", str(script)], check=True)

    result = subprocess.check_output(
        ["bash", ".specify/scripts/bash/resolve-template.sh", "spec-template", "--json"],
        cwd=ROOT,
    )
    template = json.loads(result)
    if not template.get("TEMPLATE_CONTENT"):
        raise ValueError("Spec template is empty")
    subprocess.run(["git", "diff", "--check"], cwd=ROOT, check=True)
    print(f"Tooling metadata, {count} manifest hashes, Bash and template: OK")


if __name__ == "__main__":
    main()
