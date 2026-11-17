---
title: cpo3
description: Documentation for the cpo3 linear and quadratic programming solver.
tableOfContents: false
next: false
---

<p class="home-summary">A primal–dual interior-point solver for convex quadratic cone programs.</p>

This documentation follows development on the **`main` branch**.

<nav class="home-links" aria-label="Documentation links">
  <a href="/installation/">Installation</a>
  <a href="/getting-started/">Getting started</a>
</nav>

## Problem formulation

cpo3 solves

$$
\begin{aligned}
\underset{x,\,s}{\operatorname{minimize}}\quad & \tfrac12 x^\mathsf{T}Px + c^\mathsf{T}x \\
\text{subject to}\quad & Ax+s=b,\quad s\in\mathcal{K}.
\end{aligned}
$$

The current implementation supports $P\succeq0$ and
$\mathcal K=\{0\}^{z}\times\mathbb R_+^{m-z}$, where $z$ is the number of
equality rows and $m$ is the total number of constraint rows.
Linear programs use $P=0$. Both interfaces accept sparse problem data and return
primal–dual solutions or infeasibility certificates.

## Method and performance

cpo3 uses an infeasible-start predictor–corrector method based on strongly
monotone central path equations for a homogeneous embedding. It handles quadratic
objectives directly and uses the embedding to detect primal and dual infeasibility.
Josephy–Newton steps linearize conic complementarity while retaining the quadratic
perspective term; predictor and corrector share a shifted quasi-definite
factorization. The [paper](https://arxiv.org/abs/2611.18403) develops the method;
[Solver details](/solver-details/) documents initialization, scaling, linear
solves, and termination.

In the paper's [benchmark results](https://arxiv.org/pdf/2611.18403#page=41),
cpo3 returned verified solutions for **640 of 675 problems**, the highest count
among all tested open-source and commercial solvers. It also recorded the lowest
penalized shifted geometric mean runtime among the tested open-source solvers.

The [API example](/getting-started/) shows sparse problem assembly in Python
and Rust. [Conventions](/reference/) specifies matrix storage, cone ordering,
dual signs, residual definitions, and certificate semantics.

## Citation

If you use cpo3 in your research, please cite:

Michael Cummins, Matteo Santamaria, and Brendan O'Donoghue (2026).
[Strongly Monotone Central Path Equations for Quadratic Cone Programs](https://arxiv.org/abs/2611.18403).

```bibtex
@misc{cpo3,
  title         = {Strongly Monotone Central Path Equations for Quadratic Cone Programs},
  author        = {Michael Cummins and Matteo Santamaria and Brendan O'Donoghue},
  year          = {2026},
  eprint        = {2611.18403},
  archivePrefix = {arXiv},
  primaryClass  = {math.OC},
  url           = {https://arxiv.org/abs/2611.18403}
}
```
