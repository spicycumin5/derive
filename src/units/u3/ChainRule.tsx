import { useMemo, useState } from 'react'
import { Curve, Dot, Graph, SlopeLine, type V2 } from '../../components/graph'
import { niceStep } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { FnInput, Group, Readout, Slider, Tex } from '../../components/ui'
import { autoRange } from '../../lib/calc'
import { deriv, fmt } from '../../lib/numeric'
import { parseFn } from '../../lib/parse'

const pairs = [
  { label: 'sin(x²)', g: 'x^2', f: 'sin(u)' },
  { label: '(3x + 1)³', g: '3x + 1', f: 'u^3' },
  { label: 'e^(sin x)', g: 'sin(x)', f: 'exp(u)' },
  { label: '√(x² + 1)', g: 'x^2 + 1', f: 'sqrt(u)' },
  { label: 'ln(x² + 1)', g: 'x^2 + 1', f: 'ln(u)' },
]

const W = 820
const lines = [
  { y: 52, name: 'x', color: 'var(--ink)' },
  { y: 152, name: 'u = g(x)', color: 'var(--g)' },
  { y: 252, name: 'y = f(u)', color: 'var(--f)' },
]

function NumberLines({ vals, dvals, scale }: { vals: number[]; dvals: number[]; scale: number }) {
  const cx = W / 2 + 40
  const step = niceStep(560 / scale, 6)
  const clip = (p: number) => Math.max(90, Math.min(W - 10, p))
  return (
    <svg viewBox={`0 0 ${W} 300`} style={{ width: '100%', height: '100%', display: 'block' }} role="img" aria-label="Three linked number lines">
      {/* connectors showing the stretch */}
      {[0, 1].map((i) => {
        const a0 = clip(cx)
        const a1 = clip(cx + dvals[i] * scale)
        const b0 = clip(cx)
        const b1 = clip(cx + dvals[i + 1] * scale)
        return (
          <polygon
            key={i}
            points={`${a0},${lines[i].y} ${a1},${lines[i].y} ${b1},${lines[i + 1].y} ${b0},${lines[i + 1].y}`}
            fill={i === 0 ? 'color-mix(in srgb, var(--g) 18%, transparent)' : 'color-mix(in srgb, var(--f) 18%, transparent)'}
          />
        )
      })}
      {lines.map((l, i) => {
        const v = vals[i]
        const ticks: number[] = []
        const lo = v - (cx - 90) / scale
        const hi = v + (W - cx) / scale
        for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) ticks.push(t)
        const d = dvals[i] * scale
        return (
          <g key={l.name}>
            <text x={10} y={l.y + 5} fontSize={15} fontWeight={800} fill={l.color}>
              {l.name}
            </text>
            <line x1={90} x2={W - 10} y1={l.y} y2={l.y} stroke="var(--muted)" strokeWidth={1.5} />
            {ticks.map((t) => {
              const px = cx + (t - v) * scale
              return (
                <g key={t}>
                  <line x1={px} x2={px} y1={l.y - 5} y2={l.y + 5} stroke="var(--muted)" />
                  <text x={px} y={l.y + 22} fontSize={12} textAnchor="middle" fill="var(--muted)">
                    {fmt(t, 3)}
                  </text>
                </g>
              )
            })}
            <line x1={clip(cx)} x2={clip(cx + d)} y1={l.y} y2={l.y} stroke={l.color} strokeWidth={7} strokeLinecap="round" opacity={0.8} />
            <circle cx={cx} cy={l.y} r={7} fill="var(--hot)" />
            <text x={clip(cx + d / 2)} y={l.y - 14} fontSize={13} fontWeight={700} textAnchor="middle" fill={l.color}>
              Δ = {fmt(dvals[i], 4)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function ChainRule() {
  const [gExpr, setG] = useState(pairs[0].g)
  const [fExpr, setF] = useState(pairs[0].f)
  const g = useMemo(() => parseFn(gExpr).fn, [gExpr])
  const f = useMemo(() => parseFn(fExpr, 'u').fn, [fExpr])
  const h = useMemo(() => (x: number) => f(g(x)), [f, g])
  const [x, setX] = useState(1)
  const [dx, setDx] = useState(0.2)

  const u = g(x)
  const y = f(u)
  const du = g(x + dx) - u
  const dy = f(u + du) - y
  const gp = deriv(g, x)
  const fp = deriv(f, u)
  const scale = 140 / dx

  const X: V2 = [-3, 3]
  const Y = useMemo(() => autoRange([h], -3, 3, { min: 2 }), [h])

  return (
    <ToolLayout
      stage={
        <>
          <div className="graph" style={{ flex: '1.2 1 0', padding: 8 }}>
            <div className="graph-label">Nudge x by Δx and follow it through g, then f</div>
            <div style={{ height: '100%', paddingTop: 26 }}>
              <NumberLines vals={[x, u, y]} dvals={[dx, du, dy]} scale={scale} />
            </div>
          </div>
          <Graph small x={X} y={Y} label={<span>y = f(g(x)), with slope {fmt(fp * gp, 3)} at x</span>}>
            <Curve f={h} />
            <SlopeLine x0={x} y0={y} m={fp * gp} color="var(--fp)" half={1} />
            <Dot x={x} y={y} />
          </Graph>
        </>
      }
      controls={
        <>
          <Group title="Composition">
            <div className="chips">
              {pairs.map((p) => (
                <button
                  key={p.label}
                  className="chip"
                  aria-pressed={p.g === gExpr && p.f === fExpr}
                  onClick={() => {
                    setG(p.g)
                    setF(p.f)
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <FnInput label="inner u = g(x) =" value={gExpr} onChange={setG} color="var(--g)" />
            <FnInput label="outer y = f(u) =" value={fExpr} onChange={setF} variable="u" color="var(--f)" />
          </Group>
          <Group title="Nudge">
            <Slider label="x" value={x} min={-2.5} max={2.5} step={0.01} onChange={setX} />
            <Slider label="Δx" value={dx} min={0.005} max={0.6} step={0.005} onChange={setDx} />
          </Group>
          <Group title="Stretch factors">
            <Readout
              rows={[
                [<span className="c-g">inner: g′(x)</span>, fmt(gp, 4)],
                [<span className="c-f">outer: f′(g(x))</span>, fmt(fp, 4)],
                ['product', <b className="c-hot">{fmt(fp * gp, 4)}</b>],
                ['actual Δy/Δx', fmt(dy / dx, 4)],
              ]}
            />
            <div className="big-eq">
              <Tex>{`\\frac{dy}{dx}= ${fmt(fp, 3)} \\times ${fmt(gp, 3)} = ${fmt(fp * gp, 3)}`}</Tex>
            </div>
          </Group>
        </>
      }
    />
  )
}
