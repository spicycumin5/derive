import { useMemo, useState } from 'react'
import { Curve, Dot, Graph, Path, Rect, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { FnInput, Group, Readout, Seg, Slider, Tex, useFnState } from '../../components/ui'
import { autoRange } from '../../lib/calc'
import { fmt, integrate, riemann, type RiemannKind } from '../../lib/numeric'

const presets = [
  { label: 'x² + 1', expr: 'x^2 + 1' },
  { label: 'sin x + 1.5', expr: 'sin(x) + 1.5' },
  { label: '√x', expr: 'sqrt(x)' },
  { label: '4 − x²', expr: '4 - x^2' },
  { label: 'x³ − 3x', expr: 'x^3 - 3x' },
  { label: 'eˣ', expr: 'exp(x)' },
]

const kinds: { value: RiemannKind; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'mid', label: 'Midpoint' },
  { value: 'trap', label: 'Trapezoid' },
]

export default function Riemann() {
  const { expr, setExpr, fn: f } = useFnState('f', presets[0].expr)
  const [a, setA] = useState(0)
  const [b, setB] = useState(2)
  const [n, setN] = useState(4)
  const [kind, setKind] = useState<RiemannKind>('left')
  const R = useMemo(() => riemann(f, a, b, n, kind), [f, a, b, n, kind])
  const exact = useMemo(() => integrate(f, a, b, 2000), [f, a, b])
  const pad = (b - a) * 0.25 + 0.3
  const X: V2 = [a - pad, b + pad]
  const Y = useMemo(() => autoRange([f], a - pad, b + pad, { min: 2 }), [f, a, b, pad])
  const err = R.sum - exact
  const all = kinds.map((k) => ({ ...k, sum: riemann(f, a, b, n, k.value).sum }))
  const thin = n > 40

  return (
    <ToolLayout
      stage={
        <Graph x={X} y={Y} label={<Tex>{`\\int_{${fmt(a, 2)}}^{${fmt(b, 2)}} f(x)\\,dx`}</Tex>}>
          {R.pieces.map((p, i) => {
            const pos = (p.y0 + p.y1) / 2 >= 0
            const fill = pos ? 'var(--area)' : 'var(--area-neg)'
            const stroke = thin ? undefined : pos ? 'var(--f)' : 'var(--hot)'
            if (kind === 'trap')
              return (
                <Path
                  key={i}
                  pts={[
                    [p.x0, 0],
                    [p.x0, p.y0],
                    [p.x1, p.y1],
                    [p.x1, 0],
                  ]}
                  fill={fill}
                  color={stroke ?? 'none'}
                  weight={thin ? 0 : 1.5}
                />
              )
            return <Rect key={i} x0={p.x0} x1={p.x1} y0={0} y1={p.y0} fill={fill} stroke={stroke} weight={1.5} />
          })}
          <VLine x={a} weight={1} />
          <VLine x={b} weight={1} />
          <Curve f={f} />
          {!thin &&
            kind !== 'trap' &&
            R.pieces.map((p, i) => <Dot key={i} x={kind === 'left' ? p.x0 : kind === 'right' ? p.x1 : (p.x0 + p.x1) / 2} y={p.y0} color="var(--hot)" r={4} />)}
        </Graph>
      }
      controls={
        <>
          <Group title="Function">
            <FnInput value={expr} onChange={setExpr} presets={presets} />
          </Group>
          <Group title="Method">
            <Seg value={kind} onChange={setKind} options={kinds} />
            <Slider label="Subintervals n" value={n} min={1} max={200} step={1} onChange={setN} />
            <Slider label="a" value={a} min={-4} max={b - 0.25} step={0.25} onChange={setA} />
            <Slider label="b" value={b} min={a + 0.25} max={5} step={0.25} onChange={setB} />
          </Group>
          <Group title="Result">
            <Readout
              rows={[
                ['Δx', fmt(R.dx, 4)],
                [<span className="c-f">{kinds.find((k) => k.value === kind)!.label} sum</span>, fmt(R.sum, 5)],
                ['exact integral', fmt(exact, 5)],
                [<span className="c-hot">error</span>, fmt(err, 5)],
              ]}
            />
            <div className={'callout ' + (Math.abs(err) < 1e-3 ? 'good' : 'hot')}>
              {Math.abs(err) < 1e-4 ? 'Essentially exact.' : err > 0 ? 'This is an OVERestimate.' : 'This is an UNDERestimate.'}
            </div>
          </Group>
          <Group title={`All four methods, n = ${n}`}>
            <table className="vtable">
              <tbody>
                {all.map((k) => (
                  <tr key={k.value} className={k.value === kind ? 'hl' : ''}>
                    <td style={{ textAlign: 'left' }}>{k.label}</td>
                    <td>{fmt(k.sum, 5)}</td>
                    <td className={k.sum - exact > 0 ? 'c-hot' : 'c-f'}>{fmt(k.sum - exact, 4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Group>
        </>
      }
    />
  )
}
