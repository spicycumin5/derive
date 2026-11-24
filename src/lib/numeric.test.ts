import { describe, expect, it } from 'vitest'
import { parseFn, parseFn2 } from './parse'
import { deriv, deriv2, eulerSteps, findRoots, integrate, riemann, rk4Path, signIntervals } from './numeric'

describe('parse', () => {
  it('handles student syntax', () => {
    expect(parseFn('ln(e)').fn(0)).toBeCloseTo(1)
    expect(parseFn('3x^2').fn(2)).toBeCloseTo(12)
    expect(parseFn('sqrt(x)').fn(-1)).toBeNaN()
    expect(parseFn('x**2').fn(3)).toBeCloseTo(9)
  })
  it('reports errors instead of throwing', () => {
    expect(parseFn('sin(').error).toBeTruthy()
    expect(parseFn('q + 1').error).toMatch(/q/)
    expect(parseFn2('x*y').error).toBeNull()
  })
})

describe('calculus', () => {
  it('derivatives', () => {
    expect(deriv(Math.sin, 0)).toBeCloseTo(1, 6)
    expect(deriv2((x) => x ** 3, 2)).toBeCloseTo(12, 3)
  })
  it('integrals', () => {
    expect(integrate((x) => x * x, 0, 1)).toBeCloseTo(1 / 3, 8)
    expect(riemann((x) => x, 0, 1, 4, 'left').sum).toBeCloseTo(0.375)
    expect(riemann((x) => x, 0, 1, 4, 'right').sum).toBeCloseTo(0.625)
    expect(riemann((x) => x * x, 0, 1, 2, 'trap').sum).toBeCloseTo(0.375)
  })
  it('roots skip asymptotes', () => {
    expect(findRoots((x) => x * x - 2, 0, 3)[0]).toBeCloseTo(Math.SQRT2, 6)
    expect(findRoots((x) => 1 / x, -1, 1)).toHaveLength(0)
  })
  it('sign intervals', () => {
    const iv = signIntervals((x) => x * x - 1, -2, 2)
    expect(iv.map((i) => i.sign)).toEqual([1, -1, 1])
    expect(iv[1].from).toBeCloseTo(-1, 4)
  })
  it('ODE solvers', () => {
    const p = rk4Path((_, y) => y, 0, 1, 1)
    expect(p[p.length - 1][1]).toBeCloseTo(Math.E, 6)
    const e = eulerSteps((_, y) => y, 0, 1, 0.5, 2)
    expect(e[2][1]).toBeCloseTo(2.25)
  })
})
