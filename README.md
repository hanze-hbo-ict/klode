# Klode

A little room for Python. One file. One idea at a time.

**[Open Klode →](https://klode.app/)**

Write and run a Python program in `main.py`, inspect its output and answer
`input()` prompts directly in the console while it runs. The editor provides syntax highlighting and
automatic indentation, plus bracket/quote closing and bracket matching, with no code suggestions
or AI assistance. Stop a running
program, correct an error and try again. Choose a light, dark or system theme.

Klode is a small, general online Python editor. Use it to explore an idea,
practise an exercise or teach a lesson. Copy your code using ordinary selection
and your browser's copy command. There are no accounts or multi-file projects.
Keep a copy of anything you want to save; source recovery after reload is not a
supported workflow.

Python runs through Pyodide in a browser worker. The supported standard library
is available; extra packages, user file workflows and graphics are outside the
current scope. Desktop processes and ordinary native sockets are unavailable.
Student code is not a security sandbox.

The public site runs the approved `main` version; changes on other branches become
available after review and release. Teaching and exams are use cases; validation
on the actual restricted school Windows/Edge environment, including
copying into ans.app, remains a separate
[acceptance track](https://github.com/hanze-hbo-ict/klode/issues/13).

## Run locally

Use Node 24.19.0 and npm 11.16.0 (see [.node-version](.node-version)):

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. For a production build and local preview:

```bash
npm run build
npm run preview
```

Builds package the pinned Python runtime from locked npm dependencies. Application
and runtime assets are served from the same origin, without a runtime CDN.
Hosting requires HTTPS and cross-origin isolation headers; see the
[hosting guide](docs/hosting.md).

## Contribute

Bug reports and suggestions are welcome in
[GitHub issues](https://github.com/hanze-hbo-ict/klode/issues). See
[CONTRIBUTING](CONTRIBUTING.md) for the human and agent workflow, checks and review.
The [product overview](specs/product.md) describes the agreed scope;
[development tooling](docs/development.md) explains the local Spec Kit setup.

Klode is available under the [MIT license](LICENSE). See
[third-party notices](THIRD_PARTY_NOTICES.md),
[runtime notices](public/runtime/NOTICE.md) and
[editor dependency licenses](public/editor-licenses.txt).
