---
title: Conventions
description: Shared problem formulation, diagnostics, and termination semantics.
tableOfContents:
  maxHeadingLevel: 2
---

The [Python API](/reference/python/) and [Rust API](/reference/rust/) use the same
mathematical conventions. This page defines the problem data and the meaning
of solver results; see [Settings](/settings/) for controls and tolerances.

## Problem data

Both APIs represent the problem

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

Supply the full symmetric matrix $P$, not just one triangle. Positive
semidefiniteness is a modeling requirement; construction checks symmetry but
does not certify convexity. All input values must be finite.

### Cone blocks and bounds

Cone blocks partition consecutive rows of $A$ and $b$. Their dimensions must be
positive and sum to $m$. Only zero and nonnegative cones are currently supported.

| Cone | Constraint on the corresponding rows | Dual multiplier |
| --- | --- | --- |
| Zero cone | $s=0$, hence $Ax=b$ | Unrestricted in sign. |
| Nonnegative cone | $s\geq0$, hence $Ax\leq b$ | $y\geq0$. |

Variables are unrestricted unless constraints impose bounds. An upper bound
$x_j\leq u$ uses a row $e_j^\mathsf{T}x+s=u$; a lower bound $x_j\geq\ell$
uses $-e_j^\mathsf{T}x+s=-\ell$, both with nonnegative slack.
Encode bounds as constraint rows; do not use infinite right-hand sides.

## Solutions and diagnostics

Results use the original problem dimensions and units. In Python, diagnostics
are properties of `solution.info`. In Rust, use `solution.info()`; durations
are `Duration` values rather than seconds, and linear-algebra counters are
nested under `linear_algebra`. Optional flags use `None` in Python and
`Option<bool>` in Rust.

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

| Field | Meaning |
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
requested tolerances. See [termination tolerances](/settings/#termination-tolerances)
for the stopping tests.

### Initialization and presolve

| Field | Meaning |
| --- | --- |
| `warm_start_used` | Whether a supplied warm start was used; unset when none was supplied or presolve finished before initialization. |
| `cvxopt_init_used` | True for a CVXOPT-style start; false for a canonical start, including fallback. Unset if a warm start was accepted or no interior-point iterate was formed. |
| `presolve_rows_removed` | Number of constraint rows removed. |
| `presolve_columns_removed` | Number of variables removed. |
| `presolve_time` | Presolve time in seconds, excluding the core solve and postsolve. |

### Linear-algebra counters

| Field | Meaning |
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

| Python (`SolverStatus`) | Rust (`SolverStatus`) | Interpretation |
| --- | --- | --- |
| `SOLVED` | `Solved` | Feasibility and duality-gap tests passed at the requested tolerances. |
| `PRIMAL_INFEASIBLE` | `PrimalInfeasible` | `y` is a primal infeasibility certificate; do not interpret `x` and `s` as a solution. |
| `DUAL_INFEASIBLE` | `DualInfeasible` | `x` and `s` describe a recession direction certifying dual infeasibility. If the primal problem is feasible, its objective is unbounded below. |
| `MAX_ITERATIONS` | `MaxIterations` | The applicable iteration budget was exhausted without establishing optimality or infeasibility. |
| `TIME_LIMIT` | `TimeLimit` | The elapsed-time limit was reached without establishing optimality or infeasibility. |

Primal certificates satisfy $A^\mathsf{T}y\approx0$, $y\in\mathcal K^*$, and
$b^\mathsf{T}y<0$. Dual certificates satisfy $Px\approx0$, $Ax+s\approx0$,
$s\in\mathcal K$, and $c^\mathsf{T}x<0$. Unused result vectors may contain `NaN`.
