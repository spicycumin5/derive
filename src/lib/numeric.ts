import type { Fn, Fn2 } from './parse'

export const isGood = (v: number) => Number.isFinite(v)

/** Central-difference first derivative. */
export function deriv(f: Fn, x: number, h = 1e-4): number {
  return (f(x + h) - f(x - h)) / (2 * h)
}

/** Central-difference second derivative. */
export function deriv2(f: Fn, x: number, h = 1e-3): number {
  return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h)
}

/** One-sided derivatives (for differentiability checks). */
export function derivLeft(f: Fn, x: number, h = 1e-5): number {
  return (f(x) - f(x - h)) / h
}
export function derivRight(f: Fn, x: number, h = 1e-5): number {
  return (f(x + h) - f(x)) / h
}

/** Composite Simpson's rule (n forced even). */
export function integrate(f: Fn, a: number, b: number, n = 400): number {
  if (a === b) return 0
  if (n % 2) n++
  const h = (b - a) / n
  let s = f(a) + f(b)
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2)
  return (s * h) / 3
}

export type RiemannKind = 'left' | 'right' | 'mid' | 'trap'

export interface RiemannPiece {
  x0: number
  x1: number
  /** height for rectangles; for trapezoids, y0/y1 */
  y0: number
  y1: number
}

export function riemann(f: Fn, a: number, b: number, n: number, kind: RiemannKind) {
  const dx = (b - a) / n
  const pieces: RiemannPiece[] = []
  let sum = 0
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx
    const x1 = x0 + dx
    if (kind === 'trap') {
      const y0 = f(x0)
      const y1 = f(x1)
      pieces.push({ x0, x1, y0, y1 })
      sum += ((y0 + y1) / 2) * dx
    } else {
      const xs = kind === 'left' ? x0 : kind === 'right' ? x1 : (x0 + x1) / 2
      const y = f(xs)
      pieces.push({ x0, x1, y0: y, y1: y })
      sum += y * dx
    }
  }
  return { pieces, sum, dx }
}

/** Bisection root finder on [a,b] assuming a sign change. */
export function bisect(f: Fn, a: number, b: number, iters = 60): number {
  let fa = f(a)
  for (let i = 0; i < iters; i++) {
    const m = (a + b) / 2
    const fm = f(m)
    if (fm === 0) return m
    if (Math.sign(fm) === Math.sign(fa)) {
      a = m
      fa = fm
    } else b = m
  }
  return (a + b) / 2
}

/**
 * Find zeros of f on [a,b] by scanning for sign changes. Rejects sign changes
 * across asymptotes (where |f| blows up) so 1/x doesn't report a root at 0.
 */
export function findRoots(f: Fn, a: number, b: number, samples = 800): number[] {
  const roots: number[] = []
  const dx = (b - a) / samples
  let x0 = a
  let y0 = f(x0)
  for (let i = 1; i <= samples; i++) {
    const x1 = a + i * dx
    const y1 = f(x1)
    if (isGood(y0) && isGood(y1)) {
      if (y0 === 0) {
        if (!roots.length || Math.abs(roots[roots.length - 1] - x0) > dx * 1.5) roots.push(x0)
      } else if (y0 * y1 < 0) {
        const r = bisect(f, x0, x1)
        const fr = Math.abs(f(r))
        const scale = Math.max(Math.abs(y0), Math.abs(y1), 1)
        if (fr < 1e-6 * scale + 1e-9) roots.push(r)
      }
    }
    x0 = x1
    y0 = y1
  }
  if (y0 === 0 && isGood(y0)) roots.push(x0)
  return roots
}

export interface SignInterval {
  from: number
  to: number
  sign: 1 | -1 | 0
}

/** Split [a,b] into intervals where f is positive / negative. NaN regions get sign 0. */
export function signIntervals(f: Fn, a: number, b: number, samples = 600): SignInterval[] {
  const out: SignInterval[] = []
  const dx = (b - a) / samples
  const sgn = (v: number): 1 | -1 | 0 => (!isGood(v) ? 0 : v > 1e-9 ? 1 : v < -1e-9 ? -1 : 0)
  let start = a
  let cur = sgn(f(a + dx / 2))
  for (let i = 1; i < samples; i++) {
    const x = a + i * dx + dx / 2
    const s = sgn(f(x))
    if (s !== cur) {
      // refine boundary
      const lo = x - dx
      let edge = x - dx / 2
      if (cur !== 0 && s !== 0) {
        const g = (t: number) => f(t)
        if (isGood(g(lo)) && isGood(g(x)) && g(lo) * g(x) < 0) edge = bisect(g, lo, x, 40)
      }
      out.push({ from: start, to: edge, sign: cur })
      start = edge
      cur = s
    }
  }
  out.push({ from: start, to: b, sign: cur })
  return out.filter((iv) => iv.to - iv.from > 1e-9)
}

