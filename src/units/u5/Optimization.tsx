import { MovablePoint } from 'mafs'
import { useMemo, useState } from 'react'
import { Curve, Dot, Graph, HLine, Label, SlopeLine, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Group, Readout, Slider, Tex } from '../../components/ui'
import { argExtreme, deriv, fmt } from '../../lib/numeric'

function Net({ L, W, x }: { L: number; W: number; x: number }) {
  const s = Math.min(300 / L, 200 / W)
  const pw = L * s
  const ph = W * s
  const c = x * s
  return (
    <svg viewBox={`-10 -10 ${pw + 20} ${ph + 40}`} style={{ width: '100%', height: '100%' }} role="img" aria-label="Flat sheet with corners cut">
      <rect x={0} y={0} width={pw} height={ph} fill="var(--area)" stroke="var(--f)" strokeWidth={2} />
      {[
        [0, 0],
        [pw - c, 0],
        [0, ph - c],
        [pw - c, ph - c],
      ].map(([px, py], i) => (
        <rect key={i} x={px} y={py} width={c} height={c} fill="var(--panel)" stroke="var(--hot)" strokeWidth={2} strokeDasharray="4 3" />
      ))}
      <rect x={c} y={c} width={Math.max(0, pw - 2 * c)} height={Math.max(0, ph - 2 * c)} fill="none" stroke="var(--f)" strokeDasharray="6 4" />
      <text x={pw / 2} y={ph + 22} textAnchor="middle" fontWeight={700} fontSize={14} fill="var(--muted)">
        {L} × {W} sheet, cut x = {fmt(x, 2)} squares
      </text>
    </svg>
  )
}

function Box({ L, W, x }: { L: number; W: number; x: number }) {
  // simple oblique projection
  const s = Math.min(220 / L, 160 / W)
  const l = (L - 2 * x) * s
  const w = (W - 2 * x) * s * 0.55
  const h = x * s
  const ox = 30
  const oy = 230
  const dx = w * 0.85
  const dy = -w * 0.6
  const p = (a: number, b: number) => `${a},${b}`
  return (
    <svg viewBox="0 0 340 260" style={{ width: '100%', height: '100%' }} role="img" aria-label="Folded open box">
      {/* back + side faces */}
      <polygon points={[p(ox + dx, oy + dy), p(ox + dx + l, oy + dy), p(ox + dx + l, oy + dy - h), p(ox + dx, oy + dy - h)].join(' ')} fill="color-mix(in srgb, var(--f) 18%, var(--panel))" stroke="var(--f)" />
      <polygon points={[p(ox, oy), p(ox + dx, oy + dy), p(ox + dx, oy + dy - h), p(ox, oy - h)].join(' ')} fill="color-mix(in srgb, var(--f) 26%, var(--panel))" stroke="var(--f)" />
      {/* bottom */}
      <polygon points={[p(ox, oy), p(ox + l, oy), p(ox + l + dx, oy + dy), p(ox + dx, oy + dy)].join(' ')} fill="color-mix(in srgb, var(--f) 12%, var(--panel))" stroke="var(--f)" />
      {/* right + front */}
      <polygon points={[p(ox + l, oy), p(ox + l + dx, oy + dy), p(ox + l + dx, oy + dy - h), p(ox + l, oy - h)].join(' ')} fill="color-mix(in srgb, var(--f) 34%, var(--panel))" stroke="var(--f)" strokeWidth={1.5} />
      <polygon points={[p(ox, oy), p(ox + l, oy), p(ox + l, oy - h), p(ox, oy - h)].join(' ')} fill="color-mix(in srgb, var(--f) 42%, var(--panel))" stroke="var(--f)" strokeWidth={2} />
      <text x={ox + l / 2} y={oy + 20} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--muted)">
        {fmt(L - 2 * x, 2)} × {fmt(W - 2 * x, 2)} × {fmt(x, 2)}
      </text>
    </svg>
  )
}

