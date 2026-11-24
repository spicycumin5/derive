import { MovablePoint } from 'mafs'
import { useMemo, useState } from 'react'
import { Dot, Graph, Path, SlopeLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Check, FnInput, Group, Key, Slider, useFn2, useUrlState } from '../../components/ui'
import { eulerSteps, fmt, isGood, rk4Path } from '../../lib/numeric'

const presets = [
  { label: 'x + y', expr: 'x + y' },
  { label: 'x − y', expr: 'x - y' },
  { label: 'y', expr: 'y' },
  { label: 'x·y', expr: 'x*y' },
  { label: '−x/y', expr: '-x/y' },
  { label: 'x²', expr: 'x^2' },
  { label: 'y(4 − y)/2', expr: 'y*(4 - y)/2' },
  { label: 'sin x', expr: 'sin(x)' },
]

const X: V2 = [-5, 5]
const Y: V2 = [-4, 4]

function solution(g: (x: number, y: number) => number, p: V2): V2[] {
  const fwd = rk4Path(g, p[0], p[1], X[1] + 1, 500, 60)
  const back = rk4Path(g, p[0], p[1], X[0] - 1, 500, 60)
  return [...back.reverse(), ...fwd.slice(1)] as V2[]
}

export default function SlopeField() {
  const [expr, setExpr] = useUrlState('g', presets[0].expr)
  const g = useFn2(expr)
  const [ic, setIc] = useState<V2>([0, 1])
  const [extra, setExtra] = useState<V2[]>([])
  const [density, setDensity] = useState(21)
  const [euler, setEuler] = useState(false)
  const [h, setH] = useState(0.5)
  const [steps, setSteps] = useState(4)

  const field = useMemo(() => {
    const out: { x: number; y: number; m: number }[] = []
    const nx = density
    const ny = Math.round((density * 8) / 10)
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < ny; j++) {
        const x = X[0] + ((i + 0.5) * (X[1] - X[0])) / nx
        const y = Y[0] + ((j + 0.5) * (Y[1] - Y[0])) / ny
        out.push({ x, y, m: g(x, y) })
      }
    return out
  }, [g, density])
  const seg = ((X[1] - X[0]) / density) * 0.36

  const main = useMemo(() => solution(g, ic), [g, ic])
  const others = useMemo(() => extra.map((p) => solution(g, p)), [g, extra])
  const eu = useMemo(() => (euler ? eulerSteps(g, ic[0], ic[1], h, steps) : []), [euler, g, ic, h, steps])
  const exactAtEnd = useMemo(() => {
    if (!euler) return NaN
    const p = rk4Path(g, ic[0], ic[1], ic[0] + h * steps, 400, 1e6)
    return p[p.length - 1][1]
  }, [euler, g, ic, h, steps])

  return (
    <ToolLayout
      stage={
        <Graph equal x={X} y={Y} label="Drag the pink point, or click anywhere to add a solution" onClick={(p) => setExtra((e) => [...e, p].slice(-12))}>
          {field.map((s, i) =>
            isGood(s.m) ? <SlopeLine key={i} x0={s.x} y0={s.y} m={s.m} half={seg} color="var(--muted)" weight={1.6} /> : null,
          )}
          {others.map((pts, i) => (
            <Path key={i} pts={pts} color="var(--g)" weight={2.2} opacity={0.75} />
          ))}
          {extra.map((p, i) => (
            <Dot key={i} x={p[0]} y={p[1]} color="var(--g)" r={4} />
          ))}
          <Path pts={main} color="var(--f)" weight={3.5} />
          {euler && (
            <>
              <Path pts={eu as V2[]} color="var(--fp)" weight={3} />
              {eu.map((p, i) => (
                <Dot key={i} x={p[0]} y={p[1]} color="var(--fp)" r={5} />
              ))}
            </>
          )}
          <MovablePoint point={ic} onMove={(p) => setIc([Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10])} color="var(--hot)" />
        </Graph>
      }
      controls={
        <>
          <Group title="Differential equation">
            <FnInput label="dy/dx =" value={expr} onChange={setExpr} presets={presets} twoVar />
            <Slider label="Field density" value={density} min={9} max={33} step={2} onChange={setDensity} format={(v) => String(v)} />
          </Group>
          <Group title="Solutions">
            <div className="strip" style={{ padding: 0 }}>
              <Key color="var(--f)">through ({fmt(ic[0], 1)}, {fmt(ic[1], 1)})</Key>
              <Key color="var(--g)">clicked</Key>
            </div>
            <p className="c-muted" style={{ margin: 0, fontSize: 'var(--fs-s)' }}>
              At the pink point the slope is dy/dx = {fmt(g(ic[0], ic[1]), 3)}.
            </p>
            <button className="btn ghost" onClick={() => setExtra([])}>
              Clear clicked curves
            </button>
          </Group>
          <Group title="Euler’s method">
            <Check checked={euler} onChange={setEuler}>
              Show Euler steps from the pink point
            </Check>
            {euler && (
              <>
                <Slider label="Step size h" value={h} min={0.05} max={1} step={0.05} onChange={setH} />
                <Slider label="Steps" value={steps} min={1} max={20} step={1} onChange={setSteps} format={(v) => String(v)} />
                <table className="vtable">
                  <thead>
                    <tr>
                      <th>n</th>
                      <th>x</th>
                      <th>y</th>
                      <th>slope</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eu.slice(0, 8).map((p, i) => (
                      <tr key={i}>
                        <td>{i}</td>
                        <td>{fmt(p[0], 2)}</td>
                        <td>{fmt(p[1], 4)}</td>
                        <td>{fmt(g(p[0], p[1]), 3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="callout">
                  Euler gives y({fmt(ic[0] + h * steps, 2)}) ≈ {fmt(eu[eu.length - 1]?.[1] ?? NaN, 4)}. The true value is {fmt(exactAtEnd, 4)}. Smaller steps follow the
                  curve more closely.
                </div>
              </>
            )}
          </Group>
        </>
      }
    />
  )
}
