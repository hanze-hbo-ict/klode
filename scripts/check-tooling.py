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


# Diagnostics comparison pages (#56) deliberately replace the isolation headers.
DIAGNOSTICS_RULES = {
    "/diagnostics/credentialless/*": [
        "! Cross-Origin-Embedder-Policy",
        "Cross-Origin-Embedder-Policy: credentialless",
    ],
    "/diagnostics/no-isolation/*": [
        "! Cross-Origin-Opener-Policy",
        "! Cross-Origin-Embedder-Policy",
    ],
}


def check_headers():
    """public/_headers: the isolation headers on every path, plus the diagnostics rules."""
    rules, path = {}, None
    for line in (ROOT / "public/_headers").read_text().splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if not line[0].isspace():
            path = line.strip()
            if path in rules:
                raise ValueError(f"public/_headers repeats a rule: {path}")
            rules[path] = []
            continue
        rules[path].append(line.strip())
    everywhere = {}
    for line in rules.pop("/*", []):
        name, value = line.split(":", 1)
        everywhere[name.strip().lower()] = value.strip()
    if everywhere != ISOLATION_HEADERS:
        raise ValueError("public/_headers /* rule must have exactly the isolation headers")
    if rules != DIAGNOSTICS_RULES:
        raise ValueError("public/_headers has unexpected rules besides /* and the diagnostics rules")


def check_diagnostics_config():
    """The diagnostics config copies the editor headers and the runtime path."""
    config = json.loads((ROOT / "public/diagnostics/config.json").read_text())
    if {k.lower(): v for k, v in config["headers"].items()} != ISOLATION_HEADERS:
        raise ValueError("public/diagnostics/config.json headers must be the isolation headers")
    package = json.loads((ROOT / "package.json").read_text())
    runtime = f"../runtime/{package['devDependencies']['pyodide']}/"
    urls = [r["url"] for r in config["resources"]] + [config["appCheck"]["options"]["runtime"]]
    if any(not url.startswith(runtime) for url in urls):
        raise ValueError(f"public/diagnostics/config.json runtime URLs must start with {runtime}")


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
    check_diagnostics_config()

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
