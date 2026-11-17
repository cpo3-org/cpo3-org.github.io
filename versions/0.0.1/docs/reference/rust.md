---
title: Rust API
description: Construct sparse problems, borrow solver inputs, and handle results and errors in Rust.
tableOfContents:
  maxHeadingLevel: 2
---

For exhaustive signatures, see the
[generated Rust API documentation](https://docs.rs/cpo3/0.0.1/cpo3/).
The [shared conventions](/site/reference/) define the mathematical formulation and
result meanings; [Settings](/site/settings/#rust-settings) describes configuration.

## Constructing a problem

`Problem::new(p, c, a, b, cones)` takes ownership of its matrices and vectors
and returns `Result<Problem, ProblemError>`. Use `None` for the quadratic
matrix of a linear program. When present, `p` must be the full symmetric matrix,
not just one triangle; positive semidefiniteness is a modeling requirement.

See the [worked example](/site/getting-started/#solve-the-problem) for a complete
problem construction and solve.

Use `Cone::Zero(k)` for equality rows and `Cone::Nonnegative(k)` for inequality
rows. Blocks cover consecutive rows and must have positive dimensions summing
to the constraint count. Other cone variants are currently unsupported by the solver.

### Sparse matrices

`CscMatrix` owns double-precision values in compressed sparse column format.
Use the fallible constructors for external data:

| Constructor | Inputs |
| --- | --- |
| `CscMatrix::new` | Row and column counts, column pointers, row indices, and values. |
| `CscMatrix::from_triplets` | Row and column counts, row indices, column indices, and values. |
| `CscMatrix::identity` | The size of a square identity matrix. |
| `CscMatrix::zeros` | Row and column counts for an empty sparse matrix. |

Each returns `Result<CscMatrix, MatrixError>`. Indices are zero-based `usize`
values.
`from_parts` is a lower-level constructor that can panic on invalid structure;
prefer `new` when handling data that may be invalid.

`Problem` exposes borrowed data through `p()`, `c()`, `a()`, `b()`, and `cones()`.
Its stored `p()` contains only the upper triangle after construction.
`dims()` returns **`(m, n)`**, the constraint count followed by the variable count.

## Solving and ownership

`solve(&problem, &settings)` borrows both inputs for the duration of the call
and returns `Result<Solution, SolveError>`. The returned `Solution` owns its
vectors and does not borrow the problem.

See [Rust settings](/site/settings/#rust-settings) for defaults and field types.

### Warm starts

`WarmStart` owns `Vec<f64>` fields named `x`, `y`, and `s`. They have lengths
$n$, $m$, and $m$ and use original problem units. A previous optimal solution
can supply the vectors for another solve:

```rust
use cpo3::{SolverStatus, WarmStart, solve_from};

if solution.status() == SolverStatus::Solved {
    let warm = WarmStart {
        x: solution.x().to_vec(),
        y: solution.y().to_vec(),
        s: solution.s().to_vec(),
    };
    let next = solve_from(&problem, &settings, Some(&warm))?;
    println!("{:?}", next.info().warm_start_used);
}
```

`solve_from` borrows the warm start. Supplying `None` is equivalent to a cold
solve. Values must be finite and dimensions must match the problem being solved.
Acceptance is reported in `solution.info().warm_start_used`; see
[warm-start screening](/site/solver-details/#initialization-and-warm-starts).

## Accessing results

`solution.status()` returns a `SolverStatus`; see
[termination statuses](/site/reference/#termination-statuses).

`solution.x()`, `y()`, and `s()` return borrowed slices without copying.
`solution.info()` borrows a `SolutionInfo` with public fields.

| Access | Rust representation |
| --- | --- |
| `info.pobj`, `dobj`, `pres`, `dres`, `comp` | Objective and residual values as `f64`. |
| `info.iters` | Solver iteration count as `usize`. |
| `info.solve_time`, `presolve_time` | `Duration`. |
| `info.warm_start_used`, `cvxopt_init_used` | `Option<bool>`. |
| `info.presolve_rows_removed`, `presolve_columns_removed` | Counts as `usize`. |
| `info.linear_solver` | A `LinearSolver` enum value. |
| `info.linear_algebra` | Factorization, primary solve, refinement, and LSMR counters. |

Linear-algebra counters are nested, for example
`solution.info().linear_algebra.refinement_solves`.
[Conventions](/site/reference/#solutions-and-diagnostics) defines the fields.

## Errors

Ordinary termination, including limits and infeasibility certificates, returns
`Ok(Solution)`. Exceptional failures return `Err`:

| Error type | Meaning |
| --- | --- |
| `MatrixError` | Sparse-matrix construction failed. |
| `ProblemError` | Dimensions, symmetry, finiteness, or cone layout are invalid. |
| `SolveError::InvalidSetting` | A solver setting or warm-start input is invalid. |
| `SolveError::Unimplemented` | A requested cone is unsupported. |
| `SolveError::Numerical` | A numerical solve failed, including an unavailable backend. |

`SolveError` and `SolverStatus` are non-exhaustive enums.

## Features and problem files

Enable the `mps` feature to expose `cpo3::mps`. Use
`cpo3::mps::read("problem.mps")` to read MPS or QPS files. It returns
`Result<Problem, MpsError>`.

To accept the first of multiple named RHS, RANGES, or BOUNDS sets, use
`mps::read_with(path, mps::MpsOptions { first_named_set: true })`.
By default, files with multiple named sets are rejected.
