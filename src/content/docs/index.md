---
title: cpo3
description: Documentation for the cpo3 linear and quadratic programming solver.
tableOfContents: false
next: false
hero:
  title: Sparse optimization<br />in Rust and Python.
  tagline: cpo3 solves convex linear and quadratic programs with an interior-point method.
  actions:
    - text: Getting started
      link: /getting-started/
      icon: right-arrow
    - text: Reference
      link: /reference/
      variant: secondary
    - text: View on GitHub
      link: https://github.com/cpo3-org/cpo3
      variant: minimal
      icon: external
---

## A quadratic program in Python

Define the objective and constraints with sparse matrices, then call `solve`.
This example minimizes `½(x₁² + x₂²) − x₁ − 2x₂` subject to `x₁ ≤ 3` and `x₂ ≤ 4`.

```python title="example.py"
import cpo3
from scipy import sparse

problem = cpo3.Problem(
    P=sparse.eye(2, format="csc"),
    c=[-1.0, -2.0],
    A=sparse.eye(2, format="csc"),
    b=[3.0, 4.0],
    cones=[cpo3.NonnegativeCone(2)],
)

solution = cpo3.solve(problem)
if solution.status == cpo3.SolverStatus.SOLVED:
    print(solution.x)  # approximately [1.0, 2.0]
```

The [getting started guide](/getting-started/) covers installation and walks
through this example in both Python and Rust.
