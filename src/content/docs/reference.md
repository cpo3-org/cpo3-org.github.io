---
title: Reference
description: Problem data, solver settings, solutions, and termination statuses.
tableOfContents:
  maxHeadingLevel: 2
---

This reference describes the Python interface. The [Rust interface](#rust-interface)
uses the same problem convention and numerical settings.
For a complete example, see [Getting started](/getting-started/).

## Problem data

```python
problem = cpo3.Problem(P=P, c=c, A=A, b=b, cones=cones)
```

The data define

$$
\begin{aligned}
\underset{x,\,s}{\operatorname{minimize}}\quad & \tfrac12 x^\mathsf{T}Px+c^\mathsf{T}x \\
\text{subject to}\quad & Ax+s=b,\qquad s\in\mathcal K.
\end{aligned}
$$

For $n$ variables and $m$ constraint rows:

| Argument | Shape | Meaning |
| --- | --- | --- |
| `P` | $(n,n)$ or `None` | Full symmetric positive semidefinite quadratic matrix. Use `None` for a linear program. |
| `c` | $(n,)$ | Linear objective coefficients. |
| `A` | $(m,n)$ | Constraint matrix. |
| `b` | $(m,)$ | Constraint right-hand side. |
| `cones` | A sequence of cone descriptors | Consecutive blocks of rows defining $\mathcal K$. Their dimensions must sum to $m$. |

`P` and `A` must be SciPy sparse matrices or sparse arrays. They are converted
to CSC format; duplicate entries are summed and indices sorted. Supply the
**full symmetric matrix** `P`, not just one triangle. Positive semidefiniteness
is a modeling requirement; construction checks symmetry but does not certify convexity.

`c` and `b` accept one-dimensional array-like inputs, including lists and NumPy
arrays. Data are converted to double precision and must be finite. Encode
bounds as constraint rows; do not use infinite values in `b`.

`Problem` exposes `P`, `c`, `A`, `b`, `cones`, `variable_count`, and
`constraint_count`. These accessors export the stored data; changing an exported
array does not modify the problem. Construct a new `Problem` to change its data.

### Cone blocks and bounds

| Python descriptor | Constraint on the corresponding rows | Dual multiplier |
| --- | --- | --- |
| `cpo3.ZeroCone(k)` | $s=0$, hence $Ax=b$ | Unrestricted in sign. |
| `cpo3.NonnegativeCone(k)` | $s\geq0$, hence $Ax\leq b$ | $y\geq0$. |

Each block dimension `k` must be a positive integer. For example,
`[cpo3.ZeroCone(2), cpo3.NonnegativeCone(3)]` assigns the first two rows to
equalities and the next three to inequalities.

Variables are unrestricted unless constraints impose bounds. An upper bound
$x_j\leq u$ uses a row $e_j^\mathsf{T}x+s=u$; a lower bound $x_j\geq\ell$
uses $-e_j^\mathsf{T}x+s=-\ell$, both with nonnegative slack.

Only zero and nonnegative cones are currently supported by the solver.
`SecondOrderCone` and `PositiveSemidefiniteCone` descriptors exist in the API,
but attempting to solve with them raises `NotImplementedError`.

## Solving and warm starts

```python
solution = cpo3.solve(problem, settings=None, warm_start=None)
```

Omitting `settings` uses `cpo3.Settings()`. The solve is synchronous and returns
a `Solution` for ordinary termination, including iteration and time limits.
Always inspect `solution.status` before using the returned vectors.

For a related problem with compatible dimensions, supply a previous solution:

```python
solution = cpo3.solve(
    problem,
    settings=cpo3.Settings(verbose=True),
    warm_start=(previous.x, previous.y, previous.s),
)
```

The tuple is ordered **`(x, y, s)`**, with lengths $n$, $m$, and $m$, in the
original problem units. Values must be finite. cpo3 constructs and screens
interior candidates from this point; supplying it does not guarantee that it
will be used. Inspect `solution.info.warm_start_used` to see the outcome.
Equality-only problems skip warm-start initialization.

## Settings

`Settings` is an immutable, keyword-only dataclass. Construct a new instance,
or use `dataclasses.replace`, to change settings. Defaults below match the
current implementation.

```python
settings = cpo3.Settings(verbose=True, time_limit=30.0, threads=1)
solution = cpo3.solve(problem, settings=settings)
```

### Run controls

| Setting | Default | Meaning |
| --- | --- | --- |
| `max_iters` | `100` | Maximum interior-point iterations; must be positive. Equality-only problems use `eq_lsmr_iters` instead. |
| `time_limit` | `None` | Nonnegative elapsed-time limit in seconds, including presolve. `None` disables it. Checked at solver checkpoints; it does not interrupt a factorization already in progress. |
| `verbose` | `False` | Print settings, progress, and the final summary. |
| `presolve` | `True` | Simplify the problem and recover results in the original coordinates. |

### Termination tolerances

| Setting | Default | Meaning |
| --- | --- | --- |
| `tol_feas` | `1e-8` | Positive tolerance for primal and dual residuals, scaled by their equations as described below. |
| `tol_gap_abs` | `1e-8` | Positive absolute duality-gap tolerance. |
| `tol_gap_rel` | `1e-8` | Positive relative duality-gap tolerance. |
| `tol_infeas_abs` | `1e-8` | Nonnegative threshold for a negative certificate slope: $b^\mathsf{T}y$ or $c^\mathsf{T}x$. |
| `tol_infeas_rel` | `1e-8` | Nonnegative tolerance for certificate residuals normalized by the certificate slope and ray norms. |
| `certificate_ktratio` | `1e9` | Homogeneous ratio $\kappa/\tau$ above which the interior-point path considers certificates; must be at least one. |

Optimality requires both feasibility tests and either the absolute or relative
duality-gap test. The feasibility tests are

$$
\begin{aligned}
\lVert Ax+s-b\rVert_\infty
&< \mathtt{tol\_feas}\bigl(1+\max\{\lVert Ax\rVert_\infty,\lVert s\rVert_\infty,\lVert b\rVert_\infty\}\bigr),\\
\lVert Px+A^\mathsf{T}y+c\rVert_\infty
&< \mathtt{tol\_feas}\bigl(1+\max\{\lVert Px\rVert_\infty,\lVert A^\mathsf{T}y\rVert_\infty,\lVert c\rVert_\infty\}\bigr).
\end{aligned}
$$

The gap is $|p-d|$, where $p$ and $d$ are the reported primal and dual objective
values. The relative test uses the scale $\max\{1,\min(|p|,|d|)\}$.
The reported `pres` and `dres` are **unscaled residual norms**, not these
normalized stopping scores. Optimality measures are evaluated in the original
problem coordinates, including when presolve or equilibration is enabled.

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
| `linear_solver` | `LinearSolver.FAER` | Factorization backend for the interior-point path; see [backend selection](#factorization-backends). |
| `threads` | `0` | Maximum parallelism; zero uses the backend default, one requests sequential execution. Accelerate requires zero. |
| `eliminate_bounds` | `True` | Fold single-nonzero nonnegative-cone rows into the primal diagonal of the KKT system. |
| `refine_init_reg` | `1e-12` | Initial nonnegative diagonal-magnitude floor for KKT factorization. Adapted during the solve; zero starts at the lower bound `1e-20`. |
| `refine_iters` | `30` | Maximum correction solves per KKT right-hand side. Zero keeps the initial solve without corrections. |
| `refine_tol` | `1e-7` | Positive componentwise backward-error target. Refinement may stop earlier if further corrections are unlikely to help. |

Refinement targets the original KKT system despite regularization of the
factorization. Equality-only problems use the following controls instead of
`max_iters`, `refine_iters`, `refine_tol`, and `refine_init_reg`.

### Equality-only problems

| Setting | Default | Meaning |
| --- | --- | --- |
| `eq_lsmr_iters` | `None` | Maximum LSMR iterations. `None` uses `max(4 * (m + n), 32)` after presolve. Zero skips LSMR iterations but still checks the initial point. |
| `eq_refine_iters` | `10` | Maximum refinement corrections after the direct solve, before LSMR. Zero proceeds directly to LSMR if needed. |

This path always uses Faer with regularized LDL factorization and LSMR, and
checks the same optimality tolerances as the interior-point path. Its LSMR
iteration count is reported separately from `info.iters`.

All numerical settings must be finite when supplied. Iteration limits and
`threads` must be nonnegative integers, with `max_iters` strictly positive.

## Factorization backends

Select a backend with the `cpo3.LinearSolver` enum. Check its availability in
the current build and runtime before selecting it:

```python
available = [solver for solver in cpo3.LinearSolver if solver.is_available()]
```

| Backend | Requirements and threading |
| --- | --- |
| `FAER` | Built in. Honors `threads`. |
| `ACCELERATE` | A build with Accelerate support on macOS 13 or later. Requires `threads=0`; no per-solve thread cap is available. |
| `CHOLMOD` | A build with CHOLMOD support and a compatible SuiteSparse shared library. `threads` caps OpenMP work; simplicial LDL factorization is sequential. |
| `PARDISO` | A build with PARDISO support and the Intel MKL shared runtime. Uses MKL's thread-local limit. |

The [installation guide in the solver README](https://github.com/cpo3-org/cpo3#optional-factorization-backends)
contains platform and library setup instructions. Selecting an unavailable
backend does not silently substitute another. Equality-only problems use Faer
regardless of this selection.

## Solutions and diagnostics

The result exposes `status`, `x`, `y`, `s`, and `info` as read-only properties.
The vectors are NumPy arrays returned in the original problem dimensions and
units. Each vector access returns a copy.

For an optimal solution, the conventions are

$$
Ax+s=b,\qquad Px+c+A^\mathsf{T}y=0,\qquad
s\in\mathcal K,\quad y\in\mathcal K^*,\quad s^\mathsf{T}y=0.
$$

`x` has length $n$; `y` and `s` have length $m$. Equality-row multipliers are
unrestricted, and inequality-row multipliers are nonnegative.
For infeasibility statuses, the relevant vectors describe a certificate instead
of an optimal point; see [termination statuses](#termination-statuses).

### Objective values and residuals

| `solution.info` field | Meaning |
| --- | --- |
| `pobj` | Primal objective $\tfrac12 x^\mathsf{T}Px+c^\mathsf{T}x$. |
| `dobj` | Dual objective $-\tfrac12 x^\mathsf{T}Px-b^\mathsf{T}y$; a dual bound when the point is dual feasible. |
| `pres` | Primal residual infinity norm $\lVert Ax+s-b\rVert_\infty$. |
| `dres` | Dual residual infinity norm $\lVert Px+A^\mathsf{T}y+c\rVert_\infty$. |
| `comp` | Absolute complementarity $\lvert s^\mathsf{T}y\rvert$; distinct from the objective gap away from feasibility. |
| `solve_time` | Total elapsed solve time in seconds, including presolve and recovery. |
| `iters` | Solver iteration count; zero is possible when presolve completes the solve. Not an LSMR iteration count. |
| `linear_solver` | Backend recorded for the solve. |

Objective and residual fields may be `NaN` when the result is a certificate
rather than a point. A limit status does not imply that the residuals meet the
requested tolerances.

### Initialization and presolve

| `solution.info` field | Meaning |
| --- | --- |
| `warm_start_used` | Whether a supplied warm start was used; `None` when none was supplied. |
| `cvxopt_init_used` | `True` for a CVXOPT-style start; `False` for a canonical start, including fallback. `None` if a warm start was accepted or no interior-point iterate was formed. |
| `presolve_rows_removed` | Number of constraint rows removed. |
| `presolve_columns_removed` | Number of variables removed. |
| `presolve_time` | Presolve time in seconds, excluding the core solve and postsolve. |

### Linear-algebra counters

| `solution.info` field | Meaning |
| --- | --- |
| `factorizations` | Numeric factorization attempts, including failed attempts. |
| `primary_solves` | Initial solves for KKT right-hand sides, including initialization, retries, and equality-only LSMR preconditioner applications. Excludes refinement corrections. |
| `refinement_solves` | Correction solves attempted by iterative refinement, including failed attempts. Excludes initial solves and residual checks. |
| `refinement_failures` | Refinements reported as failed because of strict stalling, divergence, or singularity. |
| `lsmr_iterations` | Iterations of the equality-only LSMR fallback. |

Solve counters are per right-hand side, including when multiple right-hand
sides are processed together. A zero `refinement_solves` count means no
correction solve was attempted during that solve.

## Termination statuses

| `cpo3.SolverStatus` | Interpretation |
| --- | --- |
| `SOLVED` | Feasibility and duality-gap tests passed at the requested tolerances. |
| `PRIMAL_INFEASIBLE` | `y` is a primal infeasibility certificate; do not interpret `x` and `s` as a solution. |
| `DUAL_INFEASIBLE` | `x` and `s` describe a recession direction certifying dual infeasibility. If the primal problem is feasible, its objective is unbounded below. |
| `MAX_ITERATIONS` | The applicable iteration budget was exhausted without establishing optimality or infeasibility. |
| `TIME_LIMIT` | The elapsed-time limit was reached without establishing optimality or infeasibility. |

Primal certificates satisfy $A^\mathsf{T}y\approx0$, $y\in\mathcal K^*$, and
$b^\mathsf{T}y<0$. Dual certificates satisfy $Px\approx0$, $Ax+s\approx0$,
$s\in\mathcal K$, and $c^\mathsf{T}x<0$. Unused result vectors may contain `NaN`.

Numerical failures raise `RuntimeError` rather than returning an additional
status. Invalid argument types raise `TypeError`; invalid data or settings
raise `ValueError`; unsupported cones raise `NotImplementedError`.

## Reading problem files

```python
problem = cpo3.io.read_mps("problem.mps")
```

`read_mps` accepts a string or path-like object and reads MPS or QPS data.
Files with multiple named RHS, RANGES, or BOUNDS sets are rejected by default.
Pass `first_named_set=True` to retain the first set of each kind.

## Rust interface

Use `Problem::new(p, c, a, b, cones)` with `CscMatrix` inputs and
`Cone::Zero(k)` or `Cone::Nonnegative(k)`. Use `None` for the quadratic matrix
of a linear program. As in Python, `Problem::new` expects a full symmetric
quadratic matrix.

`solve(&problem, &settings)` returns `Result<Solution, SolveError>`.
Use `solve_from(&problem, &settings, Some(&warm_start))` with a `WarmStart`
containing `x`, `y`, and `s` vectors to supply a starting point.

Settings have the same names and numerical defaults as in Python, with Rust
booleans and enum variants such as `LinearSolver::Faer`. `time_limit` is an
`Option<Duration>` and `eq_lsmr_iters` is an `Option<usize>`.

Access results through `solution.status()`, `x()`, `y()`, `s()`, and `info()`.
Status variants are `Solved`, `PrimalInfeasible`, `DualInfeasible`,
`MaxIterations`, and `TimeLimit`. Result-vector methods borrow slices;
`solve_time` and `presolve_time` are `Duration` values. Linear-algebra counters
are grouped under `solution.info().linear_algebra` rather than exposed as flat
fields. See the [Rust example](/getting-started/#install-and-solve) for a complete program.
