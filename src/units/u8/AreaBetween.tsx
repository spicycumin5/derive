import { useMemo, useState } from 'react'
import { Curve, Dot, Graph, Path, Rect, VLine, HLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Group, Key, Readout, Slider, Tex } from '../../components/ui'
import { findRoots, fmt, integrate } from '../../lib/numeric'
import type { Fn } from '../../lib/parse'

interface Pair {
  label: string
  mode: 'dx' | 'dy'
  p: Fn
  q: Fn
  pTex: string
  qTex: string
  view: [V2, V2]
  range: V2
}

const pairs: Pair[] = [
  { label: 'y = x + 2 and y = x²', mode: 'dx', p: (x) => x + 2, q: (x) => x * x, pTex: 'x+2', qTex: 'x^2', view: [[-2.5, 3.5], [-1, 6]], range: [-2.5, 3.5] },
  { label: 'y = √x and y = x/2', mode: 'dx', p: Math.sqrt, q: (x) => x / 2, pTex: '\\sqrt{x}', qTex: 'x/2', view: [[-0.5, 5.5], [-0.8, 3]], range: [0, 5.5] },
  { label: 'sin x and cos x', mode: 'dx', p: Math.sin, q: Math.cos, pTex: '\\sin x', qTex: '\\cos x', view: [[-0.3, 6.6], [-1.6, 1.6]], range: [-0.3, 6.6] },
  { label: 'x³ − 3x and x', mode: 'dx', p: (x) => x ** 3 - 3 * x, q: (x) => x, pTex: 'x^3-3x', qTex: 'x', view: [[-2.6, 2.6], [-4, 4]], range: [-2.6, 2.6] },
  { label: 'x = y² and x = y + 2', mode: 'dy', p: (y) => y + 2, q: (y) => y * y, pTex: 'y+2', qTex: 'y^2', view: [[-1, 5], [-2, 3]], range: [-2, 3] },
]

