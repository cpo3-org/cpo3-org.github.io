---
title: Solver details
description: Initialization, scaling, linear solves, stopping criteria, and infeasibility certificates in cpo3.
tableOfContents:
  maxHeadingLevel: 2
---

## Presolve and scaling

Presolve can return a solution or infeasibility certificate without entering
the numerical solver. Results are recovered in the original variable and
constraint ordering.

Ruiz equilibration rescales the quadratic, constraint, and homogeneous data.
With positive diagonal factors $D_x,D_y$ and a homogeneous scale $d_\tau$, the
transformed data are

$$
\hat P=D_xPD_x,\qquad \hat A=D_yAD_x,\qquad
\hat c=d_\tau D_xc,\qquad \hat b=d_\tau D_yb.
$$

Setting `presolve=False` does not disable equilibration; set
[`ruiz_iters=0`](/site/settings/#initialization-and-equilibration) separately.

## Initialization and warm starts

With the default `initial_mu=1`, the canonical start is $x=0$, $\tau=1$,
and $s=y=e$, where $e$ is zero on equality rows and one on inequality rows.
These are coordinates of the presolved, equilibrated problem. `initial_mu`
controls the canonical inequality complementarity; `cvxopt_init=True` instead
requests a linear-system initialization, falling back to the canonical point
if it fails.

Warm starts supply $(x,y,s)$ in the original problem coordinates. After presolve
and equilibration, cpo3 forms three candidates by flooring nonnegative-cone
components of $y$ and $s$ at $10^{-12}$, $10^{-6}$, and $10^{-3}$, then normalizes
the homogeneous coordinates to $\lVert(x,y,\tau)\rVert^2=\nu+1$, where $\nu$ is
the number of inequality rows in the reduced problem. Slacks receive the same
normalization factor.

The candidate with the smallest [local residual score](https://github.com/cpo3-org/cpo3/blob/main/src/central_path/init.rs#L100) is accepted
if its score is at most 100. `force_warm_start=True` bypasses the score threshold;
acceptance is recorded in [`warm_start_used`](/site/reference/#initialization-and-presolve).

<span id="factorization-and-reuse"></span>
<span id="regularization-and-refinement"></span>

## Linear systems

Predictor and corrector share one numerical factorization per outer iteration.
The KKT sparsity pattern and symbolic analysis are reused across iterations;
the changing diagonal requires numerical refactorization. Reuse is confined
to one solve; there is no persistent factorization cache across API calls.

With [`eliminate_bounds=True`](/site/settings/#linear-systems-and-refinement),
single-nonzero nonnegative-cone rows are eliminated by a Schur complement into
the primal diagonal, independently of presolve.

The central-path shift is part of the step equations. Separately,
[`refine_init_reg`](/site/settings/#linear-systems-and-refinement) initializes
an adaptive diagonal-magnitude floor in the factorized matrix. Numerical
failures can trigger a larger floor and refactorization; refinement diagnostics
also guide subsequent adjustments.

Iterative refinement evaluates residuals against the shifted KKT system,
including recovered components from eliminated bound rows. It corrects
additional factorization perturbations while retaining the central-path shift.
The componentwise backward-error target
[`refine_tol`](/site/settings/#linear-systems-and-refinement) is not guaranteed:
refinement can return its best finite iterate without meeting it. The outer
solve applies the stopping and certificate tests below.

<span id="termination-and-certificates"></span>

## Stopping criteria

Optimality requires both feasibility inequalities and either duality-gap
inequality. The feasibility tests are:

$$
\begin{aligned}
\lVert Ax+s-b\rVert_\infty
&< \mathtt{tol\_feas}\bigl(1+\max\{\lVert Ax\rVert_\infty,\lVert s\rVert_\infty,\lVert b\rVert_\infty\}\bigr),\\
\lVert Px+A^\mathsf{T}y+c\rVert_\infty
&< \mathtt{tol\_feas}\bigl(1+\max\{\lVert Px\rVert_\infty,\lVert A^\mathsf{T}y\rVert_\infty,\lVert c\rVert_\infty\}\bigr).
\end{aligned}
$$

In addition, at least one duality-gap inequality must hold:

$$
g < \mathtt{tol\_gap\_abs}
\quad\text{or}\quad
g < \mathtt{tol\_gap\_rel}\max\{1,\min(|p|,|d|)\},
$$

where

$$
\begin{aligned}
p&=\tfrac12 x^\mathsf{T}Px+c^\mathsf{T}x,\\
d&=-\tfrac12 x^\mathsf{T}Px-b^\mathsf{T}y,\\
g&=|c^\mathsf{T}x+b^\mathsf{T}y+x^\mathsf{T}Px|=|p-d|.
\end{aligned}
$$

The reported `pres` and `dres` are the unscaled infinity norms on the left-hand
sides of the feasibility tests. There is no separate complementarity test or
homogeneous-ratio requirement for optimality.

## Infeasibility certificates

On the interior-point path, certificate checks require
$\kappa/\tau>\mathtt{certificate\_ktratio}$. The equality-only path tests
residual-derived candidates without this gate. Presolve can return certificates
directly, independently of the tests below.

The tests use $\epsilon=10^{-15}$ and the
[certificate tolerances](/site/settings/#infeasibility-detection).

For a primal-infeasibility candidate $y\in\mathcal K^*$, acceptance requires

$$
b^\mathsf{T}y<-\mathtt{tol\_infeas\_abs},
\qquad
\frac{\lVert A^\mathsf{T}y\rVert_2}
     {\max\{|b^\mathsf{T}y|,\lVert y\rVert_2,\epsilon\}}
<\mathtt{tol\_infeas\_rel}.
$$

For a dual-infeasibility candidate $(x,s)$ with $s\in\mathcal K$, acceptance
requires all three inequalities:

$$
\begin{aligned}
c^\mathsf{T}x&<-\mathtt{tol\_infeas\_abs},\\
\frac{\lVert Ax+s\rVert_2}
     {\max\{|c^\mathsf{T}x|,\lVert x\rVert_2+\lVert s\rVert_2,\epsilon\}}
&<\mathtt{tol\_infeas\_rel},\\
\frac{\lVert Px\rVert_2}
     {\max\{|c^\mathsf{T}x|,\lVert x\rVert_2,\epsilon\}}
&<\mathtt{tol\_infeas\_rel}.
\end{aligned}
$$

Certificate tests are applied before postsolve recovery. Accepted rays are
scaled to $b^\mathsf{T}y=-1$ or $c^\mathsf{T}x=-1$. Unused result vectors contain `NaN`: $(x,s)$ for primal
infeasibility, and $y$ for dual infeasibility. A dual-infeasibility certificate
implies primal unboundedness only if the primal problem is feasible.

## Equality-only problems

If the problem remaining after presolve has no nonnegative-cone rows, cpo3 uses
a separate KKT solve. It tries a regularized Faer LDL factorization with
refinement, then uses right-preconditioned LSMR if needed. This path always uses
Faer and does not use the supplied warm start.

`eq_refine_iters` and `eq_lsmr_iters` control this path instead of the
interior-point iteration and refinement limits. Optimality is checked against
the same user tolerances. Work on this path is recorded in the
[linear-algebra counters](/site/reference/#linear-algebra-counters).
