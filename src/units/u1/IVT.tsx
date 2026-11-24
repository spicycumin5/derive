import { MovablePoint } from 'mafs'
import { useMemo, useState } from 'react'
import { Band, Curve, Dot, Graph, HBand, HLine, Label, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Check, Group, Readout, Slider } from '../../components/ui'
import { findRoots, fmt } from '../../lib/numeric'
import type { Fn } from '../../lib/parse'

const cont: Fn = (x) => 0.5 * x ** 3 - 1.5 * x ** 2 + 0.2 * x + 1.5
const jumpy: Fn = (x) => (x < 1.4 ? 0.6 * x + 0.3 : 0.6 * x + 2.2)

export default function IVT() {
  const [broken, setBroken] = useState(false)
  const [a, setA] = useState(-0.6)
  const [b, setB] = useState(3.2)
  const [k, setK] = useState(1.2)
  const f = broken ? jumpy : cont
  const fa = f(a)
  const fb = f(b)
  const lo = Math.min(fa, fb)
  const hi = Math.max(fa, fb)
  const inRange = k >= lo && k <= hi
  const g = useMemo(() => (x: number) => f(x) - k, [f, k])
  const cs = useMemo(() => findRoots(g, a, b, 1200), [g, a, b])
  const X: V2 = [-1.5, 4]
  const Y: V2 = [-1.5, 4.5]

  return (
    <ToolLayout
      stage={
        <Graph x={X} y={Y} label="Drag the k point up and down the y-axis">
          <Band a={a} b={b} color="var(--panel-2)" />
          <HBand a={lo} b={hi} color="var(--pos-band)" />
          <VLine x={a} />
          <VLine x={b} />
          <HLine y={k} color={inRange ? 'var(--hot)' : 'var(--muted)'} dashed={false} weight={2} />
          <Curve f={f} domain={[a, b]} weight={3.5} />
          <Curve f={f} opacity={0.25} weight={2} />
          <Dot x={a} y={fa} color="var(--f)" />
          <Dot x={b} y={fb} color="var(--f)" />
          <Label x={a} y={fa} dx={-8} anchor="end">
            f(a)
          </Label>
          <Label x={b} y={fb}>
            f(b)
          </Label>
          {cs.map((c) => (
            <g key={c}>
              <VLine x={c} color="var(--hot)" weight={1} />
              <Dot x={c} y={k} color="var(--hot)" />
              <Label x={c} y={k} color="var(--hot)" dy={20} dx={0} anchor="middle">
                c
              </Label>
            </g>
          ))}
          <MovablePoint point={[0, k]} onMove={([, y]) => setK(Math.max(Y[0], Math.min(Y[1], y)))} constrain={([, y]) => [0, y]} color="var(--hot)" />
          <Label x={0} y={k} color="var(--hot)" dx={14}>
            k
          </Label>
        </Graph>
      }
      controls={
        <>
          <Group title="Interval">
            <Slider label="a" value={a} min={-1.4} max={b - 0.2} step={0.05} onChange={setA} />
            <Slider label="b" value={b} min={a + 0.2} max={3.9} step={0.05} onChange={setB} />
            <Slider label="Target k" value={k} min={-1.5} max={4.5} step={0.01} onChange={setK} />
          </Group>
          <Group title="Function">
            <Check checked={broken} onChange={setBroken}>
              Make f discontinuous (jump at x = 1.4)
            </Check>
          </Group>
          <Group title="Check">
            <Readout
              rows={[
                ['f(a)', fmt(fa)],
                ['f(b)', fmt(fb)],
                ['k', fmt(k)],
                ['k between f(a) and f(b)?', inRange ? 'yes' : 'no'],
                ['solutions c found', String(cs.length)],
              ]}
            />
            <div className={'callout ' + (cs.length ? 'good' : 'hot')}>
              {inRange
                ? cs.length
                  ? broken
                    ? 'A c exists here, but only by luck. Without continuity, IVT guarantees nothing.'
                    : `IVT guarantees a c in (a, b) with f(c) = k. Here there ${cs.length === 1 ? 'is 1' : 'are ' + cs.length}.`
                  : 'k is between f(a) and f(b), but f jumps right over it. Continuity was required.'
                : 'k is outside [f(a), f(b)], so IVT makes no promise. There may or may not be a c.'}
            </div>
          </Group>
        </>
      }
    />
  )
}
