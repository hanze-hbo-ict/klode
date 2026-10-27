"""Validate tracked tooling metadata and the bundled Spec Kit installation."""

import hashlib
import json
from pathlib import Path
import subprocess
import tomllib


ROOT = Path(__file__).resolve().parents[1]


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

    package = json.loads((ROOT / "package.json").read_text())
    host = tomllib.loads((ROOT / "netlify.toml").read_text())
    npm = package["packageManager"].removeprefix("npm@")
    if host["build"]["environment"]["NPM_VERSION"] != npm:
        raise ValueError("Netlify NPM_VERSION must match package.json packageManager")

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
