---
title: Installation
description: Install cpo3 for Python or Rust, select optional backends, or build from source.
tableOfContents:
  maxHeadingLevel: 2
---

cpo3 is available on [PyPI](https://pypi.org/project/cpo3/) and
[crates.io](https://crates.io/crates/cpo3). The default Faer backend needs no
external numerical libraries.

## Python

Requires Python **3.10 or later**.

```sh
python -m pip install cpo3==0.0.1
```

Release wheels are available for macOS 13 or later on Apple Silicon and Intel,
Windows x86-64, and Linux x86-64 with glibc 2.28 or later. Installing a compatible
wheel does not require Rust. On other platforms, pip may build from source;
see [source builds](#building-from-source) for the toolchain requirements.

## Rust

Requires Rust **1.91 or later**. Add cpo3 to `Cargo.toml`:

```toml title="Cargo.toml"
[dependencies]
cpo3 = "0.0.1"
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

<span id="check-availability"></span>

CHOLMOD and PARDISO require separately installed shared libraries. Backend
selection and availability checks are documented in
[Settings](/settings/#factorization-backends).

### Accelerate

Accelerate uses the system framework on macOS 13 or later; no external
numerical library is required.

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

## Building from source

Source builds use Faer by default. You need Rust 1.91 or later, a platform C/C++
build toolchain, and Git. For Python, also install Python 3.10 or later and
[uv](https://docs.astral.sh/uv/getting-started/installation/).

### Python checkout

```sh
git clone --branch v0.0.1 https://github.com/cpo3-org/cpo3.git
cd cpo3
uv sync
```

Python source builds include MPS/QPS file loading.

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
dependency with the following. This tracks `main`, whose API may differ from
the documented release:

```toml title="Cargo.toml"
[dependencies]
cpo3 = { git = "https://github.com/cpo3-org/cpo3.git" }
```
