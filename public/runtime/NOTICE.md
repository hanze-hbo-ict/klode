# Bundled Python runtime

Builds copy the unmodified Pyodide 314.0.7 core from the exact npm dependency,
whose archive integrity is pinned in package-lock.json. Per-file SHA-256 checks
are in runtime-config.js. Generated runtime binaries are excluded from
Git but included in dist by Vite. The build needs no runtime CDN download.

Pyodide is © the Pyodide contributors, Mozilla Public License 2.0; see
PYODIDE-LICENSE.txt and https://github.com/pyodide/pyodide/tree/314.0.7.
The runtime includes CPython and Emscripten dependencies under their respective
licenses. CPYTHON-LICENSE.txt is the CPython 3.14.2 notice and
EMSCRIPTEN-LICENSE.txt is Emscripten 5.0.3's notice, matching the runtime lock
metadata. Sources: https://github.com/python/cpython/blob/v3.14.2/LICENSE and
https://github.com/emscripten-core/emscripten/blob/5.0.3/LICENSE.
This notice is not a claim that Pyodide's MPL replaces those component licenses.
