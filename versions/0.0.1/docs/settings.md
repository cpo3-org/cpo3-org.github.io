---
title: Settings
description: Solver controls, stopping tolerances, initialization, and factorization backends.
tableOfContents:
  maxHeadingLevel: 3
---

`Settings` is an immutable, keyword-only dataclass. Defaults below are for
**cpo3 0.0.1**.

```python
settings = cpo3.Settings(verbose=True, time_limit=30.0, threads=1)
solution = cpo3.solve(problem, settings=settings)
```

See [Solver details](/solver-details/) for how these controls enter the
algorithm and linear solves.

## Run controls

| Setting | Default | Meaning |
| --- | --- | --- |
| `max_iters` | `100` | Maximum interior-point iterations; must be positive. Equality-only problems use `eq_lsmr_iters` instead. |
| `time_limit` | `None` | Nonnegative elapsed-time limit in seconds, including presolve. `None` disables it. Checked at solver checkpoints; it does not interrupt a factorization already in progress. |
| `verbose` | `False` | Print settings, progress, and the final summary. |
| `presolve` | `True` | Simplify the problem and recover results in the original coordinates. |

Iteration limits and
`threads` must be nonnegative integers, with `max_iters` strictly positive.

## Termination tolerances

| Setting | Default | Meaning |
| --- | --- | --- |
| `tol_feas` | `1e-8` | Positive tolerance for primal and dual residuals, scaled by their equations as described below. |
| `tol_gap_abs` | `1e-8` | Positive absolute duality-gap tolerance. |
| `tol_gap_rel` | `1e-8` | Positive relative duality-gap tolerance. |

The [stopping criteria](/solver-details/#stopping-criteria) define the residual
scales and gap tests. [Certificate tolerances](#infeasibility-detection) are separate.

## Factorization backends

| Setting | Default | Meaning |
| --- | --- | --- |
| `linear_solver` | `LinearSolver.FAER` | Factorization backend for the interior-point path. |
| `threads` | `0` | Maximum parallelism; zero uses the backend default, one requests sequential execution. Accelerate requires zero. |

`cpo3.LinearSolver` selects the backend. `is_available()` checks the current
build and runtime:

```python
available = [solver for solver in cpo3.LinearSolver if solver.is_available()]
```

Rust exposes the same check, for example `LinearSolver::Cholmod.is_available()`.

| Backend | Threading |
| --- | --- |
| `FAER` | Honors `threads`. |
| `ACCELERATE` | Requires `threads=0`; no per-solve thread cap is available. |
| `CHOLMOD` | `threads` caps OpenMP work; simplicial LDL factorization is sequential. |
| `PARDISO` | Uses MKL's thread-local limit. |

The [installation guide](/installation/#optional-factorization-backends)
contains platform and library setup instructions. Selecting an unavailable
backend does not silently substitute another. Equality-only problems use Faer
regardless of this selection.

## Rust settings

Settings have the same names and numerical defaults as in Python, with Rust
booleans and enum variants such as `LinearSolver::Faer`. `time_limit` is an
`Option<Duration>` and `eq_lsmr_iters` is an `Option<usize>`.

`Settings::default()` constructs the defaults.

## Advanced settings

### Infeasibility detection

| Setting | Default | Meaning |
| --- | --- | --- |
| `tol_infeas_abs` | `1e-8` | Nonnegative threshold for a negative certificate slope: $b^\mathsf{T}y$ or $c^\mathsf{T}x$. |
| `tol_infeas_rel` | `1e-8` | Nonnegative tolerance for certificate residuals normalized by the certificate slope and ray norms. |
| `certificate_ktratio` | `1e9` | Homogeneous ratio $\kappa/\tau$ above which the interior-point path considers certificates; must be at least one. |

### Initialization and equilibration

| Setting | Default | Meaning |
| --- | --- | --- |
| `force_warm_start` | `False` | Use the best finite interior warm-start candidate even if it fails the score threshold. Has no effect without a warm start or on equality-only problems. |
| `cvxopt_init` | `False` | Try a CVXOPT/Clarabel-style linear-system initialization when no warm start is accepted; fall back to the canonical spherical point on failure. |
| `initial_mu` | `1.0` | Initial complementarity for the canonical spherical point; must lie in $(0,1]$. Does not affect accepted warm or CVXOPT-style starts, or equality-only problems. |
| `ruiz_iters` | `2` | Maximum Ruiz equilibration passes; zero disables equilibration. |
| `ruiz_tol` | `1e-2` | Nonnegative stopping tolerance for nonzero, cone-compatible augmented row infinity norms relative to one. |
| `step_fraction` | `0.999` | Fraction of the step to the cone boundary; must lie strictly between zero and one. |

### Linear systems and refinement

| Setting | Default | Meaning |
| --- | --- | --- |
| `eliminate_bounds` | `True` | Fold single-nonzero nonnegative-cone rows into the primal diagonal of the KKT system. |
| `refine_init_reg` | `1e-12` | Initial nonnegative diagonal-magnitude floor for KKT factorization. Adapted during the solve; zero starts at the lower bound `1e-20`. |
| `refine_iters` | `30` | Maximum correction solves per KKT right-hand side. Zero keeps the initial solve without corrections. |
| `refine_tol` | `1e-7` | Positive componentwise backward-error target. Refinement may stop earlier if further corrections are unlikely to help. |

See [regularization and refinement](/solver-details/#regularization-and-refinement)
for the target system and adaptive factorization floor.

### Equality-only problems

These controls replace `max_iters`, `refine_iters`, `refine_tol`, and
`refine_init_reg` on the [equality-only path](/solver-details/#equality-only-problems).

| Setting | Default | Meaning |
| --- | --- | --- |
| `eq_lsmr_iters` | `None` | Maximum LSMR iterations. `None` uses `max(4 * (m + n), 32)` after presolve. Zero skips LSMR iterations but still checks the initial point. |
| `eq_refine_iters` | `10` | Maximum refinement corrections after the direct solve, before LSMR. Zero proceeds directly to LSMR if needed. |
