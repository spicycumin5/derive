import { MovablePoint } from 'mafs'
import { useMemo, useState } from 'react'
import { Curve, Dot, Graph, Label, Path, SlopeLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Check, FnInput, Group, PlayButton, Readout, Slider, Tex, usePlayer, useUrlState } from '../../components/ui'
import { autoRange, useDerivs } from '../../lib/calc'
import { fmt, isGood } from '../../lib/numeric'

const presets = [
  { label: 'x²', expr: 'x^2' },
  { label: '0.5x³ − 2x', expr: '0.5x^3 - 2x' },
  { label: 'sin x', expr: 'sin(x)' },
  { label: '√x', expr: 'sqrt(x)' },
  { label: 'eˣ', expr: 'exp(x)' },
  { label: '1/x', expr: '1/x' },
]

export default function SecantTangent() {
  const [expr, setExpr] = useUrlState('f', presets[0].expr)
  const { f, fp } = useDerivs(expr)
  const [a, setA] = useState(1)
  const [t, setT] = useState(0) // 0..1 → h shrinks
  const [neg, setNeg] = useState(false)
  const [showTan, setShowTan] = useState(true)
  const hMax = 2
  const h = (neg ? -1 : 1) * Math.max(hMax * (1 - t) ** 2.5, 1e-4)
  const [playing, toggle] = usePlayer(() => t, setT, { from: 0, to: 1, seconds: 5 })

  const X: V2 = [-4, 4]
  const Y = useMemo(() => autoRange([f], -4, 4, { min: 4 }), [f])
  const fa = f(a)
  const fah = f(a + h)
  const dq = (fah - fa) / h
  const m = fp(a)
  const table = [1, 0.5, 0.1, 0.01, 0.001].map((hh) => (neg ? -hh : hh))

  return (
    <ToolLayout
      stage={
        <Graph x={X} y={Y} label={<span>Drag the point. Shrink h.</span>}>
          <Curve f={f} />
          {showTan && <SlopeLine x0={a} y0={fa} m={m} color="var(--fp)" dashed weight={2} />}
          {isGood(fah) && (
            <>
              <SlopeLine x0={a} y0={fa} m={dq} color="var(--hot)" weight={2.5} />
              <Path
                pts={[
                  [a, fa],
                  [a + h, fa],
                  [a + h, fah],
                ]}
                color="var(--muted)"
                dashed
                weight={1.5}
              />
              <Label x={a + h / 2} y={fa} dy={fah > fa ? 18 : -8} anchor="middle" color="var(--muted)" dx={0}>
                h = {fmt(h, 3)}
              </Label>
              <Label x={a + h} y={(fa + fah) / 2} color="var(--muted)" dx={h > 0 ? 6 : -6} anchor={h > 0 ? 'start' : 'end'}>
                Δy
              </Label>
              <Dot x={a + h} y={fah} color="var(--hot)" />
            </>
          )}
          <MovablePoint
            point={[a, fa]}
            onMove={([x]) => setA(Math.max(-3.8, Math.min(3.8, x)))}
            constrain={([x]) => [x, isGood(f(x)) ? f(x) : fa]}
            color="var(--f)"
          />
        </Graph>
      }
      controls={
        <>
          <Group title="Function">
            <FnInput value={expr} onChange={setExpr} presets={presets} />
          </Group>
          <Group title="Shrink h">
            <Slider label="Progress toward h = 0" value={t} min={0} max={1} step={0.001} onChange={setT} format={() => 'h = ' + fmt(h, 4)} />
            <div className="btn-row">
              <PlayButton playing={playing} onClick={toggle} label="Shrink h" />
              <button className="btn ghost" onClick={() => setT(0)}>
                Reset
              </button>
            </div>
            <Check checked={neg} onChange={setNeg}>
              Approach from the left (h &lt; 0)
            </Check>
            <Check checked={showTan} onChange={setShowTan}>
              Show the true tangent line
            </Check>
          </Group>
          <Group title="Difference quotient">
            <div className="big-eq">
              <Tex>{`\\frac{f(${fmt(a, 2)}+h)-f(${fmt(a, 2)})}{h} = ${fmt(dq, 4)}`}</Tex>
            </div>
            <Readout
              rows={[
                [<span className="c-hot">secant slope</span>, fmt(dq, 5)],
                [<span className="c-fp">tangent slope f′(a)</span>, fmt(m, 5)],
                ['difference', fmt(dq - m, 5)],
              ]}
            />
            <table className="vtable">
              <thead>
                <tr>
                  <th>h</th>
                  <th>difference quotient</th>
                </tr>
              </thead>
              <tbody>
                {table.map((hh) => (
                  <tr key={hh}>
                    <td>{fmt(hh, 3)}</td>
                    <td>{fmt((f(a + hh) - fa) / hh, 5)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Group>
        </>
      }
    />
  )
}
