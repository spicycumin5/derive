import { derivative, parse } from 'mathjs'
import { useMemo } from 'react'
import { deriv, deriv2, isGood } from './numeric'
import { normalize, parseFn, type Fn } from './parse'

/** Symbolic derivative via mathjs; null if it can't. */
export function derivExpr(expr: string): string | null {
  try {
    return derivative(normalize(expr), 'x').toString()
  } catch {
    return null
  }
}

export function toTex(expr: string): string {
  try {
    return parse(normalize(expr)).toTex({ parenthesis: 'auto', implicit: 'hide' })
  } catch {
    return expr
  }
}

export interface Derivs {
  f: Fn
  fp: Fn
  fpp: Fn
  fTex: string
  fpTex: string | null
  fppTex: string | null
}

/** f, f′, f″ — exact when mathjs can differentiate, numeric otherwise. */
export function derivs(expr: string): Derivs {
  const f = parseFn(expr).fn
  const e1 = derivExpr(expr)
  const e2 = e1 ? derivExpr(e1) : null
  const fpSym = e1 ? parseFn(e1).fn : null
  const fppSym = e2 ? parseFn(e2).fn : null
  // symbolic derivative of abs etc. can produce NaN where numeric works — fall back pointwise
  const fp: Fn = (x) => {
    if (!isGood(f(x))) return NaN
    const v = fpSym ? fpSym(x) : NaN
    return isGood(v) ? v : deriv(f, x)
  }
  const fpp: Fn = (x) => {
    if (!isGood(f(x))) return NaN
    const v = fppSym ? fppSym(x) : NaN
    return isGood(v) ? v : deriv2(f, x)
  }
  return { f, fp, fpp, fTex: toTex(expr), fpTex: e1 ? toTex(e1) : null, fppTex: e2 ? toTex(e2) : null }
}

export function useDerivs(expr: string): Derivs {
  return useMemo(() => derivs(expr), [expr])
}

/** A y-range that frames f nicely on [a,b] (robust to asymptotes). */
export function autoRange(fns: Fn[], a: number, b: number, opts: { includeZero?: boolean; pad?: number; min?: number } = {}): [number, number] {
  const { includeZero = true, pad = 0.15, min = 1 } = opts
  const vals: number[] = []
  for (const fn of fns)
    for (let i = 0; i <= 300; i++) {
      const v = fn(a + ((b - a) * i) / 300)
      if (isGood(v)) vals.push(v)
    }
  if (!vals.length) return [-5, 5]
  vals.sort((p, q) => p - q)
  let lo = vals[Math.floor(vals.length * 0.02)]
  let hi = vals[Math.ceil(vals.length * 0.98) - 1]
  if (includeZero) {
    lo = Math.min(lo, 0)
    hi = Math.max(hi, 0)
  }
  if (hi - lo < min) {
    const c = (hi + lo) / 2
    lo = c - min / 2
    hi = c + min / 2
  }
  const p = (hi - lo) * pad
  return [lo - p, hi + p]
}
