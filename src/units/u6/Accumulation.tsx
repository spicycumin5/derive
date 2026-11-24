import { useMemo, useState } from 'react'
import { Band, Curve, Dot, Graph, Label, SignedArea, SlopeLine, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Check, FnInput, Group, PlayButton, Readout, Slider, Tex, usePlayer, useUrlState } from '../../components/ui'
import { autoRange } from '../../lib/calc'
import { antiderivative, findRoots, fmt, signIntervals } from '../../lib/numeric'
import { parseFn } from '../../lib/parse'

const presets = [
  { label: 'AP-style graph', expr: 'x < 0 ? -sqrt(4 - (x+2)^2) : (x < 2 ? x : 4 - x)', lo: -4, hi: 5 },
  { label: 'cos x', expr: 'cos(x)', lo: -1, hi: 7 },
  { label: 'x² − 2', expr: 'x^2 - 2', lo: -2.5, hi: 2.5 },
  { label: '2 − x', expr: '2 - x', lo: -1, hi: 5 },
  { label: 'sin(x²)', expr: 'sin(x^2)', lo: 0, hi: 3.5 },
  { label: 'e^(−x²)', expr: 'exp(-x^2)', lo: -3, hi: 3 },
]

export default function Accumulation() {
  const [expr, setExpr] = useUrlState('f', presets[0].expr)
  const f = useMemo(() => parseFn(expr).fn, [expr])
  const pre = presets.find((p) => p.expr === expr)
  const [lo, hi] = pre ? [pre.lo, pre.hi] : [-4, 4]
  const [a, setA] = useState(pre ? Math.max(lo, 0) : 0)
  const [x, setX] = useState(a + 1)
  const [ghost, setGhost] = useState(false)
  const [bands, setBands] = useState(true)
  const F = useMemo(() => antiderivative(f, a, lo, hi), [f, a, lo, hi])
  const [playing, toggle] = usePlayer(() => x, setX, { from: lo, to: hi, seconds: 9 })

  const X: V2 = [lo, hi]
  const Yf = useMemo(() => autoRange([f], lo, hi, { min: 2 }), [f, lo, hi])
  const YF = useMemo(() => autoRange([F], lo, hi, { min: 2 }), [F, lo, hi])
  const signs = useMemo(() => signIntervals(f, lo, hi), [f, lo, hi])
  const zeros = useMemo(() => findRoots(f, lo, hi).filter((r) => r > lo && r < hi), [f, lo, hi])
  const Fx = F(x)
  const fx = f(x)
  const bandEls = bands
    ? signs.map((s, i) => <Band key={i} a={s.from} b={s.to} color={s.sign > 0 ? 'var(--pos-band)' : s.sign < 0 ? 'var(--neg-band)' : 'transparent'} />)
    : null

  return (
    <ToolLayout
      stage={
        <>
          <Graph small x={X} y={Yf} label={<span className="c-f">f(t): the rate</span>} onPointer={(p) => p && !playing && setX(Math.max(lo, Math.min(hi, p[0])))}>
            {bandEls}
            <SignedArea f={f} a={a} b={x} />
            <VLine x={a} weight={1} />
            <Curve f={f} />
            <VLine x={x} color="var(--ink)" dashed={false} weight={1} />
            <Dot x={x} y={fx} color="var(--f)" />
          </Graph>
          <Graph small x={X} y={YF} label={<span className="c-fpp">F(x) = ∫ₐˣ f(t) dt: the accumulated amount</span>} onPointer={(p) => p && !playing && setX(Math.max(lo, Math.min(hi, p[0])))}>
            {bandEls}
            {ghost && <Curve f={F} color="var(--fpp)" opacity={0.25} />}
            <Curve f={F} color="var(--fpp)" domain={[Math.min(a, x), Math.max(a, x)]} weight={3.5} />
            {zeros.map((z) => (
              <Dot key={z} x={z} y={F(z)} color="var(--hot)" r={5} />
            ))}
            <SlopeLine x0={x} y0={Fx} m={fx} color="var(--fp)" half={(hi - lo) * 0.08} />
            <VLine x={x} color="var(--ink)" dashed={false} weight={1} />
            <Dot x={a} y={0} color="var(--ink)" open r={5} />
            <Label x={a} y={0} dy={20} dx={0} anchor="middle" color="var(--muted)">
              a
            </Label>
            <Dot x={x} y={Fx} color="var(--fpp)" />
          </Graph>
        </>
      }
      controls={
        <>
          <Group title="Rate function f">
            <FnInput
              value={expr}
              onChange={(e) => {
                setExpr(e)
                const p = presets.find((p) => p.expr === e)
                const na = p ? Math.max(p.lo, 0) : 0
                setA(na)
                setX(na + 1)
              }}
              presets={presets}
            />
          </Group>
          <Group title="Sweep">
            <Slider label="Lower limit a" value={a} min={lo} max={hi} step={0.1} onChange={setA} />
            <Slider label="Upper limit x" value={x} min={lo} max={hi} step={0.01} onChange={setX} />
            <PlayButton playing={playing} onClick={toggle} label="Accumulate" />
            <Check checked={ghost} onChange={setGhost}>
              Show the whole F curve faintly
            </Check>
            <Check checked={bands} onChange={setBands}>
              Shade where f &gt; 0 and f &lt; 0
            </Check>
          </Group>
          <Group title={`At x = ${fmt(x, 2)}`}>
            <Readout
              rows={[
                [<span className="c-fpp">F(x), the signed area</span>, fmt(Fx, 4)],
                [<span className="c-f">f(x)</span>, fmt(fx, 4)],
                [<span className="c-fp">slope of F at x</span>, fmt(fx, 4)],
              ]}
            />
            <div className="big-eq">
              <Tex>{`F'(${fmt(x, 2)}) = f(${fmt(x, 2)}) = ${fmt(fx, 3)}`}</Tex>
            </div>
            <div className="callout">
              {Math.abs(fx) < 0.02
                ? 'f = 0 here, so F has a horizontal tangent. Look for a max or min of F.'
                : fx > 0
                  ? 'f > 0: area is being added, so F is increasing.'
                  : 'f < 0: area counts as negative, so F is decreasing.'}
            </div>
          </Group>
        </>
      }
    />
  )
}
