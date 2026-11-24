import { useState } from 'react'
import { Curve, Dot, Graph, HLine, Label, SlopeLine, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Group, PlayButton, Readout, Slider, Tex, usePlayer } from '../../components/ui'
import { fmt } from '../../lib/numeric'

export default function Exponential() {
  const [k, setK] = useState(0.35)
  const [y0, setY0] = useState(10)
  const [t, setT] = useState(2)
  const T = 10
  const [playing, toggle] = usePlayer(() => t, setT, { from: 0, to: T, seconds: 7 })
  const y = (s: number) => y0 * Math.exp(k * s)
  const yMax = Math.max(y0 * 1.2, Math.min(y(T), y0 * 40) * 1.1)
  const X: V2 = [-0.3, T]
  const Y: V2 = [-yMax * 0.05, yMax]
  const dbl = Math.LN2 / Math.abs(k)
  const marks: number[] = []
  if (Math.abs(k) > 0.02) for (let n = 1; n * dbl <= T && n < 12; n++) marks.push(n * dbl)
  const yt = y(t)

  return (
    <ToolLayout
      stage={
        <Graph x={X} y={Y} label={<Tex>{`y = ${fmt(y0, 2)}\\,e^{${fmt(k, 2)}t}`}</Tex>}>
          {marks.map((m, i) => (
            <g key={m}>
              <VLine x={m} color="var(--faint)" weight={1} />
              <HLine y={y(m)} color="var(--faint)" weight={1} />
              <Label x={m} y={y(m)} color="var(--muted)" dx={6} dy={k > 0 ? -6 : 16} size={12}>
                {k > 0 ? `×${2 ** (i + 1)}` : `÷${2 ** (i + 1)}`}
              </Label>
            </g>
          ))}
          <Curve f={y} />
          <SlopeLine x0={t} y0={yt} m={k * yt} color="var(--fp)" half={1.6} />
          <Dot x={t} y={yt} color="var(--hot)" />
        </Graph>
      }
      controls={
        <>
          <Group title="Model">
            <div className="big-eq">
              <Tex>{'\\frac{dy}{dt}=ky \\;\\Rightarrow\\; y=y_0e^{kt}'}</Tex>
            </div>
            <Slider label="Growth constant k" value={k} min={-0.8} max={0.8} step={0.01} onChange={setK} />
            <Slider label="Initial amount y₀" value={y0} min={1} max={50} step={1} onChange={setY0} />
          </Group>
          <Group title="Time">
            <Slider label="t" value={t} min={0} max={T} step={0.01} onChange={setT} />
            <PlayButton playing={playing} onClick={toggle} label="Run" />
          </Group>
          <Group title={`At t = ${fmt(t, 2)}`}>
            <Readout
              rows={[
                ['y', fmt(yt, 3)],
                [<span className="c-fp">dy/dt = k·y</span>, `${fmt(k, 2)} × ${fmt(yt, 2)} = ${fmt(k * yt, 3)}`],
                [k >= 0 ? 'doubling time' : 'half-life', Math.abs(k) > 0.001 ? fmt(dbl, 3) : '∞'],
              ]}
            />
            <div className="callout">
              The slope is always k times the height. Bigger y means faster change, which is why exponential growth gets steeper and
              steeper. Each doubling (or halving) takes the same time, ln 2 / |k|.
            </div>
          </Group>
        </>
      }
    />
  )
}
