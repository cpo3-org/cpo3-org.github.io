---
title: Installation
description: Install cpo3 for Python or Rust, select optional backends, or build from source.
tableOfContents:
  maxHeadingLevel: 2
---

cpo3 is available on [PyPI](https://pypi.org/project/cpo3/) and
[crates.io](https://crates.io/crates/cpo3). The default Faer backend needs no
external numerical libraries. After installation, continue to
[Getting started](/site/getting-started/) or the
[mixed-constraint example](/site/examples/mixed-constraints/).

## Python

Use Python **3.10 or later**, preferably in a virtual environment. Install the
released package into the environment you will use to run your scripts:

```sh
python -m pip install cpo3==0.0.1
```

NumPy and SciPy are installed as dependencies. Verify the installation:

```sh
python -c "import cpo3; print(cpo3.LinearSolver.FAER.is_available())"
```

This should print `True`. Run examples with the same interpreter:

```sh
python example.py
```

Release wheels are available for macOS 13 or later on Apple Silicon and Intel,
Windows x86-64, and Linux x86-64 with glibc 2.28 or later. Installing a compatible
wheel does not require Rust. On other platforms, pip may build from source;
see [source builds](#building-from-source) for the toolchain requirements.

## Rust

Install [Rust 1.91 or later](https://www.rust-lang.org/tools/install), including
the platform linker required by the Rust toolchain. Create an application:

```sh
cargo new cpo3-example
cd cpo3-example
cargo add cpo3@0.0.1
```

For an existing application, add the dependency under its existing
`[dependencies]` section instead:

```toml title="Cargo.toml"
[dependencies]
cpo3 = "0.0.1"
```

The [Rust example](/site/getting-started/#solve-the-problem) can replace `src/main.rs`.
Build numerical workloads in release mode:

```sh
cargo run --release
```

Enable the `mps` feature if you need to read MPS or QPS files. Optional
factorization backends use the `accelerate`, `cholmod`, and `pardiso` features.
For example, to add file loading:

```toml title="Cargo.toml"
[dependencies]
cpo3 = { version = "0.0.1", features = ["mps"] }
```

## Optional factorization backends

The Python release wheels include these integrations:

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
git clone https://github.com/cpo3-org/cpo3.git
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

To use the development version in a Rust application, replace the released
dependency with:

```toml title="Cargo.toml"
[dependencies]
cpo3 = { git = "https://github.com/cpo3-org/cpo3.git" }
```

Add `features = ["mps"]` or the desired backend features to the same dependency
entry as needed. Use a `rev` field to pin a Git revision for reproducible builds.
