import { useState } from 'react'
import { Curve, Dot, Graph, SlopeLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Group, Key, PlayButton, Readout, Seg, Slider, Tex, usePlayer } from '../../components/ui'
import { fmt, isGood } from '../../lib/numeric'
import type { Fn } from '../../lib/parse'

type Ex = 'smooth' | 'corner' | 'cusp' | 'vert' | 'jump' | 'joined'
const exs: Record<Ex, { f: Fn; a: number; tex: string; label: string; verdict: string }> = {
  smooth: { f: (x) => x * x - x, a: 1, tex: 'x^2-x', label: 'Smooth', verdict: 'Differentiable: zoom in and the graph straightens into a line.' },
  corner: { f: (x) => Math.abs(x - 1) + 0.5, a: 1, tex: '|x-1|+0.5', label: 'Corner', verdict: 'Not differentiable: a corner. The left and right slopes stay different (−1 and +1).' },
  cusp: { f: (x) => Math.cbrt((x - 1) ** 2), a: 1, tex: '(x-1)^{2/3}', label: 'Cusp', verdict: 'Not differentiable: a cusp. The slopes go to −∞ and +∞.' },
  vert: { f: (x) => Math.cbrt(x - 1) + 1, a: 1, tex: '\\sqrt[3]{x-1}+1', label: 'Vertical', verdict: 'Not differentiable: the tangent is vertical, so its slope is undefined.' },
  jump: { f: (x) => (x < 1 ? x : x + 1), a: 1, tex: 'x<1:\\ x,\\ \\ x\\ge1:\\ x+1', label: 'Jump', verdict: 'Not differentiable: not even continuous. Differentiable implies continuous.' },
  joined: {
    f: (x) => (x < 1 ? x * x : 2 * x - 1),
    a: 1,
    tex: 'x<1:\\ x^2,\\ \\ x\\ge1:\\ 2x-1',
    label: 'Piecewise',
    verdict: 'Differentiable! The pieces meet (continuous) AND their slopes match (2 = 2).',
  },
}

export default function Differentiability() {
  const [which, setWhich] = useState<Ex>('corner')
  const [z, setZ] = useState(0.3)
  const [playing, toggle] = usePlayer(() => z, setZ, { from: 0.3, to: -3, seconds: 5 })
  const e = exs[which]
  const { f, a } = e
  const fa = f(a)
  const w = 10 ** z
  const X: V2 = [a - w, a + w]
  const Y: V2 = [fa - w * 0.8, fa + w * 0.8]
  const h = w * 0.6
  const fl = f(a - h)
  const fr = f(a + h)
  const sl = (fa - fl) / h
  const sr = (fr - fa) / h
  const limits = [1e-1, 1e-3, 1e-5]

  return (
    <ToolLayout
      stage={
        <Graph x={X} y={Y} label={<Tex>{`f(x) = ${e.tex}`}</Tex>}>
          <Curve f={f} samples={1200} />
          {isGood(sl) && <SlopeLine x0={a} y0={fa} m={sl} color="var(--fp)" weight={2} dashed />}
          {isGood(sr) && <SlopeLine x0={a} y0={fa} m={sr} color="var(--fpp)" weight={2} dashed />}
          {which === 'jump' && <Dot x={a} y={a} open color="var(--f)" />}
          <Dot x={a} y={fa} color="var(--hot)" />
        </Graph>
      }
      controls={
        <>
          <Group title="Example">
            <Seg<Ex>
              value={which}
              onChange={(v) => {
                setWhich(v)
                setZ(0.3)
              }}
              options={(Object.keys(exs) as Ex[]).map((k) => ({ value: k, label: exs[k].label }))}
            />
          </Group>
          <Group title="Zoom in at x = 1">
            <Slider label="Zoom" value={z} min={-4} max={0.5} step={0.01} onChange={setZ} format={(v) => '×' + fmt(10 ** -v, 0)} />
            <PlayButton playing={playing} onClick={toggle} label="Zoom in" />
            <div className="strip" style={{ padding: 0 }}>
              <Key color="var(--fp)" dashed>
                left secant
              </Key>
              <Key color="var(--fpp)" dashed>
                right secant
              </Key>
            </div>
          </Group>
          <Group title="One-sided slopes">
            <table className="vtable">
              <thead>
                <tr>
                  <th>h</th>
                  <th className="c-fp">left slope</th>
                  <th className="c-fpp">right slope</th>
                </tr>
              </thead>
              <tbody>
                {limits.map((hh) => (
                  <tr key={hh}>
                    <td>{hh}</td>
                    <td>{fmt((fa - f(a - hh)) / hh, 3)}</td>
                    <td>{fmt((f(a + hh) - fa) / hh, 3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Readout
              rows={[
                ['continuous at 1?', which === 'jump' ? 'no' : 'yes'],
                ['slopes agree?', which === 'smooth' || which === 'joined' ? 'yes' : 'no'],
              ]}
            />
            <div className={'callout ' + (which === 'smooth' || which === 'joined' ? 'good' : 'hot')}>{e.verdict}</div>
          </Group>
        </>
      }
    />
  )
}
