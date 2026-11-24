import { useMemo, useState } from 'react'
import { AreaBetween, Curve, Dot, Graph, HLine, Label, Rect, SignedArea, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Check, FnInput, Group, Readout, Slider, Tex, useFnState } from '../../components/ui'
import { autoRange } from '../../lib/calc'
import { findRoots, fmt, integrate } from '../../lib/numeric'

const presets = [
  { label: 'x² ', expr: 'x^2' },
  { label: 'sin x + 1', expr: 'sin(x) + 1' },
  { label: '√x', expr: 'sqrt(x)' },
  { label: '4 − x²', expr: '4 - x^2' },
  { label: 'eˣ/3', expr: 'exp(x)/3' },
]

export default function AverageValue() {
  const { expr, setExpr, fn: f } = useFnState('f', presets[0].expr)
  const [a, setA] = useState(0)
  const [b, setB] = useState(2)
  const [showRect, setShowRect] = useState(true)
  const [showDiff, setShowDiff] = useState(false)
  const I = useMemo(() => integrate(f, a, b, 1000), [f, a, b])
  const avg = I / (b - a)
  const cs = useMemo(() => findRoots((x) => f(x) - avg, a, b), [f, avg, a, b])
  const pad = (b - a) * 0.25 + 0.3
  const X: V2 = [a - pad, b + pad]
  const Y = useMemo(() => autoRange([f], a - pad, b + pad, { min: 2 }), [f, a, b, pad])
  const above = useMemo(() => (x: number) => Math.max(f(x), avg), [f, avg])
  const below = useMemo(() => (x: number) => Math.min(f(x), avg), [f, avg])

  return (
    <ToolLayout
      stage={
        <Graph x={X} y={Y} label={<Tex>{`f_{avg} = \\frac{1}{${fmt(b - a, 2)}}\\int_{${fmt(a, 2)}}^{${fmt(b, 2)}} f(x)\\,dx = ${fmt(avg, 3)}`}</Tex>}>
          {!showDiff && <SignedArea f={f} a={a} b={b} />}
          {showRect && <Rect x0={a} x1={b} y0={0} y1={avg} fill="transparent" stroke="var(--hot)" weight={2.5} />}
          {showDiff && (
            <>
              <AreaBetween f={above} g={() => avg} a={a} b={b} fill="color-mix(in srgb, var(--fpp) 40%, transparent)" />
              <AreaBetween f={() => avg} g={below} a={a} b={b} fill="color-mix(in srgb, var(--hot) 35%, transparent)" />
            </>
          )}
          <HLine y={avg} color="var(--hot)" weight={1.5} />
          <VLine x={a} weight={1} />
          <VLine x={b} weight={1} />
          <Curve f={f} />
          {cs.map((c) => (
            <g key={c}>
              <Dot x={c} y={avg} color="var(--hot)" />
              <Label x={c} y={avg} color="var(--hot)" dx={0} dy={-12} anchor="middle">
                c
              </Label>
            </g>
          ))}
        </Graph>
      }
      controls={
        <>
          <Group title="Function">
            <FnInput value={expr} onChange={setExpr} presets={presets} />
            <Slider label="a" value={a} min={-3} max={b - 0.25} step={0.25} onChange={setA} />
            <Slider label="b" value={b} min={a + 0.25} max={4} step={0.25} onChange={setB} />
          </Group>
          <Group title="Show">
            <Check checked={showRect} onChange={setShowRect}>
              Rectangle with the same area
            </Check>
            <Check checked={showDiff} onChange={setShowDiff}>
              Above vs. below the average (equal areas)
            </Check>
          </Group>
          <Group title="Numbers">
            <Readout
              rows={[
                ['∫ f dx', fmt(I, 4)],
                ['width b − a', fmt(b - a, 3)],
                [<span className="c-hot">average value</span>, fmt(avg, 4)],
                ['f(c) = avg at c =', cs.map((c) => fmt(c, 3)).join(', ') || 'none'],
                ['avg rate of change (≠!)', fmt((f(b) - f(a)) / (b - a), 4)],
              ]}
            />
            <div className="callout">The green area above the line exactly fills the pink gaps below it.</div>
          </Group>
        </>
      }
    />
  )
}
