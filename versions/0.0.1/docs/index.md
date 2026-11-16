---
title: cpo3
description: Documentation for the cpo3 linear and quadratic programming solver.
tableOfContents: false
next: false
---

<p class="home-summary">An interior-point solver for linear and quadratic optimization.</p>

This documentation covers the **cpo3 0.0.1 release**.

<nav class="home-links" aria-label="Documentation links">
  <a href="/site/installation/">Installation</a>
  <a href="/site/getting-started/">Getting started</a>
</nav>

## Problem formulation

cpo3 solves convex optimization problems of the form

$$
\begin{aligned}
\underset{x,\,s}{\operatorname{minimize}}\quad & \tfrac12 x^\mathsf{T}Px + c^\mathsf{T}x \\
\text{subject to}\quad & Ax+s=b,\quad s\in\mathcal{K}.
\end{aligned}
$$

The matrix $P$ is symmetric positive semidefinite. The cone $\mathcal K$ is a
product of zero and nonnegative cones, representing equality and inequality
constraints. Setting $P=0$ gives a linear program.

## Method and performance

The solver uses an infeasible-start, primal–dual interior-point method with
predictor–corrector steps based on a novel strongly monotone central path equation.
It handles quadratic objectives directly and uses a homogeneous embedding to
detect primal and dual infeasibility.

In the paper's [benchmark results](https://arxiv.org/pdf/2611.18403#page=41),
cpo3 returned verified solutions for **640 of 675 problems**, the highest count
among all tested open-source and commercial solvers. It also recorded the lowest
penalized shifted geometric mean runtime among the tested open-source solvers.

The [getting-started guide](/site/getting-started/) works through a quadratic
program with equalities, inequalities, and variable bounds in Python and Rust,
including how to interpret slacks and dual multipliers. The
[conventions reference](/site/reference/) defines data requirements, optimality
conditions, and infeasibility certificates.

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
