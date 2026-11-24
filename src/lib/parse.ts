import { compile, type EvalFunction } from 'mathjs'

export type Fn = (x: number) => number
export type Fn2 = (x: number, y: number) => number

/** Normalise student-style input into something mathjs understands. */
export function normalize(expr: string): string {
  return expr
    .replace(/\*\*/g, '^')
    .replace(/\bln\s*\(/g, 'log(')
    .replace(/\barcsin\b/g, 'asin')
    .replace(/\barccos\b/g, 'acos')
    .replace(/\barctan\b/g, 'atan')
    .replace(/π/g, 'pi')
    .replace(/√\s*\(/g, 'sqrt(')
    .replace(/−/g, '-')
    .replace(/·|×/g, '*')
}

const cache = new Map<string, EvalFunction | Error>()

function getCompiled(expr: string): EvalFunction | Error {
  const key = normalize(expr)
  let c = cache.get(key)
  if (!c) {
    try {
      c = compile(key)
    } catch (e) {
      c = e instanceof Error ? e : new Error(String(e))
    }
    cache.set(key, c)
  }
  return c
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'boolean') return v ? 1 : 0
  // complex results (sqrt of negative etc.) → not real
  return NaN
}

export interface ParseResult<F> {
  fn: F
  error: string | null
}

const nanFn = () => NaN

/** Compile a single-variable expression f(x). Never throws; bad input → NaN function + error message. */
export function parseFn(expr: string, variable = 'x'): ParseResult<Fn> {
  const c = getCompiled(expr)
  if (c instanceof Error) return { fn: nanFn, error: cleanError(c.message) }
  const scope: Record<string, number> = {}
  const fn: Fn = (x) => {
    scope[variable] = x
    try {
      return toNum(c.evaluate(scope))
    } catch {
      return NaN
    }
  }
  // probe for unknown symbols
  try {
    scope[variable] = 0.5371
    c.evaluate(scope)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/Undefined symbol|Undefined function/i.test(msg)) return { fn: nanFn, error: cleanError(msg) }
  }
  return { fn, error: null }
}

/** Compile a two-variable expression g(x, y). */
export function parseFn2(expr: string): ParseResult<Fn2> {
  const c = getCompiled(expr)
  if (c instanceof Error) return { fn: nanFn, error: cleanError(c.message) }
  const scope: Record<string, number> = {}
  const fn: Fn2 = (x, y) => {
    scope.x = x
    scope.y = y
    try {
      return toNum(c.evaluate(scope))
    } catch {
      return NaN
    }
  }
  try {
    scope.x = 0.5371
    scope.y = 0.4219
    c.evaluate(scope)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/Undefined symbol|Undefined function/i.test(msg)) return { fn: nanFn, error: cleanError(msg) }
  }
  return { fn, error: null }
}

function cleanError(msg: string): string {
  const sym = msg.match(/Undefined (?:symbol|function) (\w+)/)
  if (sym) return `“${sym[1]}” isn’t a known variable or function. Use x, and functions like sin, ln, sqrt, abs.`
  if (/Unexpected end/i.test(msg)) return 'The expression ends too early. Check for a missing value or bracket.'
  if (/Parenthesis/i.test(msg)) return 'Brackets don’t match. Count your ( and ).'
  return 'Couldn’t read that expression. Try something like x^3 - 3x or sin(x)/x.'
}
