import { useMemo, useState } from 'react'
import { Curve, Graph, HLine, Label, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { FnInput, Group, Readout, Slider, useFnState } from '../../components/ui'
import { fmt, isGood } from '../../lib/numeric'
import type { Fn } from '../../lib/parse'

const presets = [
  { label: '(3x² + 1)/(x² − 4)', expr: '(3x^2 + 1)/(x^2 - 4)' },
  { label: '(2x + 1)/(x² + 1)', expr: '(2x + 1)/(x^2 + 1)' },
  { label: 'x³/(x² + 1)', expr: 'x^3/(x^2 + 1)' },
  { label: '2x/√(x² + 1)', expr: '2x/sqrt(x^2 + 1)' },
  { label: 'sin(x)/x', expr: 'sin(x)/x' },
  { label: 'eˣ', expr: 'exp(x)' },
  { label: '(5 − x)/(2x + 3)', expr: '(5 - x)/(2x + 3)' },
]

function limAt(f: Fn, sgn: 1 | -1): number | null {
  const xs = [1e4, 1e5, 1e6, 1e7].map((x) => x * sgn)
  const v = xs.map(f)
  if (!v.every(isGood)) {
    const last = v[v.length - 1]
    return last === Infinity || last === -Infinity ? last : null
  }
  if (Math.abs(v[3]) > 1e6 && Math.abs(v[3]) > Math.abs(v[2])) return Math.sign(v[3]) * Infinity
  if (Math.abs(v[3] - v[2]) < 1e-4 * (1 + Math.abs(v[3]))) return v[3]
  return null
}

export default function InfinityTool() {
  const { expr, setExpr, fn: f } = useFnState('f', presets[0].expr)
  const [z, setZ] = useState(1)
  const w = 10 ** z
  const right = useMemo(() => limAt(f, 1), [f])
  const left = useMemo(() => limAt(f, -1), [f])
  const has = (v: number | null): v is number => v !== null && isFinite(v)
  const asym = [right, left].filter(has)
  const lo = Math.min(...asym, 0)
  const hi = Math.max(...asym, 0)
  const pad = Math.max(3, (hi - lo) * 1.2)
  const Y: V2 = [lo - pad, hi + pad]
  const X: V2 = [-w, w]
  const txt = (v: number | null) => (v === null ? 'DNE (oscillates or unbounded)' : fmt(v, 4))

  return (
    <ToolLayout
      stage={
        <Graph x={X} y={Y} label="Zoom out to see the end behavior">
          {has(right) && <HLine y={right} color="var(--hot)" />}
          {has(left) && left !== right && <HLine y={left} color="var(--g)" />}
          <Curve f={f} samples={3000} />
          {has(right) && (
            <Label x={X[1]} y={right} color="var(--hot)" anchor="end" dx={-10} dy={-10}>
              y = {fmt(right, 3)} as x → ∞
            </Label>
          )}
          {has(left) && (
            <Label x={X[0]} y={left} color={left !== right ? 'var(--g)' : 'var(--hot)'} dx={10} dy={left !== right ? 20 : -10}>
              y = {fmt(left, 3)} as x → −∞
            </Label>
          )}
        </Graph>
      }
      controls={
        <>
          <Group title="Function">
            <FnInput value={expr} onChange={setExpr} presets={presets} />
          </Group>
          <Group title="Zoom out">
            <Slider label="x window" value={z} min={0.5} max={3} step={0.01} onChange={setZ} format={() => '±' + fmt(w, 0)} />
          </Group>
          <Group title="End behavior">
            <Readout
              rows={[
                ['lim x→ ∞', txt(right)],
                ['lim x→ −∞', txt(left)],
                [`f(${fmt(w, 0)})`, fmt(f(w), 5)],
              ]}
            />
            <div className="callout">
              {has(right) || has(left)
                ? 'Horizontal asymptotes describe the far ends only. Near the middle, anything can happen, including crossing them.'
                : 'No horizontal asymptote: f grows without bound or keeps oscillating.'}
            </div>
          </Group>
          <Group title="Rational function shortcut">
            <Readout
              rows={[
                ['deg top < deg bottom', 'y = 0'],
                ['deg top = deg bottom', 'ratio of leading coefficients'],
                ['deg top > deg bottom', 'no horizontal asymptote'],
              ]}
            />
          </Group>
        </>
      }
    />
  )
}
