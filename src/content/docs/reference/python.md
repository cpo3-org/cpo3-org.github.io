---
title: Python API
description: Construct problems with SciPy, solve them, and inspect NumPy results.
tableOfContents:
  maxHeadingLevel: 2
---

The Python interface accepts SciPy sparse matrices and NumPy-compatible vectors.
See [Conventions](/reference/) for the formulation and result meanings,
[Settings](/settings/) for solver options, and [Getting started](/getting-started/)
for a complete example.

## Constructing a problem

```python
import cpo3

problem = cpo3.Problem(P=P, c=c, A=A, b=b, cones=cones)
```

All constructor arguments are keyword-only. For $n$ variables and $m$
constraint rows, `c` has length $n$, `b` has length $m$, `P` has shape $(n,n)$,
and `A` has shape $(m,n)$. Use `P=None` for a linear program.

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

### Cone descriptors

Use `cpo3.ZeroCone(k)` for equality rows and `cpo3.NonnegativeCone(k)` for
inequality rows. Each block dimension must be a positive integer.
For example, `[cpo3.ZeroCone(2), cpo3.NonnegativeCone(3)]` assigns the first
two rows to equalities and the next three to inequalities.

`SecondOrderCone` and `PositiveSemidefiniteCone` descriptors exist, but solving
with them raises `NotImplementedError`.

## Solving and warm starts

```python
solution = cpo3.solve(problem, settings=None, warm_start=None)
```

Omitting `settings` uses `cpo3.Settings()`; see [Settings](/settings/) for
defaults. The solve is synchronous.

For a related problem with compatible dimensions, supply a previous solution:

```python
solution = cpo3.solve(
    problem,
    settings=cpo3.Settings(verbose=True),
    warm_start=(previous.x, previous.y, previous.s),
)
```

The tuple is ordered **`(x, y, s)`**, with lengths $n$, $m$, and $m$, in the
original problem units. Values must be finite. Acceptance is reported in
`solution.info.warm_start_used`; see
[warm-start screening](/solver-details/#initialization-and-warm-starts).

## Accessing results

`Solution` exposes `status`, `x`, `y`, `s`, and `info` as read-only properties.
`x`, `y`, and `s` are NumPy arrays of lengths $n$, $m$, and $m$, respectively.
Each vector access returns a copy.

```python
if solution.status is cpo3.SolverStatus.SOLVED:
    x = solution.x
    print(x)
    print(solution.info.pobj)
    print(solution.info.solve_time)  # seconds
```

Diagnostic fields are available directly on `solution.info`, including
`solution.info.refinement_solves`. Durations are in seconds; optional
initialization flags are `bool` or `None`. [Conventions](/reference/#solutions-and-diagnostics)
defines the fields and [termination statuses](/reference/#termination-statuses).

## Errors

Ordinary termination, including limits and infeasibility certificates, returns
a `Solution`. Exceptional failures raise an exception:

| Exception | Meaning |
| --- | --- |
| `TypeError` | An argument has an unsupported type. |
| `ValueError` | Problem data or solver settings are invalid, or a problem file cannot be read or converted. |
| `NotImplementedError` | The problem uses an unsupported cone. |
| `RuntimeError` | A numerical solver failure, including an unavailable factorization backend. |

## Reading problem files

```python
problem = cpo3.io.read_mps("problem.mps")
```

`read_mps` accepts a string or path-like object and reads MPS or QPS data.
Files with multiple named RHS, RANGES, or BOUNDS sets are rejected by default.
Pass `first_named_set=True` to retain the first set of each kind.

