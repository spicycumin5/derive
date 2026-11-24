import { Plot } from 'mafs'
import { useState } from 'react'
import { Curve, Dot, Graph, Label, Path, SlopeLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Group, Key, Readout, Seg, Slider, Tex } from '../../components/ui'
import { deriv, fmt } from '../../lib/numeric'
import type { Fn } from '../../lib/parse'

const defs: Record<string, { f: Fn; dom: V2; tex: string; inv: string; label: string }> = {
  cube: { f: (x) => 0.25 * x ** 3 + 0.5 * x, dom: [-2.6, 2.6], tex: 'f(x)=\\tfrac14x^3+\\tfrac12x', inv: 'f^{-1}', label: '¼x³ + ½x' },
  exp: { f: Math.exp, dom: [-4, 1.6], tex: 'f(x)=e^x', inv: '\\ln x', label: 'eˣ → ln x' },
  sq: { f: (x) => x * x, dom: [0, 2.2], tex: 'f(x)=x^2,\\ x\\ge0', inv: '\\sqrt{x}', label: 'x² → √x' },
  sin: { f: Math.sin, dom: [-Math.PI / 2, Math.PI / 2], tex: 'f(x)=\\sin x', inv: '\\arcsin x', label: 'sin → arcsin' },
}

export default function Inverse() {
  const [k, setK] = useState('cube')
  const d = defs[k]
  const [s, setS] = useState(0.7)
  const a = d.dom[0] + (d.dom[1] - d.dom[0]) * s
  const b = d.f(a)
  const m = deriv(d.f, a)
  const X: V2 = [-4.2, 4.2]
  const Y: V2 = [-3.4, 3.4]

  return (
    <ToolLayout
      stage={
        <Graph equal x={X} y={Y} label="Reflection across y = x">
          <Curve f={(x) => x} color="var(--muted)" dashed weight={1.5} />
          <Curve f={d.f} domain={d.dom} />
          <Plot.Parametric xy={(t) => [d.f(t), t]} domain={d.dom} color="var(--g)" weight={3} />
          <Path
            pts={[
              [a, b],
              [b, a],
            ]}
            color="var(--faint)"
            dashed
            weight={1.5}
          />
          <SlopeLine x0={a} y0={b} m={m} color="var(--fp)" half={1.3} />
          <SlopeLine x0={b} y0={a} m={1 / m} color="var(--fpp)" half={1.3} />
          <Dot x={a} y={b} color="var(--f)" />
          <Dot x={b} y={a} color="var(--g)" />
          <Label x={a} y={b} color="var(--f)" dx={-10} anchor="end">
            ({fmt(a, 2)}, {fmt(b, 2)})
          </Label>
          <Label x={b} y={a} color="var(--g)" dx={10} dy={16}>
            ({fmt(b, 2)}, {fmt(a, 2)})
          </Label>
        </Graph>
      }
      controls={
        <>
          <Group title="Function">
            <Seg value={k} onChange={setK} options={Object.entries(defs).map(([v, o]) => ({ value: v, label: o.label }))} />
            <div className="big-eq">
              <Tex>{d.tex}</Tex>
            </div>
            <div className="strip" style={{ padding: 0 }}>
              <Key color="var(--f)">f</Key>
              <Key color="var(--g)">
                <Tex>{d.inv}</Tex>
              </Key>
              <Key color="var(--muted)" dashed>
                y = x
              </Key>
            </div>
          </Group>
          <Group title="Point">
            <Slider label="a" value={s} min={0.01} max={0.99} step={0.001} onChange={setS} format={() => fmt(a, 3)} />
          </Group>
          <Group title="Slopes">
            <Readout
              rows={[
                [<span className="c-fp">slope of f at a</span>, fmt(m, 4)],
                [<span className="c-fpp">slope of f⁻¹ at b = f(a)</span>, fmt(1 / m, 4)],
                ['product', fmt(m * (1 / m), 4)],
              ]}
            />
            <div className="big-eq">
              <Tex>{`(f^{-1})'(${fmt(b, 2)}) = \\frac{1}{f'(${fmt(a, 2)})} = \\frac{1}{${fmt(m, 3)}}`}</Tex>
            </div>
          </Group>
        </>
      }
    />
  )
}