/** Golden-section / scan extremum: returns x of max (or min) of f on [a,b]. */
export function argExtreme(f: Fn, a: number, b: number, mode: 'max' | 'min', samples = 1000): number {
  let best = a
  let bestV = mode === 'max' ? -Infinity : Infinity
  for (let i = 0; i <= samples; i++) {
    const x = a + ((b - a) * i) / samples
    const v = f(x)
    if (!isGood(v)) continue
    if (mode === 'max' ? v > bestV : v < bestV) {
      bestV = v
      best = x
    }
  }
  return best
}

/** Solve dy/dx = g(x,y) from (x0,y0) to xEnd with RK4, returning points. Stops if the solution blows up. */
export function rk4Path(g: Fn2, x0: number, y0: number, xEnd: number, steps = 400, yLimit = 1e3): [number, number][] {
  const pts: [number, number][] = [[x0, y0]]
  const h = (xEnd - x0) / steps
  let x = x0
  let y = y0
  for (let i = 0; i < steps; i++) {
    const k1 = g(x, y)
    const k2 = g(x + h / 2, y + (h / 2) * k1)
    const k3 = g(x + h / 2, y + (h / 2) * k2)
    const k4 = g(x + h, y + h * k3)
    const ny = y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
    if (!isGood(ny) || Math.abs(ny) > yLimit) break
    x += h
    y = ny
    pts.push([x, y])
  }
  return pts
}

/** Euler's method steps (the AP version): returns all points including start. */
export function eulerSteps(g: Fn2, x0: number, y0: number, h: number, n: number): [number, number][] {
  const pts: [number, number][] = [[x0, y0]]
  let x = x0
  let y = y0
  for (let i = 0; i < n; i++) {
    const ny = y + h * g(x, y)
    if (!isGood(ny)) break
    x += h
    y = ny
    pts.push([x, y])
  }
  return pts
}

/** Format a number for display: trims noise, keeps sign, uses − for minus. */
export function fmt(v: number, digits = 3): string {
  if (!Number.isFinite(v)) {
    if (v === Infinity) return '∞'
    if (v === -Infinity) return '−∞'
    return 'undefined'
  }
  if (Math.abs(v) < 0.5 * 10 ** -digits) v = 0
  const s = Math.abs(v) >= 1e5 ? v.toExponential(2) : Number(v.toFixed(digits)).toString()
  return s.replace('-', '−')
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Antiderivative F with F(x0) = 0 on [a,b], via cumulative trapezoid on a fine grid. */
export function antiderivative(f: Fn, x0: number, a: number, b: number, n = 2400): Fn {
  const lo = Math.min(a, x0)
  const hi = Math.max(b, x0)
  const h = (hi - lo) / n
  const F = new Float64Array(n + 1)
  let prev = f(lo)
  if (!isGood(prev)) prev = 0
  for (let i = 1; i <= n; i++) {
    let y = f(lo + i * h)
    if (!isGood(y)) y = 0
    F[i] = F[i - 1] + ((prev + y) / 2) * h
    prev = y
  }
  const at = (x: number) => {
    const t = (x - lo) / h
    if (t < 0 || t > n) return NaN
    const i = Math.min(n - 1, Math.floor(t))
    return F[i] + (F[i + 1] - F[i]) * (t - i)
  }
  const off = at(x0)
  return (x) => at(x) - off
}

export type LimitResult = { kind: 'value'; v: number } | { kind: 'inf'; v: number } | { kind: 'dne' }

/** Numerically estimate a one-sided limit of f at a. */
export function oneSidedLimit(f: Fn, a: number, side: 1 | -1): LimitResult {
  const hs = [1e-3, 1e-4, 1e-5, 1e-6, 1e-7]
  const vs = hs.map((h) => f(a + side * h))
  if (vs.some((v) => !isGood(v))) {
    if (vs.slice(-2).every((v) => v === Infinity || v === -Infinity)) return { kind: 'inf', v: vs[vs.length - 1] }
    return { kind: 'dne' }
  }
  const last = vs[vs.length - 1]
  const growing = vs.every((v, i) => i === 0 || Math.abs(v) > Math.abs(vs[i - 1]) * 3)
  if (growing && Math.abs(last) > 1e4) return { kind: 'inf', v: Math.sign(last) * Infinity }
  const tol = 1e-3 * (1 + Math.abs(last))
  if (Math.abs(vs[3] - vs[4]) < tol && Math.abs(vs[2] - vs[3]) < tol * 10) return { kind: 'value', v: last }
  return { kind: 'dne' }
}

export function limitText(r: LimitResult): string {
  if (r.kind === 'value') return fmt(r.v, 4)
  if (r.kind === 'inf') return r.v > 0 ? '∞' : '−∞'
  return 'DNE'
}
