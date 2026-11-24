import { MovablePoint } from 'mafs'
import { useMemo, useState } from 'react'
import { Curve, Dot, Graph, HLine, SlopeLine, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Check, FnInput, Group, PlayButton, Readout, usePlayer, useUrlState } from '../../components/ui'
import { autoRange, useDerivs } from '../../lib/calc'
import { fmt, isGood } from '../../lib/numeric'

const presets = [
  { label: 'x³/3 − x', expr: 'x^3/3 - x' },
  { label: 'sin x', expr: 'sin(x)' },
  { label: 'x²', expr: 'x^2' },
  { label: '|x|', expr: 'abs(x)' },
  { label: 'eˣ', expr: 'exp(x)' },
  { label: 'x⁴/4 − x²', expr: 'x^4/4 - x^2' },
]

export default function DerivativeGrapher() {
  const [expr, setExpr] = useUrlState('f', presets[0].expr)
  const { f, fp } = useDerivs(expr)
  const [x, setX] = useState(-2.5)
  const [trail, setTrail] = useState(true)
  const [reveal, setReveal] = useState(false)
  const [pts, setPts] = useState<number[]>([])
  const W = 4
  const X: V2 = [-W, W]
  const Yf = useMemo(() => autoRange([f], -W, W, { min: 3 }), [f])
  const Yp = useMemo(() => autoRange([fp], -W, W, { min: 3 }), [fp])

  const move = (nx: number) => {
    const c = Math.max(-W + 0.05, Math.min(W - 0.05, nx))
    setX(c)
    if (trail) setPts((p) => (p.length > 3000 ? p : [...p, c]))
  }
  const [playing, toggle] = usePlayer(() => x, move, { from: -W + 0.05, to: W - 0.05, seconds: 7 })
  const m = fp(x)

  return (
    <ToolLayout
      stage={
        <>
          <Graph small x={X} y={Yf} label={<span className="c-f">f(x): drag the point</span>}>
            <VLine x={x} color="var(--ink)" dashed={false} weight={1} />
            <Curve f={f} />
            <SlopeLine x0={x} y0={f(x)} m={m} color="var(--fp)" half={W * 0.3} />
            <MovablePoint point={[x, f(x)]} onMove={([nx]) => move(nx)} constrain={([px]) => [px, isGood(f(px)) ? f(px) : 0]} color="var(--f)" />
          </Graph>
          <Graph small x={X} y={Yp} label={<span className="c-fp">f′(x): each tangent slope becomes a height</span>}>
            <HLine y={0} color="var(--muted)" dashed={false} weight={1} />
            <VLine x={x} color="var(--ink)" dashed={false} weight={1} />
            {reveal && <Curve f={fp} color="var(--fp)" opacity={0.45} />}
            {pts.map((p, i) => (
              <Dot key={i} x={p} y={fp(p)} color="var(--fp)" r={2.5} />
            ))}
            <Dot x={x} y={m} color="var(--fp)" r={7} />
          </Graph>
        </>
      }
      controls={
        <>
          <Group title="Function">
            <FnInput
              value={expr}
              onChange={(e) => {
                setExpr(e)
                setPts([])
              }}
              presets={presets}
            />
          </Group>
          <Group title="Trace">
            <div className="btn-row">
              <PlayButton playing={playing} onClick={toggle} label="Sweep" />
              <button className="btn ghost" onClick={() => setPts([])}>
                Clear trail
              </button>
            </div>
            <Check checked={trail} onChange={setTrail}>
              Leave a trail
            </Check>
            <Check checked={reveal} onChange={setReveal}>
              Reveal the true f′ curve
            </Check>
          </Group>
          <Group title={`At x = ${fmt(x, 2)}`}>
            <Readout
              rows={[
                [<span className="c-f">f(x)</span>, fmt(f(x))],
                [<span className="c-fp">slope = f′(x)</span>, fmt(m)],
              ]}
            />
            <div className="callout">
              {Math.abs(m) < 0.05
                ? 'Flat tangent, so f′ is crossing zero here.'
                : m > 0
                  ? 'f is going uphill, so the f′ point sits above the axis.'
                  : 'f is going downhill, so the f′ point sits below the axis.'}
            </div>
          </Group>
        </>
      }
    />
  )
}
