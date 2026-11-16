---
title: cpo3
description: Documentation for the cpo3 linear and quadratic programming solver.
tableOfContents: false
next: false
---

<p class="home-summary">An interior-point solver for linear and quadratic optimization.</p>

<nav class="home-links" aria-label="Documentation links">
  <a href="/site/installation/">Installation</a>
  <a href="/site/getting-started/">Getting started</a>
  <a href="/site/reference/python/">Python API</a>
  <a href="/site/reference/rust/">Rust API</a>
  <a href="/site/settings/">Settings</a>
  <a href="https://github.com/cpo3-org/cpo3">Source code</a>
</nav>

## Problem formulation

cpo3 solves convex optimization problems of the form

$$
\begin{aligned}
\underset{x,\,s}{\operatorname{minimize}}\quad & \tfrac12 x^\mathsf{T}Px + c^\mathsf{T}x \\
\text{subject to}\quad & Ax+s=b, \\
& s\in\mathcal K.
\end{aligned}
$$

The matrix $P$ is symmetric positive semidefinite. The cone $\mathcal K$ is a
product of zero and nonnegative cones, representing equality and inequality
constraints. Setting $P=0$ gives a linear program.

The solver is implemented in Rust and provides a Python interface. Problem data
are supplied as sparse matrices and dense vectors.

## A quadratic program in Python

Define the objective and constraints with sparse matrices, then call `solve`.
This two-variable quadratic program has upper bounds on both variables and
solution $x=(0.5,2)$; the first upper bound is active.

```python title="example.py"
import cpo3
from scipy import sparse

problem = cpo3.Problem(
    P=sparse.eye(2, format="csc"),
    c=[-1.0, -2.0],
    A=sparse.eye(2, format="csc"),
    b=[0.5, 4.0],
    cones=[cpo3.NonnegativeCone(2)],
)

solution = cpo3.solve(problem)
if solution.status == cpo3.SolverStatus.SOLVED:
    print(solution.x)  # approximately [0.5, 2.0]
```

The [getting started guide](/site/getting-started/) walks through this example in
both Python and Rust. See [mixed constraints](/site/examples/mixed-constraints/)
for a problem with equalities, inequalities, and variable bounds.
