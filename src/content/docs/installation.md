---
title: Installation
description: Install cpo3 for Python or Rust, select optional backends, or build from source.
tableOfContents:
  maxHeadingLevel: 2
---

These instructions install the development version from `main`. For published
packages, select the latest release in the version menu. The default Faer
backend needs no external numerical libraries.

## Python

Requires Python **3.10 or later**, Rust **1.91 or later**, Git, and a platform
C/C++ build toolchain.

```sh
python -m pip install "cpo3 @ git+https://github.com/cpo3-org/cpo3.git@main"
```

NumPy and SciPy are installed as dependencies.

This builds the Python extension from source. For an editable checkout and
optional backend features, see [source builds](#building-from-source).

## Rust

Requires Rust **1.91 or later**. Add cpo3 to `Cargo.toml`:

```toml title="Cargo.toml"
[dependencies]
cpo3 = { git = "https://github.com/cpo3-org/cpo3.git", branch = "main" }
```

Use Cargo's release profile when measuring solver performance: debug builds
disable compiler optimizations and can substantially increase solve times.

Enable the `mps` feature if you need to read MPS or QPS files. Optional
factorization backends use the `accelerate`, `cholmod`, and `pardiso` features.
For example, to add file loading:

```toml title="Cargo.toml"
[dependencies]
cpo3 = { git = "https://github.com/cpo3-org/cpo3.git", branch = "main", features = ["mps"] }
```

## Optional factorization backends

Development builds use Faer by default. Enable the corresponding build features
to use optional backends. For comparison, the Python release wheels include:

| Platform | Included integrations |
| --- | --- |
| macOS Apple Silicon and Intel | Faer, Accelerate, CHOLMOD |
| Linux x86-64 and Windows x86-64 | Faer, CHOLMOD, PARDISO |

CHOLMOD and PARDISO also need separately installed shared libraries. Installing
an integration does not select it automatically; Faer remains the default.

### Accelerate

Accelerate uses the system framework on macOS 13 or later. No separate
numerical library installation is needed. Select it with
`linear_solver=cpo3.LinearSolver.ACCELERATE` and `threads=0`.

### CHOLMOD

Install a SuiteSparse distribution providing **CHOLMOD 5.2.x or 5.3.x**.
For example, in a Conda environment:

```sh
conda install -c conda-forge "libcholmod>=5.2,<5.4"
```

Install and run cpo3 in that same environment so its libraries are discoverable.
Other SuiteSparse installations are usable if they provide a supported shared
library. Set `CPO3_CHOLMOD` to its full path before starting Python when automatic
discovery fails; the library's dependencies must also be discoverable.

### PARDISO

Install the Intel oneMKL shared runtime, for example in a Conda environment:

```sh
conda install -c conda-forge mkl
```

Run cpo3 in that environment. If discovery fails, set `CPO3_MKL_RT` to the full
path of the MKL runtime library before starting Python. Its dependencies must
also be discoverable by the system loader.

### Check availability

```python
import cpo3

for solver in cpo3.LinearSolver:
    print(solver.value, solver.is_available())
```

In Rust, use the corresponding enum method, for example
`LinearSolver::Cholmod.is_available()`. See
[backend selection and threading](/site/settings/#factorization-backends) for the
runtime controls. Equality-only problems always use Faer.

## Building from source

Source builds use Faer by default. You need Rust 1.91 or later, a platform C/C++
build toolchain, and Git. For Python, also install Python 3.10 or later and
[uv](https://docs.astral.sh/uv/getting-started/installation/).

### Python checkout

```sh
git clone --branch main https://github.com/cpo3-org/cpo3.git
cd cpo3
uv sync
```

Run scripts from the checkout with `uv run python example.py`. This uses the
environment containing the locally built extension. Python source builds also
include MPS/QPS file loading.

To enable an optional backend, pass its build feature. For example, on macOS:

```sh
uv sync --config-setting "build-args=--features=python,mps,accelerate"
uv run --no-sync python example.py
```

Replace `accelerate` with `cholmod` or `pardiso`, or combine the names with commas.
Use `--no-sync` when running a customized build so uv does not rebuild it with
the default feature set. CHOLMOD source builds additionally need compatible
headers, found through `pkg-config` or `CHOLMOD_INCLUDE_DIR`, the directory
containing `cholmod.h`.

### Rust checkout dependency

The Git dependency above tracks `main`. To use a local solver checkout instead:

```toml title="Cargo.toml"
[dependencies]
cpo3 = { path = "../cpo3" }
```

Add `features = ["mps"]` or the desired backend features to the same dependency
entry as needed. For reproducible Git dependencies, replace `branch` with a
`rev` field that pins a specific Git revision.