export default function Optimization() {
  const [L, setL] = useState(12)
  const [W, setW] = useState(8)
  const [x, setX] = useState(0.8)
  const max = W / 2
  const V = useMemo(() => (t: number) => (t <= 0 || t >= max ? NaN : t * (L - 2 * t) * (W - 2 * t)), [L, W, max])
  const best = useMemo(() => argExtreme(V, 0.001, max - 0.001, 'max', 4000), [V, max])
  const vBest = V(best)
  const xc = Math.min(Math.max(x, 0.01), max - 0.01)
  const vx = V(xc)
  const m = deriv(V, xc)
  const X: V2 = [0, max]
  const Y: V2 = [-vBest * 0.08, vBest * 1.2]

  return (
    <ToolLayout
      stage={
        <>
          <div style={{ flex: '1 1 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, minHeight: 0 }}>
            <div className="graph" style={{ padding: 16 }}>
              <div className="graph-label">The sheet</div>
              <Net L={L} W={W} x={xc} />
            </div>
            <div className="graph" style={{ padding: 16 }}>
              <div className="graph-label">The box</div>
              <Box L={L} W={W} x={xc} />
            </div>
          </div>
          <Graph x={X} y={Y} label={<span>V(x) = x(L − 2x)(W − 2x). Drag the point.</span>}>
            <HLine y={vBest} color="var(--fpp)" weight={1} />
            <VLine x={best} color="var(--fpp)" weight={1} />
            <Curve f={V} domain={[0.001, max - 0.001]} />
            <SlopeLine x0={xc} y0={vx} m={m} color="var(--fp)" half={max * 0.2} />
            <Dot x={best} y={vBest} color="var(--fpp)" />
            <Label x={best} y={vBest} color="var(--fpp)" dy={-12} anchor="middle" dx={0}>
              max
            </Label>
            <MovablePoint point={[xc, vx]} onMove={([nx]) => setX(Math.min(max - 0.01, Math.max(0.01, nx)))} constrain={([px]) => [px, V(Math.min(max - 0.01, Math.max(0.01, px)))]} color="var(--hot)" />
          </Graph>
        </>
      }
      controls={
        <>
          <Group title="Sheet">
            <Slider label="Length L" value={L} min={6} max={20} step={1} onChange={setL} />
            <Slider label="Width W" value={W} min={4} max={L} step={1} onChange={(v) => setW(Math.min(v, L))} />
          </Group>
          <Group title="Cut size">
            <Slider label="x" value={xc} min={0.01} max={max - 0.01} step={0.01} onChange={setX} />
            <Readout
              rows={[
                ['V(x)', fmt(vx, 3)],
                [<span className="c-fp">V′(x)</span>, fmt(m, 3)],
                [<span className="c-fpp">best x</span>, fmt(best, 4)],
                [<span className="c-fpp">max volume</span>, fmt(vBest, 4)],
              ]}
            />
            <div className={'callout ' + (Math.abs(m) < 0.5 ? 'good' : '')}>
              {Math.abs(m) < 0.5 ? 'V′(x) ≈ 0. You’re at the top.' : m > 0 ? 'V′ > 0: cutting a bit more still increases the volume.' : 'V′ < 0: you’ve cut too much. The volume is now dropping.'}
            </div>
          </Group>
          <Group title="Calculus">
            <div style={{ fontSize: 'var(--fs-s)', display: 'grid', gap: 6, overflowX: 'auto' }}>
              <Tex>{`V(x)=x(${L}-2x)(${W}-2x)`}</Tex>
              <Tex>{`V'(x)=12x^2-${4 * (L + W)}x+${L * W}=0`}</Tex>
              <Tex>{`x=\\frac{${L + W}-\\sqrt{${(L + W) ** 2 - 3 * L * W}}}{6}\\approx ${fmt(best, 4)}`}</Tex>
            </div>
          </Group>
        </>
      }
    />
  )
}