export default function AreaBetween() {
  const [i, setI] = useState(0)
  const P = pairs[i]
  const { p, q, mode } = P
  const roots = useMemo(() => findRoots((t) => p(t) - q(t), P.range[0], P.range[1], 2000), [p, q, P.range])
  const [lo0, hi0] = roots.length >= 2 ? [roots[0], roots[roots.length - 1]] : [P.range[0] + 0.5, P.range[1] - 0.5]
  const [lo, setLo] = useState(lo0)
  const [hi, setHi] = useState(hi0)
  const [s, setS] = useState(0.4)
  const pick = (k: number) => {
    setI(k)
    const Q = pairs[k]
    const r = findRoots((t) => Q.p(t) - Q.q(t), Q.range[0], Q.range[1], 2000)
    setLo(r.length >= 2 ? r[0] : Q.range[0] + 0.5)
    setHi(r.length >= 2 ? r[r.length - 1] : Q.range[1] - 0.5)
  }
  const area = useMemo(() => integrate((t) => Math.abs(p(t) - q(t)), lo, hi, 2000), [p, q, lo, hi])
  const signed = useMemo(() => integrate((t) => p(t) - q(t), lo, hi, 2000), [p, q, lo, hi])
  const inner = roots.filter((r) => r > lo + 1e-6 && r < hi - 1e-6)
  const st = lo + (hi - lo) * s
  const dt = (hi - lo) / 40
  const top = Math.max(p(st), q(st))
  const bot = Math.min(p(st), q(st))

  // region polygon
  const region = useMemo(() => {
    const N = 300
    const A: V2[] = []
    const B: V2[] = []
    for (let k = 0; k <= N; k++) {
      const t = lo + ((hi - lo) * k) / N
      const a: V2 = mode === 'dx' ? [t, p(t)] : [p(t), t]
      const b: V2 = mode === 'dx' ? [t, q(t)] : [q(t), t]
      if (Number.isFinite(a[0] + a[1] + b[0] + b[1])) {
        A.push(a)
        B.push(b)
      }
    }
    return [...A, ...B.reverse()]
  }, [p, q, lo, hi, mode])

  const curveY = (fn: Fn, color: string) => {
    const pts: V2[] = []
    for (let k = 0; k <= 400; k++) {
      const y = P.view[1][0] + ((P.view[1][1] - P.view[1][0]) * k) / 400
      pts.push([fn(y), y])
    }
    return <Path pts={pts} color={color} weight={3.5} />
  }

  return (
    <ToolLayout
      stage={
        <Graph equal x={P.view[0]} y={P.view[1]} label={mode === 'dx' ? 'Vertical slices: (top − bottom) dx' : 'Horizontal slices: (right − left) dy'}>
          <Path pts={region} fill="var(--area)" weight={0} />
          {mode === 'dx' ? (
            <>
              <Curve f={p} color="var(--f)" weight={3.5} />
              <Curve f={q} color="var(--g)" weight={3.5} />
              <Rect x0={st - dt / 2} x1={st + dt / 2} y0={bot} y1={top} fill="color-mix(in srgb, var(--hot) 55%, transparent)" stroke="var(--hot)" />
              <VLine x={lo} weight={1} />
              <VLine x={hi} weight={1} />
            </>
          ) : (
            <>
              {curveY(p, 'var(--f)')}
              {curveY(q, 'var(--g)')}
              <Rect x0={bot} x1={top} y0={st - dt / 2} y1={st + dt / 2} fill="color-mix(in srgb, var(--hot) 55%, transparent)" stroke="var(--hot)" />
              <HLine y={lo} weight={1} />
              <HLine y={hi} weight={1} />
            </>
          )}
          {roots.map((r) => (mode === 'dx' ? <Dot key={r} x={r} y={p(r)} color="var(--ink)" r={5} /> : <Dot key={r} x={p(r)} y={r} color="var(--ink)" r={5} />))}
        </Graph>
      }
      controls={
        <>
          <Group title="Region">
            <div className="chips">
              {pairs.map((x, k) => (
                <button key={k} className="chip" aria-pressed={k === i} onClick={() => pick(k)}>
                  {x.label}
                </button>
              ))}
            </div>
            <div className="strip" style={{ padding: 0 }}>
              <Key color="var(--f)">
                <Tex>{(mode === 'dx' ? 'y=' : 'x=') + P.pTex}</Tex>
              </Key>
              <Key color="var(--g)">
                <Tex>{(mode === 'dx' ? 'y=' : 'x=') + P.qTex}</Tex>
              </Key>
            </div>
          </Group>
          <Group title={`Limits (intersections at ${roots.map((r) => fmt(r, 3)).join(', ') || 'none'})`}>
            <Slider label="from" value={lo} min={P.range[0]} max={hi - 0.05} step={0.01} onChange={setLo} />
            <Slider label="to" value={hi} min={lo + 0.05} max={P.range[1]} step={0.01} onChange={setHi} />
            <Slider label="Sample slice" value={s} min={0} max={1} step={0.005} onChange={setS} format={() => (mode === 'dx' ? 'x = ' : 'y = ') + fmt(st, 2)} />
          </Group>
          <Group title="Area">
            <div className="big-eq">
              <Tex>{`A=\\int_{${fmt(lo, 2)}}^{${fmt(hi, 2)}}\\left|${P.pTex}-\\left(${P.qTex}\\right)\\right|\\,d${mode === 'dx' ? 'x' : 'y'}`}</Tex>
            </div>
            <Readout
              rows={[
                ['slice length', fmt(top - bot, 4)],
                [<span className="c-hot">area</span>, fmt(area, 5)],
                ['without |…| (wrong if curves cross)', fmt(signed, 5)],
              ]}
            />
            {inner.length > 0 && (
              <div className="callout hot">The curves cross inside the interval at {inner.map((r) => fmt(r, 3)).join(', ')}. Split the integral there.</div>
            )}
          </Group>
        </>
      }
    />
  )
}
