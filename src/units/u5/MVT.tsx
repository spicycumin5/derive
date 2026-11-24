import { MovablePoint } from 'mafs'
import { useMemo, useState } from 'react'
import { Band, Curve, Dot, Graph, Label, Path, SlopeLine, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { FnInput, Group, Readout, Tex, useUrlState } from '../../components/ui'
import { autoRange, useDerivs } from '../../lib/calc'
import { findRoots, fmt, isGood } from '../../lib/numeric'

const presets = [
  { label: 'x³ − 3x', expr: 'x^3 - 3x' },
  { label: 'sin x + x/2', expr: 'sin(x) + x/2' },
  { label: '√(x + 4)', expr: 'sqrt(x + 4)' },
  { label: '|x| (fails)', expr: 'abs(x)' },
  { label: 'x^(2/3) (fails)', expr: 'cbrt(x^2)' },
  { label: 'x⁴ − 4x²', expr: 'x^4 - 4x^2' },
]

export default function MVT() {
  const [expr, setExpr] = useUrlState('f', presets[0].expr)
  const { f, fp } = useDerivs(expr)
  const [a, setA] = useState(-1.8)
  const [b, setB] = useState(2.1)
  const W = 3
  const X: V2 = [-W, W]
  const Y = useMemo(() => autoRange([f], -W, W, { min: 3 }), [f])
  const fa = f(a)
  const fb = f(b)
  const m = (fb - fa) / (b - a)
  const g = useMemo(() => (x: number) => fp(x) - m, [fp, m])
  const cs = useMemo(() => {
    const lo = Math.min(a, b)
    const hi = Math.max(a, b)
    return findRoots(g, lo, hi, 1500).filter((c) => c > lo + 1e-6 && c < hi - 1e-6 && Math.abs(g(c)) < 1e-3 * (1 + Math.abs(m)))
  }, [g, a, b, m])
  const clamp = (x: number) => Math.max(-W + 0.05, Math.min(W - 0.05, x))
  const on = ([x]: V2): V2 => [x, isGood(f(x)) ? f(x) : 0]

  return (
    <ToolLayout
      stage={
        <Graph x={X} y={Y} label="Drag a and b">
          <Band a={a} b={b} color="var(--panel-2)" />
          <Curve f={f} />
          <SlopeLine x0={a} y0={fa} m={m} color="var(--hot)" weight={2} dashed />
          <Path
            pts={[
              [a, fa],
              [b, fb],
            ]}
            color="var(--hot)"
            weight={3}
          />
          {cs.map((c) => (
            <g key={c}>
              <VLine x={c} color="var(--fp)" weight={1} />
              <SlopeLine x0={c} y0={f(c)} m={fp(c)} color="var(--fp)" half={W * 0.4} />
              <Dot x={c} y={f(c)} color="var(--fp)" />
              <Label x={c} y={f(c)} color="var(--fp)" dy={22} dx={0} anchor="middle">
                c
              </Label>
            </g>
          ))}
          <MovablePoint point={[a, fa]} onMove={([x]) => setA(clamp(x))} constrain={on} color="var(--hot)" />
          <MovablePoint point={[b, fb]} onMove={([x]) => setB(clamp(x))} constrain={on} color="var(--hot)" />
          <Label x={a} y={fa} color="var(--hot)" dx={-12} anchor="end">
            a
          </Label>
          <Label x={b} y={fb} color="var(--hot)" dx={12}>
            b
          </Label>
        </Graph>
      }
      controls={
        <>
          <Group title="Function">
            <FnInput value={expr} onChange={setExpr} presets={presets} />
          </Group>
          <Group title="Average vs. instantaneous">
            <div className="big-eq">
              <Tex>{`\\frac{f(b)-f(a)}{b-a}=\\frac{${fmt(fb, 2)}-(${fmt(fa, 2)})}{${fmt(b - a, 2)}}=${fmt(m, 3)}`}</Tex>
            </div>
            <Readout
              rows={[
                ['a', fmt(a, 3)],
                ['b', fmt(b, 3)],
                [<span className="c-hot">secant slope</span>, fmt(m, 4)],
                ...cs.map((c, i) => [<span className="c-fp">c{cs.length > 1 ? `${i + 1}` : ''}</span>, `${fmt(c, 4)}   (f′(c) = ${fmt(fp(c), 3)})`] as [React.ReactNode, string]),
              ]}
            />
            <div className={'callout ' + (cs.length ? 'good' : 'hot')}>
              {cs.length
                ? `The tangent at c is parallel to the secant. There ${cs.length === 1 ? 'is 1 such point' : 'are ' + cs.length + ' such points'}.`
                : 'No c exists. Check the hypotheses: f must be differentiable on (a, b). Is there a corner or cusp between a and b?'}
            </div>
          </Group>
        </>
      }
    />
  )
}
