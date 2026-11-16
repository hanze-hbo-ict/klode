"""Validate tracked tooling metadata and the bundled Spec Kit installation."""

import hashlib
import json
from pathlib import Path
import subprocess
import tomllib


ROOT = Path(__file__).resolve().parents[1]


def check_cloudflare_headers(host):
    """Cloudflare Pages must send exactly the Netlify headers for every path."""
    netlify = [rule for rule in host["headers"] if rule["for"] == "/*"]
    if len(netlify) != 1:
        raise ValueError("netlify.toml must have exactly one /* header rule")
    expected = {k.lower(): v for k, v in netlify[0]["values"].items()}
    actual, path = {}, None
    for line in (ROOT / "cloudflare/_headers").read_text().splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if not line[0].isspace():
            path = line.strip()
            continue
        if path != "/*":
            raise ValueError(f"cloudflare/_headers has an unexpected rule: {path}")
        name, value = line.split(":", 1)
        actual[name.strip().lower()] = value.strip()
    if actual != expected:
        raise ValueError("cloudflare/_headers must match the netlify.toml headers")


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
    check_cloudflare_headers(host)

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
