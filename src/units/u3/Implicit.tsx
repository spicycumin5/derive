import { Plot } from 'mafs'
import { useMemo, useState } from 'react'
import { Dot, Graph, Label, SlopeLine, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Check, Group, Readout, Seg, Slider, Tex } from '../../components/ui'
import { fmt } from '../../lib/numeric'

interface CurveDef {
  label: string
  eq: string
  dydx: string
  xy: (t: number) => V2
  t: V2
  Fx: (x: number, y: number) => number
  Fy: (x: number, y: number) => number
  view: number
}

const S2 = Math.SQRT2
const curves: Record<string, CurveDef> = {
  circle: {
    label: 'Circle',
    eq: 'x^2+y^2=9',
    dydx: '\\frac{dy}{dx}=-\\frac{x}{y}',
    xy: (t) => [3 * Math.cos(t), 3 * Math.sin(t)],
    t: [0, 2 * Math.PI],
    Fx: (x) => 2 * x,
    Fy: (_, y) => 2 * y,
    view: 4.5,
  },
  ellipse: {
    label: 'Tilted ellipse',
    eq: 'x^2+xy+y^2=3',
    dydx: '\\frac{dy}{dx}=-\\frac{2x+y}{x+2y}',
    xy: (t) => {
      const u = S2 * Math.cos(t)
      const v = Math.sqrt(6) * Math.sin(t)
      return [(u + v) / S2, (u - v) / S2]
    },
    t: [0, 2 * Math.PI],
    Fx: (x, y) => 2 * x + y,
    Fy: (x, y) => x + 2 * y,
    view: 3.2,
  },
  folium: {
    label: 'Folium',
    eq: 'x^3+y^3=6xy',
    dydx: '\\frac{dy}{dx}=\\frac{2y-x^2}{y^2-2x}',
    xy: (t) => [(6 * t) / (1 + t ** 3), (6 * t * t) / (1 + t ** 3)],
    t: [-0.55, 9],
    Fx: (x, y) => 3 * x * x - 6 * y,
    Fy: (x, y) => 3 * y * y - 6 * x,
    view: 5,
  },
  hyper: {
    label: 'Hyperbola',
    eq: 'x^2-y^2=4',
    dydx: '\\frac{dy}{dx}=\\frac{x}{y}',
    xy: (t) => [2 * Math.cosh(t), 2 * Math.sinh(t)],
    t: [-2.2, 2.2],
    Fx: (x) => 2 * x,
    Fy: (_, y) => -2 * y,
    view: 5,
  },
}

/** t values where h(xy(t)) changes sign. */
function zeros(c: CurveDef, h: (x: number, y: number) => number): V2[] {
  const out: V2[] = []
  const N = 2000
  let prev = NaN
  for (let i = 0; i <= N; i++) {
    const t = c.t[0] + ((c.t[1] - c.t[0]) * i) / N
    const [x, y] = c.xy(t)
    const v = h(x, y)
    if (i && Number.isFinite(prev) && Number.isFinite(v) && prev * v < 0) out.push([x, y])
    prev = v
  }
  return out
}

export default function Implicit() {
  const [key, setKey] = useState('circle')
  const c = curves[key]
  const [s, setS] = useState(0.15)
  const [showSpecial, setShowSpecial] = useState(true)
  const t = c.t[0] + (c.t[1] - c.t[0]) * s
  const [x, y] = c.xy(t)
  const m = -c.Fx(x, y) / c.Fy(x, y)
  const horiz = useMemo(() => zeros(c, c.Fx), [c])
  const vert = useMemo(() => zeros(c, c.Fy), [c])
  const V = c.view
  const X: V2 = [-V * 1.4, V * 1.4]
  const Y: V2 = [-V, V]

  return (
    <ToolLayout
      stage={
        <Graph equal x={X} y={Y} label={<Tex>{c.eq}</Tex>}>
          <VLine x={x} color="var(--faint)" weight={1} />
          <Plot.Parametric xy={c.xy} domain={c.t} color="var(--f)" weight={3.5} />
          {showSpecial &&
            horiz.map((p, i) => (
              <g key={'h' + i}>
                <SlopeLine x0={p[0]} y0={p[1]} m={0} color="var(--fpp)" half={0.8} weight={2} />
                <Dot x={p[0]} y={p[1]} color="var(--fpp)" r={5} />
              </g>
            ))}
          {showSpecial &&
            vert.map((p, i) => (
              <g key={'v' + i}>
                <Dot x={p[0]} y={p[1]} color="var(--g)" r={5} />
              </g>
            ))}
          {Number.isFinite(m) && Math.abs(m) < 200 ? (
            <SlopeLine x0={x} y0={y} m={m} color="var(--fp)" half={V * 0.7} />
          ) : (
            <VLine x={x} color="var(--fp)" dashed={false} weight={2.5} />
          )}
          <Dot x={x} y={y} color="var(--hot)" r={7} />
          <Label x={x} y={y} color="var(--hot)" dx={10} dy={-10}>
            ({fmt(x, 2)}, {fmt(y, 2)})
          </Label>
        </Graph>
      }
      controls={
        <>
          <Group title="Curve">
            <Seg
              value={key}
              onChange={(k) => setKey(k)}
              options={Object.entries(curves).map(([k, v]) => ({ value: k, label: v.label }))}
            />
            <div className="big-eq">
              <Tex>{c.dydx}</Tex>
            </div>
          </Group>
          <Group title="Slide along the curve">
            <Slider label="Position" value={s} min={0} max={1} step={0.001} onChange={setS} format={() => ''} />
            <Check checked={showSpecial} onChange={setShowSpecial}>
              Mark horizontal (green) and vertical (purple) tangents
            </Check>
          </Group>
          <Group title="At this point">
            <Readout
              rows={[
                ['x', fmt(x, 3)],
                ['y', fmt(y, 3)],
                [<span className="c-fp">dy/dx</span>, Number.isFinite(m) && Math.abs(m) < 1e4 ? fmt(m, 3) : 'undefined (vertical)'],
              ]}
            />
            <div className="callout">
              The dashed line at x = {fmt(x, 2)} crosses the curve more than once, so y is not a function of x. Each crossing has its own
              slope, which is why dy/dx needs both x and y.
            </div>
          </Group>
        </>
      }
    />
  )
}
