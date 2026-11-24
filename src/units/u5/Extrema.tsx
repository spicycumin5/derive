import { MovablePoint } from 'mafs'
import { useMemo, useState } from 'react'
import { Band, Curve, Dot, Graph, HLine, Label, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { FnInput, Group, useUrlState } from '../../components/ui'
import { autoRange, useDerivs } from '../../lib/calc'
import { derivLeft, derivRight, findRoots, fmt, isGood } from '../../lib/numeric'

const presets = [
  { label: 'x³ − 3x²', expr: 'x^3 - 3x^2' },
  { label: 'x⁴ − 8x²', expr: 'x^4 - 8x^2' },
  { label: '|x − 1|', expr: 'abs(x - 1)' },
  { label: 'x·e^(−x)', expr: 'x*exp(-x)' },
  { label: 'sin x + cos x', expr: 'sin(x) + cos(x)' },
  { label: 'x^(2/3)', expr: 'cbrt(x^2)' },
]

interface Cand {
  x: number
  why: string
}

export default function Extrema() {
  const [expr, setExpr] = useUrlState('f', presets[0].expr)
  const { f, fp } = useDerivs(expr)
  const [a, setA] = useState(-1)
  const [b, setB] = useState(3.5)
  const W = 4
  const X: V2 = [-W, W]
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  const Y = useMemo(() => autoRange([f], lo - 0.6, hi + 0.6, { min: 3, pad: 0.3 }), [f, lo, hi])

  const cands = useMemo<Cand[]>(() => {
    const out: Cand[] = [
      { x: lo, why: 'endpoint' },
      { x: hi, why: 'endpoint' },
    ]
    for (const r of findRoots(fp, lo, hi, 1500)) if (r > lo + 1e-6 && r < hi - 1e-6) out.push({ x: r, why: "f′ = 0" })
    // corners / cusps: one-sided derivatives disagree
    const N = 800
    for (let i = 1; i < N; i++) {
      const x = lo + ((hi - lo) * i) / N
      const dl = derivLeft(f, x)
      const dr = derivRight(f, x)
      if (isGood(f(x)) && Math.abs(dl - dr) > 0.5 && !out.some((c) => Math.abs(c.x - x) < (hi - lo) / N)) {
        // refine by golden scan of jump
        let best = x
        let bestJ = 0
        for (let k = -10; k <= 10; k++) {
          const t = x + (k * (hi - lo)) / N / 10
          const j = Math.abs(derivLeft(f, t, 1e-7) - derivRight(f, t, 1e-7))
          if (j > bestJ) {
            bestJ = j
            best = t
          }
        }
        const r = Math.round(best * 1e4) / 1e4
        if (!out.some((c) => Math.abs(c.x - r) < 1e-3)) out.push({ x: r, why: "f′ undefined" })
      }
    }
    return out.sort((p, q) => p.x - q.x)
  }, [f, fp, lo, hi])

  const vals = cands.map((c) => f(c.x)).filter(isGood)
  const max = Math.max(...vals)
  const min = Math.min(...vals)
  const clamp = (x: number) => Math.max(-W + 0.05, Math.min(W - 0.05, x))
  const on = ([x]: V2): V2 => [x, isGood(f(x)) ? f(x) : 0]

  return (
    <ToolLayout
      stage={
        <Graph x={X} y={Y} label="Drag the endpoints of [a, b]">
          <Band a={lo} b={hi} color="var(--panel-2)" />
          <HLine y={max} color="var(--fpp)" weight={1} />
          <HLine y={min} color="var(--hot)" weight={1} />
          <Curve f={f} opacity={0.3} />
          <Curve f={f} domain={[lo, hi]} weight={3.5} />
          {cands.map((c) => {
            const v = f(c.x)
            const isMax = Math.abs(v - max) < 1e-9
            const isMin = Math.abs(v - min) < 1e-9
            return (
              <g key={c.x}>
                <Dot x={c.x} y={v} color={isMax ? 'var(--fpp)' : isMin ? 'var(--hot)' : 'var(--ink)'} r={isMax || isMin ? 7 : 5} />
                {(isMax || isMin) && (
                  <Label x={c.x} y={v} color={isMax ? 'var(--fpp)' : 'var(--hot)'} dy={isMax ? -12 : 24} dx={0} anchor="middle">
                    abs. {isMax ? 'max' : 'min'}
                  </Label>
                )}
              </g>
            )
          })}
          <MovablePoint point={[a, f(a)]} onMove={([x]) => setA(clamp(x))} constrain={on} color="var(--f)" />
          <MovablePoint point={[b, f(b)]} onMove={([x]) => setB(clamp(x))} constrain={on} color="var(--f)" />
        </Graph>
      }
      controls={
        <>
          <Group title="Function">
            <FnInput value={expr} onChange={setExpr} presets={presets} />
          </Group>
          <Group title={`Candidates on [${fmt(lo, 2)}, ${fmt(hi, 2)}]`}>
            <table className="vtable">
              <thead>
                <tr>
                  <th>x</th>
                  <th style={{ textAlign: 'left' }}>why</th>
                  <th>f(x)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cands.map((c) => {
                  const v = f(c.x)
                  const tag = Math.abs(v - max) < 1e-9 ? 'MAX' : Math.abs(v - min) < 1e-9 ? 'MIN' : ''
                  return (
                    <tr key={c.x} className={tag ? 'hl' : ''}>
                      <td>{fmt(c.x, 3)}</td>
                      <td style={{ textAlign: 'left' }}>{c.why}</td>
                      <td>{fmt(v, 4)}</td>
                      <td className={tag === 'MAX' ? 'c-fpp' : 'c-hot'}>{tag}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="callout good">
              Absolute max = {fmt(max, 4)}, absolute min = {fmt(min, 4)}. The biggest and smallest values in the table win. The
              Extreme Value Theorem guarantees both exist because f is continuous on a closed interval.
            </div>
          </Group>
        </>
      }
    />
  )
}
