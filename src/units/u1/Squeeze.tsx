import { useState } from 'react'
import { AreaBetween, Curve, Dot, Graph, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Group, Key, PlayButton, Readout, Seg, Slider, Tex, usePlayer } from '../../components/ui'
import { fmt } from '../../lib/numeric'
import type { Fn } from '../../lib/parse'

type Ex = 'x2' | 'x' | 'sinc'
const ex: Record<Ex, { f: Fn; lo: Fn; hi: Fn; L: number; tex: string; texB: string; y0: number }> = {
  x2: {
    f: (x) => x * x * Math.sin(1 / x),
    lo: (x) => -x * x,
    hi: (x) => x * x,
    L: 0,
    tex: 'f(x)=x^2\\sin(1/x)',
    texB: '-x^2 \\le x^2\\sin(1/x) \\le x^2',
    y0: 0,
  },
  x: {
    f: (x) => x * Math.sin(1 / x),
    lo: (x) => -Math.abs(x),
    hi: (x) => Math.abs(x),
    L: 0,
    tex: 'f(x)=x\\sin(1/x)',
    texB: '-|x| \\le x\\sin(1/x) \\le |x|',
    y0: 0,
  },
  sinc: {
    f: (x) => Math.sin(x) / x,
    lo: (x) => Math.cos(x),
    hi: () => 1,
    L: 1,
    tex: 'f(x)=\\dfrac{\\sin x}{x}',
    texB: '\\cos x \\le \\dfrac{\\sin x}{x} \\le 1',
    y0: 1,
  },
}

export default function Squeeze() {
  const [which, setWhich] = useState<Ex>('x2')
  const [z, setZ] = useState(0)
  const [playing, toggle] = usePlayer(() => z, setZ, { from: 0, to: -2.5, seconds: 6 })
  const e = ex[which]
  const w = 10 ** z * (which === 'sinc' ? 4 : 1)
  const X: V2 = [-w, w]
  const hw = which === 'x2' ? Math.max(w * w * 1.3, w * 0.25) : which === 'x' ? w * 1.2 : Math.max(1 - Math.cos(w), 0.02) * 1.3
  const Y: V2 = which === 'sinc' ? [1 - hw * 1.3, 1 + hw * 0.35] : [-hw, hw]

  const probe = w * 0.5
  return (
    <ToolLayout
      stage={
        <Graph x={X} y={Y} label={<Tex>{e.tex}</Tex>}>
          <AreaBetween f={e.hi} g={e.lo} a={X[0]} b={X[1]} fill="var(--area)" n={400} />
          <Curve f={e.hi} color="var(--fpp)" weight={2.5} />
          <Curve f={e.lo} color="var(--fp)" weight={2.5} />
          <Curve f={e.f} color="var(--f)" weight={2.5} samples={5000} />
          <Dot x={0} y={e.L} open color="var(--hot)" r={7} />
        </Graph>
      }
      controls={
        <>
          <Group title="Example">
            <Seg<Ex>
              value={which}
              onChange={(v) => {
                setWhich(v)
                setZ(0)
              }}
              options={[
                { value: 'x2', label: 'x² sin(1/x)' },
                { value: 'x', label: 'x sin(1/x)' },
                { value: 'sinc', label: 'sin(x)/x' },
              ]}
            />
            <div className="big-eq">
              <Tex>{e.texB}</Tex>
            </div>
            <div className="strip" style={{ padding: 0 }}>
              <Key color="var(--fpp)">upper bound</Key>
              <Key color="var(--f)">f</Key>
              <Key color="var(--fp)">lower bound</Key>
            </div>
          </Group>
          <Group title="Zoom in toward x = 0">
            <Slider label="Window" value={z} min={-3} max={0.4} step={0.01} onChange={setZ} format={() => '±' + fmt(w, 4)} />
            <PlayButton playing={playing} onClick={toggle} label="Squeeze" />
          </Group>
          <Group title={`At x = ${fmt(probe, 5)}`}>
            <Readout
              rows={[
                [<span className="c-fpp">upper</span>, fmt(e.hi(probe), 6)],
                [<span className="c-f">f(x)</span>, fmt(e.f(probe), 6)],
                [<span className="c-fp">lower</span>, fmt(e.lo(probe), 6)],
                ['gap', fmt(e.hi(probe) - e.lo(probe), 6)],
              ]}
            />
            <div className="callout good">
              Both bounds go to {e.L} as x → 0, so the limit of f is {e.L} too.
            </div>
          </Group>
        </>
      }
    />
  )
}
