import { MovablePoint } from 'mafs'
import { useMemo, useState } from 'react'
import { Curve, Graph, SlopeLine, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { FnInput, Group, Readout, Slider, Tex, useFnState } from '../../components/ui'
import { autoRange } from '../../lib/calc'
import { antiderivative, fmt } from '../../lib/numeric'

const presets = [
  { label: '2x', expr: '2x' },
  { label: 'cos x', expr: 'cos(x)' },
  { label: 'x² − 1', expr: 'x^2 - 1' },
  { label: 'eˣ', expr: 'exp(x)' },
  { label: '1/(1 + x²)', expr: '1/(1 + x^2)' },
]

export default function Antiderivatives() {
  const { expr, setExpr, fn: f } = useFnState('f', presets[0].expr)
  const W = 4
  const X: V2 = [-W, W]
  const G = useMemo(() => antiderivative(f, 0, -W, W), [f])
  const [ic, setIc] = useState<V2>([1, 2])
  const C = ic[1] - G(ic[0])
  const [col, setCol] = useState(-1.5)
  const Ybase = useMemo(() => autoRange([G], -W, W, { min: 4 }), [G])
  const Y: V2 = [Ybase[0] - 3, Ybase[1] + 3]
  const family = [-3, -2, -1, 0, 1, 2, 3, 4, 5, -4, -5].map((k) => k * Math.max(1, (Ybase[1] - Ybase[0]) / 8))
  const chosen = (x: number) => G(x) + C

  return (
    <ToolLayout
      stage={
        <Graph x={X} y={Y} label={<Tex>{`F(x)=\\int f(x)\\,dx + C`}</Tex>}>
          {family.map((k) => (
            <Curve key={k} f={(x) => G(x) + k} color="var(--muted)" opacity={0.35} weight={1.8} />
          ))}
          <VLine x={col} color="var(--fp)" weight={1} />
          {family.map((k) => (
            <SlopeLine key={'s' + k} x0={col} y0={G(col) + k} m={f(col)} color="var(--fp)" half={0.35} weight={2.5} />
          ))}
          <Curve f={chosen} color="var(--f)" weight={3.5} />
          <MovablePoint point={ic} onMove={(p) => setIc([Math.max(-W, Math.min(W, p[0])), p[1]])} color="var(--hot)" />
        </Graph>
      }
      controls={
        <>
          <Group title="Derivative f = F′">
            <FnInput label="F′(x) =" value={expr} onChange={setExpr} presets={presets} />
          </Group>
          <Group title="Same slopes in every column">
            <Slider label="Column x" value={col} min={-W} max={W} step={0.01} onChange={setCol} />
            <p className="c-muted" style={{ margin: 0, fontSize: 'var(--fs-s)' }}>
              The orange tick marks all have slope f({fmt(col, 2)}) = {fmt(f(col), 3)}. Shifting a curve up or down never changes its
              slopes.
            </p>
          </Group>
          <Group title="Initial condition (drag the pink point)">
            <Readout
              rows={[
                ['passes through', `(${fmt(ic[0], 2)}, ${fmt(ic[1], 2)})`],
                ['C', fmt(C, 4)],
              ]}
            />
            <div className="callout good">One point pins down C, and with it exactly one curve from the family.</div>
          </Group>
        </>
      }
    />
  )
}
