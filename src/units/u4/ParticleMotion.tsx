import { useMemo, useState } from 'react'
import { Arrow, Band, Curve, Dot, Graph, HLine, Label, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { FnInput, Group, PlayButton, Readout, Slider, usePlayer, useUrlState } from '../../components/ui'
import { autoRange, useDerivs } from '../../lib/calc'
import { findRoots, fmt, integrate, signIntervals } from '../../lib/numeric'

const presets = [
  { label: 't³ − 6t² + 9t', expr: 't^3 - 6t^2 + 9t', T: 4.5 },
  { label: '2 sin t', expr: '2sin(t)', T: 9 },
  { label: 't² − 4t + 1', expr: 't^2 - 4t + 1', T: 5 },
  { label: 't·e^(−t/2)', expr: 't*exp(-t/2)', T: 10 },
  { label: 't⁴/4 − 2t³ + 4t²', expr: 't^4/4 - 2t^3 + 4t^2', T: 5.6 },
]

export default function ParticleMotion() {
  const [expr, setExpr] = useUrlState('x', presets[0].expr)
  const [Tstr, setTs] = useUrlState('T', String(presets[0].T))
  const T = Number(Tstr) || 5
  // derivs works in x; substitute t → x
  const { f: x, fp: v, fpp: a } = useDerivs(expr.replace(/(?<![a-zA-Z])t(?![a-zA-Z])/g, 'x'))
  const [t, setT] = useState(0)
  const [playing, toggle] = usePlayer(() => t, setT, { from: 0, to: T, seconds: 8 })

  const tx: V2 = [0, T]
  const yx = useMemo(() => autoRange([x], 0, T), [x, T])
  const yv = useMemo(() => autoRange([v], 0, T), [v, T])
  const ya = useMemo(() => autoRange([a], 0, T), [a, T])
  const speeding = useMemo(() => signIntervals((s) => v(s) * a(s), 0, T), [v, a, T])
  const turns = useMemo(() => findRoots(v, 0, T).filter((r) => r > 1e-6 && r < T - 1e-6), [v, T])

  const xt = x(t)
  const vt = v(t)
  const at = a(t)
  const dist = useMemo(() => integrate((s) => Math.abs(v(s)), 0, t, 400), [v, t])
  const state =
    Math.abs(vt) < 1e-3 ? 'momentarily at rest' : (vt > 0 ? 'moving right' : 'moving left') + (vt * at > 0 ? ', speeding up' : vt * at < 0 ? ', slowing down' : '')

  const bands = speeding.map((b, i) => (
    <Band key={i} a={b.from} b={b.to} color={b.sign > 0 ? 'var(--pos-band)' : b.sign < 0 ? 'var(--neg-band)' : 'transparent'} />
  ))
  const ghosts = Array.from({ length: 14 }, (_, i) => t - (i + 1) * (T / 60)).filter((s) => s >= 0)

  return (
    <ToolLayout
      stage={
        <>
          <Graph x={[yx[0], yx[1]]} y={[-1, 1]} style={{ flex: '0 0 96px', minHeight: 96 }} label="The particle on the x-axis" grid={false}>
            <HLine y={0} color="var(--muted)" dashed={false} weight={2} />
            {[Math.ceil(yx[0]), 0, Math.floor(yx[1])].map((n) => (
              <Label key={n} x={n} y={0} dy={20} dx={0} anchor="middle" color="var(--muted)" weight={600} size={12}>
                {n}
              </Label>
            ))}
            {ghosts.map((s, i) => (
              <Dot key={i} x={x(s)} y={0} color="var(--f)" r={6 - i * 0.35} />
            ))}
            {Math.abs(vt) > 1e-3 && <Arrow from={[xt, 0.35]} to={[xt + vt * ((yx[1] - yx[0]) / 12), 0.35]} color="var(--fp)" />}
            <Dot x={xt} y={0} color="var(--hot)" r={10} />
          </Graph>
          <Graph small x={tx} y={yx} label={<span className="c-f">position x(t)</span>} onPointer={(p) => p && setT(Math.max(0, Math.min(T, p[0])))}>
            {bands}
            <Curve f={x} />
            {turns.map((r) => (
              <Dot key={r} x={r} y={x(r)} color="var(--ink)" open r={5} />
            ))}
            <VLine x={t} color="var(--ink)" dashed={false} weight={1} />
            <Dot x={t} y={xt} color="var(--f)" />
          </Graph>
          <Graph small x={tx} y={yv} label={<span className="c-fp">velocity v(t) = x′(t)</span>} onPointer={(p) => p && setT(Math.max(0, Math.min(T, p[0])))}>
            {bands}
            <Curve f={v} color="var(--fp)" />
            <VLine x={t} color="var(--ink)" dashed={false} weight={1} />
            <Dot x={t} y={vt} color="var(--fp)" />
          </Graph>
          <Graph small x={tx} y={ya} label={<span className="c-fpp">acceleration a(t) = v′(t)</span>} onPointer={(p) => p && setT(Math.max(0, Math.min(T, p[0])))}>
            {bands}
            <Curve f={a} color="var(--fpp)" />
            <VLine x={t} color="var(--ink)" dashed={false} weight={1} />
            <Dot x={t} y={at} color="var(--fpp)" />
          </Graph>
        </>
      }
      controls={
        <>
          <Group title="Position function">
            <FnInput
              label="x(t) ="
              variable="t"
              value={expr}
              onChange={(e) => {
                setExpr(e)
                const p = presets.find((p) => p.expr === e)
                if (p) setTs(String(p.T))
                setT(0)
              }}
              presets={presets}
            />
          </Group>
          <Group title="Time">
            <Slider label="t" value={t} min={0} max={T} step={0.01} onChange={setT} />
            <PlayButton playing={playing} onClick={toggle} label="Run" />
            <div className="strip" style={{ padding: 0 }}>
              <span>
                <span className="swatch" style={{ background: 'var(--fpp)', height: 10 }} />
                speeding up (v·a &gt; 0)
              </span>
              <span>
                <span className="swatch" style={{ background: 'var(--hot)', height: 10 }} />
                slowing down
              </span>
            </div>
          </Group>
          <Group title={`At t = ${fmt(t, 2)}`}>
            <Readout
              rows={[
                [<span className="c-f">position</span>, fmt(xt)],
                [<span className="c-fp">velocity</span>, fmt(vt)],
                [<span className="c-fpp">acceleration</span>, fmt(at)],
                ['speed |v|', fmt(Math.abs(vt))],
                ['displacement since 0', fmt(xt - x(0))],
                ['distance traveled', fmt(dist)],
              ]}
            />
            <div className={'callout ' + (vt * at > 0 ? 'good' : 'hot')}>The particle is {state}.</div>
            {turns.length > 0 && (
              <p className="c-muted" style={{ margin: 0, fontSize: 'var(--fs-s)' }}>
                Changes direction at t = {turns.map((r) => fmt(r, 3)).join(', ')} (open dots).
              </p>
            )}
          </Group>
        </>
      }
    />
  )
}
