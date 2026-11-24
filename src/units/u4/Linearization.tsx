import { MovablePoint } from 'mafs'
import { useState } from 'react'
import { Curve, Dot, Graph, Label, Path, SlopeLine, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { FnInput, Group, Readout, Slider, Tex, useUrlState } from '../../components/ui'
import { useDerivs } from '../../lib/calc'
import { fmt, isGood } from '../../lib/numeric'

const presets = [
  { label: '√x at 4', expr: 'sqrt(x)', a: 4, x: 4.6 },
  { label: 'sin x at 0', expr: 'sin(x)', a: 0, x: 0.5 },
  { label: 'eˣ at 0', expr: 'exp(x)', a: 0, x: 0.4 },
  { label: 'ln x at 1', expr: 'ln(x)', a: 1, x: 1.3 },
  { label: '∛x at 8', expr: 'cbrt(x)', a: 8, x: 8.8 },
  { label: 'x³ at 1', expr: 'x^3', a: 1, x: 1.3 },
]

export default function Linearization() {
  const [expr, setExpr] = useUrlState('f', presets[0].expr)
  const { f, fp, fpp } = useDerivs(expr)
  const [a, setA] = useState(presets[0].a)
  const [x, setX] = useState(presets[0].x)
  const [z, setZ] = useState(0.4)
  const w = 10 ** z
  const fa = f(a)
  const m = fp(a)
  const L = (t: number) => fa + m * (t - a)
  const err = f(x) - L(x)
  const conc = fpp(a)
  const X: V2 = [a - w * 1.5, a + w * 1.5]
  const Y: V2 = [fa - w, fa + w]

  return (
    <ToolLayout
      stage={
        <Graph equal x={X} y={Y} label={<Tex>{`L(x) = ${fmt(fa, 3)} + ${fmt(m, 3)}(x - ${fmt(a, 2)})`}</Tex>}>
          <Curve f={f} />
          <SlopeLine x0={a} y0={fa} m={m} color="var(--fp)" />
          <VLine x={x} color="var(--faint)" weight={1} />
          {isGood(f(x)) && (
            <>
              <Path
                pts={[
                  [x, f(x)],
                  [x, L(x)],
                ]}
                color="var(--hot)"
                weight={4}
              />
              <Dot x={x} y={f(x)} color="var(--f)" r={5} />
              <Dot x={x} y={L(x)} color="var(--fp)" r={5} />
              <Label x={x} y={(f(x) + L(x)) / 2} color="var(--hot)">
                error
              </Label>
            </>
          )}
          <MovablePoint point={[a, fa]} onMove={([nx]) => setA(nx)} constrain={([px]) => [px, isGood(f(px)) ? f(px) : fa]} color="var(--f)" />
        </Graph>
      }
      controls={
        <>
          <Group title="Function and base point">
            <FnInput
              value={expr}
              onChange={(e) => {
                setExpr(e)
                const p = presets.find((p) => p.expr === e)
                if (p) {
                  setA(p.a)
                  setX(p.x)
                }
              }}
              presets={presets}
            />
            <Slider label="a (or drag the blue point)" value={a} min={-5} max={10} step={0.05} onChange={setA} />
          </Group>
          <Group title="Estimate at">
            <Slider label="x" value={x} min={a - 3 * w} max={a + 3 * w} step={w / 200} onChange={setX} format={(v) => fmt(v, 3)} />
            <Slider label="Zoom" value={z} min={-2} max={1} step={0.01} onChange={setZ} format={(v) => '±' + fmt(10 ** v, 3)} />
          </Group>
          <Group title="Approximation">
            <Readout
              rows={[
                [<span className="c-fp">L(x), the estimate</span>, fmt(L(x), 5)],
                [<span className="c-f">f(x), the actual value</span>, fmt(f(x), 5)],
                [<span className="c-hot">error f − L</span>, fmt(err, 5)],
                ["f″(a)", fmt(conc, 4)],
              ]}
            />
            <div className="callout">
              {Math.abs(conc) < 1e-6
                ? 'f″(a) = 0, so the concavity alone doesn’t settle over vs. under.'
                : conc > 0
                  ? 'f is concave up at a, so the tangent sits below the curve and L(x) is an UNDERestimate.'
                  : 'f is concave down at a, so the tangent sits above the curve and L(x) is an OVERestimate.'}
            </div>
          </Group>
        </>
      }
    />
  )
}
