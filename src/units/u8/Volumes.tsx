import { Line } from '@react-three/drei'
import { useMemo, useState } from 'react'
import * as THREE from 'three'
import { AreaBetween, Curve, Graph, HLine, Rect, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Axes3D, Scene3D, tint, useThemeColors } from '../../components/three'
import { Group, PlayButton, Readout, Seg, Slider, Tex, usePlayer } from '../../components/ui'
import { fmt, integrate } from '../../lib/numeric'
import type { Fn } from '../../lib/parse'

interface Region {
  label: string
  f: Fn
  g: Fn
  a: number
  b: number
  fTex: string
  gTex: string
  /** left / right edges of the region as functions of y (TeX), when they have a single closed form */
  xLTex: string | null
  xRTex: string | null
}

const regions: Region[] = [
  { label: 'y = √x, y = 0, [0, 4]', f: Math.sqrt, g: () => 0, a: 0, b: 4, fTex: '\\sqrt{x}', gTex: '0', xLTex: 'y^2', xRTex: '4' },
  { label: 'y = x, y = x², [0, 1]', f: (x) => x, g: (x) => x * x, a: 0, b: 1, fTex: 'x', gTex: 'x^2', xLTex: 'y', xRTex: '\\sqrt{y}' },
  { label: 'y = 4 − x², y = 0', f: (x) => 4 - x * x, g: () => 0, a: -2, b: 2, fTex: '4-x^2', gTex: '0', xLTex: '-\\sqrt{4-y}', xRTex: '\\sqrt{4-y}' },
  { label: 'y = 2 + sin x, y = 1, [0, 2π]', f: (x) => 2 + Math.sin(x), g: () => 1, a: 0, b: 2 * Math.PI, fTex: '2+\\sin x', gTex: '1', xLTex: null, xRTex: null },
  { label: 'y = eˣ/2, y = 0, [0, 2]', f: (x) => Math.exp(x) / 2, g: () => 0, a: 0, b: 2, fTex: '\\tfrac12e^x', gTex: '0', xLTex: null, xRTex: null },
]

type Mode = 'solid' | 'discs'
type Orient = 'h' | 'v'

/** "t − c" in TeX, tidy for c = 0 and negative c. */
const minus = (t: string, c: number) => (c === 0 ? t : `${t}-${c < 0 ? `(${fmt(c)})` : fmt(c)}`)
const paren = (t: string) => (/^[\w\\{}^]+$/.test(t) && !t.startsWith('-') ? t : `(${t})`)

export default function Volumes() {
  const colors = useThemeColors()
  const [ri, setRi] = useState(0)
  const R0 = regions[ri]
  const { f, g, a, b } = R0
  const [orient, setOrient] = useState<Orient>('h')
  const [k, setK] = useState(0)
  const [h, setH] = useState(0)
  const [mode, setMode] = useState<Mode>('solid')
  const [theta, setTheta] = useState(Math.PI * 1.25)
  const [n, setN] = useState(16)
  const [prog, setProg] = useState(1)
  const [slice, setSlice] = useState(0.5)
  const [playing, toggle] = usePlayer(() => theta, setTheta, { from: 0.01, to: 2 * Math.PI, seconds: 5 })
  const vert = orient === 'v'

  // sample extents
  const samples = useMemo(() => Array.from({ length: 401 }, (_, i) => a + ((b - a) * i) / 400), [a, b])
  const fMax = Math.max(...samples.map(f))
  const gMin = Math.min(...samples.map(g))
  const yLo = gMin
  const yHi = fMax

  /* ---------- horizontal axis y = k: slices along x ---------- */
  const below = k <= gMin + 1e-9
  const above = k >= fMax - 1e-9
  const Rx = useMemo<Fn>(() => (x) => (below ? f(x) - k : k - g(x)), [f, g, k, below])
  const rx = useMemo<Fn>(() => (x) => (below ? g(x) - k : k - f(x)), [f, g, k, below])

  /* ---------- vertical axis x = h: slices along y ---------- */
  const leftOf = h <= a + 1e-9 // axis on the left of the region
  const rightOf = h >= b - 1e-9
  /** horizontal cross-section of the region at height y: [xLeft, xRight] */
  const cross = useMemo(
    () => (y: number): V2 | null => {
      let lo = Infinity
      let hi = -Infinity
      for (const x of samples) {
        if (g(x) - 1e-12 <= y && y <= f(x) + 1e-12) {
          if (x < lo) lo = x
          if (x > hi) hi = x
        }
      }
      return lo <= hi ? [lo, hi] : null
    },
    [f, g, samples],
  )
  const Ry = useMemo<Fn>(
    () => (y) => {
      const c = cross(y)
      if (!c) return 0
      return leftOf ? c[1] - h : h - c[0]
    },
    [cross, leftOf, h],
  )
  const ry = useMemo<Fn>(
    () => (y) => {
      const c = cross(y)
      if (!c) return 0
      return leftOf ? c[0] - h : h - c[1]
    },
    [cross, leftOf, h],
  )

  const valid = vert ? leftOf || rightOf : below || above
  const R = vert ? Ry : Rx
  const r = vert ? ry : rx
  const lo = vert ? yLo : a
  const hi = vert ? yHi : b

  // Exact volume. Vertical axis: shell method as an independent check on the washers.
  const vol = useMemo(() => {
    if (!valid) return NaN
    if (!vert) return Math.PI * integrate((x) => Rx(x) ** 2 - rx(x) ** 2, a, b, 1000)
    return 2 * Math.PI * integrate((x) => Math.abs(x - h) * (f(x) - g(x)), a, b, 2000)
  }, [valid, vert, Rx, rx, a, b, f, g, h])

  const d = (hi - lo) / n
  const discSum = useMemo(() => {
    if (!valid) return NaN
    let s = 0
    for (let i = 0; i < n; i++) {
      const m = lo + (i + 0.5) * d
      s += Math.PI * (R(m) ** 2 - r(m) ** 2) * d
    }
    return s
  }, [valid, R, r, lo, d, n])

  /* ---------- 3D geometry ---------- */
  const lathe = useMemo(() => {
    if (!valid) return null
    const pts: THREE.Vector2[] = []
    const N = 160
    if (!vert) {
      for (let i = 0; i <= N; i++) {
        const x = a + ((b - a) * i) / N
        pts.push(new THREE.Vector2(Math.max(0, Rx(x)), x))
      }
      for (let i = N; i >= 0; i--) {
        const x = a + ((b - a) * i) / N
        pts.push(new THREE.Vector2(Math.max(0, rx(x)), x))
      }
      pts.push(pts[0].clone())
      return new THREE.LatheGeometry(pts, 72, 0, theta)
    }
    // vertical axis: revolve the region's boundary, radius = distance from x = h
    for (let i = 0; i <= N; i++) {
      const x = a + ((b - a) * i) / N
      pts.push(new THREE.Vector2(Math.abs(x - h), f(x)))
    }
    for (let i = N; i >= 0; i--) {
      const x = a + ((b - a) * i) / N
      pts.push(new THREE.Vector2(Math.abs(x - h), g(x)))
    }
    pts.push(pts[0].clone())
    // phi = π/2 puts the starting copy on +x (region right of the axis), −π/2 on −x
    return new THREE.LatheGeometry(pts, 72, leftOf ? Math.PI / 2 : -Math.PI / 2, leftOf ? theta : -theta)
  }, [valid, vert, Rx, rx, a, b, theta, f, g, h, leftOf])

  const discs = useMemo(() => {
    if (!valid) return []
    const out: { at: number; geo: THREE.ExtrudeGeometry }[] = []
    for (let i = 0; i < n; i++) {
      const m = lo + (i + 0.5) * d
      const Ro = R(m)
      const ri = r(m)
      if (!(Ro > 1e-4)) continue
      const sh = new THREE.Shape()
      sh.absarc(0, 0, Ro, 0, Math.PI * 2, false)
      if (ri > 1e-3) {
        const hole = new THREE.Path()
        hole.absarc(0, 0, ri, 0, Math.PI * 2, true)
        sh.holes.push(hole)
      }
      out.push({ at: lo + i * d, geo: new THREE.ExtrudeGeometry(sh, { depth: d * 0.94, bevelEnabled: false, curveSegments: 40 }) })
    }
    return out
  }, [valid, R, r, lo, d, n])
  const shown = Math.max(1, Math.round(discs.length * prog))

  const regionGeo = useMemo(() => {
    const sh = new THREE.Shape()
    sh.moveTo(a, g(a))
    samples.forEach((x) => sh.lineTo(x, f(x)))
    ;[...samples].reverse().forEach((x) => sh.lineTo(x, g(x)))
    return new THREE.ShapeGeometry(sh)
  }, [f, g, a, samples])

  /* ---------- framing ---------- */
  const maxR = vert ? Math.max(Math.abs(a - h), Math.abs(b - h)) : Math.max(...samples.map((x) => Math.abs(Rx(x))))
  const S = vert ? 5 / Math.max(yHi - yLo, 2 * maxR) : 5 / Math.max(b - a, 2 * maxR)
  const groupPos: [number, number, number] = vert ? [-h * S, (-(yLo + yHi) / 2) * S, 0] : [((-(a + b) / 2) * S), -k * S, 0]

  /* ---------- slice + formula ---------- */
  const sv = lo + (hi - lo) * slice
  const Rs = R(sv)
  const rs = r(sv)
  const cs = vert ? cross(sv) : null

  const radTex = (outer: boolean): string | null => {
    if (!vert) {
      if (below) return outer ? minus(R0.fTex, k) : R0.gTex === '0' && k === 0 ? '0' : minus(R0.gTex, k)
      return outer ? `${fmt(k)}-${R0.gTex === '0' ? '0' : paren(R0.gTex)}` : `${fmt(k)}-${paren(R0.fTex)}`
    }
    if (!R0.xLTex || !R0.xRTex) return null
    if (leftOf) return outer ? minus(R0.xRTex, h) : minus(R0.xLTex, h)
    return outer ? `${fmt(h)}-${paren(R0.xLTex)}` : `${fmt(h)}-${paren(R0.xRTex)}`
  }
  const v = vert ? 'y' : 'x'
  const Rtex = radTex(true)
  const rtex = radTex(false)

  // 2D view
  const xPad = (b - a) * 0.1 + 0.2
  const X2: V2 = vert ? [Math.min(a, h) - xPad, Math.max(b, h) + xPad] : [a - (b - a) * 0.1, b + (b - a) * 0.1]
  const span = vert ? yHi - yLo : Math.max(fMax, k) - Math.min(gMin, k)
  const Y2: V2 = vert
    ? [yLo - span * 0.15 - 0.3, yHi + span * 0.15 + 0.3]
    : [Math.min(gMin, k) - span * 0.15 - 0.3, Math.max(fMax, k) + span * 0.15 + 0.3]

  const pickRegion = (i: number) => {
    setRi(i)
    setK(0)
    setH(regions[i].a)
  }

  return (
    <ToolLayout
      stage={
        <>
          <div style={{ flex: '2.4 1 0', minHeight: 0, display: 'flex' }}>
            <Scene3D
              camera={vert ? [5.5, 3.5, 8] : [2.5, 3.2, 8.5]}
              label={(mode === 'solid' ? 'Revolve the region around ' : 'Washers stacked along ' + (vert ? 'y, around ' : 'x, around ')) + (vert ? `x = ${fmt(h)}` : `y = ${fmt(k)}`)}
            >
              <group scale={S} position={groupPos}>
                <Axes3D
                  x={[Math.min(0, a, vert ? h : 0) - 0.3, Math.max(b, vert ? h : 0) + 0.5]}
                  y={[Math.min(0, gMin, vert ? 0 : k) - 0.3, Math.max(fMax, vert ? 0 : k) + 0.5]}
                  colors={colors}
                />
                {/* axis of rotation */}
                {vert ? (
                  <Line points={[[h, yLo - 0.6, 0], [h, yHi + 0.6, 0]]} color={colors.hot} lineWidth={2.5} dashed dashSize={0.15} gapSize={0.1} />
                ) : (
                  <Line points={[[a - 0.6, k, 0], [b + 0.6, k, 0]]} color={colors.hot} lineWidth={2.5} dashed dashSize={0.15} gapSize={0.1} />
                )}
                <mesh geometry={regionGeo} position={[0, 0, 0.002]}>
                  <meshStandardMaterial color={colors.f} transparent opacity={0.5} side={THREE.DoubleSide} />
                </mesh>
                {mode === 'solid' && lathe && !vert && (
                  <group position={[0, k, 0]} rotation={[0, 0, -Math.PI / 2]}>
                    <mesh geometry={lathe} rotation={[0, Math.PI / 2, 0]}>
                      <meshStandardMaterial color={tint(colors.f)} transparent opacity={0.72} side={THREE.DoubleSide} roughness={0.5} />
                    </mesh>
                  </group>
                )}
                {mode === 'solid' && lathe && vert && (
                  <mesh geometry={lathe} position={[h, 0, 0]}>
                    <meshStandardMaterial color={tint(colors.f)} transparent opacity={0.72} side={THREE.DoubleSide} roughness={0.5} />
                  </mesh>
                )}
                {mode === 'discs' &&
                  discs.slice(0, shown).map((w, i) => (
                    <mesh
                      key={i}
                      geometry={w.geo}
                      position={vert ? [h, w.at, 0] : [w.at, k, 0]}
                      rotation={vert ? [-Math.PI / 2, 0, 0] : [0, Math.PI / 2, 0]}
                    >
                      <meshStandardMaterial color={i === shown - 1 ? tint(colors.hot, 0.15) : tint(colors.f, i % 2 ? 0.3 : 0.42)} transparent opacity={0.8} roughness={0.5} />
                    </mesh>
                  ))}
              </group>
            </Scene3D>
          </div>
          <Graph small x={X2} y={Y2} label="The region and one slice">
            <AreaBetween f={f} g={g} a={a} b={b} />
            {vert ? <VLine x={h} color="var(--hot)" /> : <HLine y={k} color="var(--hot)" />}
            <Curve f={f} domain={[a, b]} />
            <Curve f={g} domain={[a, b]} color="var(--g)" />
            {valid && !vert && (
              <Rect x0={sv - (b - a) / 80} x1={sv + (b - a) / 80} y0={g(sv)} y1={f(sv)} fill="color-mix(in srgb, var(--hot) 60%, transparent)" />
            )}
            {valid && vert && cs && (
              <Rect x0={cs[0]} x1={cs[1]} y0={sv - (yHi - yLo) / 80} y1={sv + (yHi - yLo) / 80} fill="color-mix(in srgb, var(--hot) 60%, transparent)" />
            )}
          </Graph>
        </>
      }
      controls={
        <>
          <Group title="Region">
            <div className="chips">
              {regions.map((x, i) => (
                <button key={i} className="chip" aria-pressed={i === ri} onClick={() => pickRegion(i)}>
                  {x.label}
                </button>
              ))}
            </div>
          </Group>
          <Group title="Axis of rotation">
            <Seg<Orient>
              value={orient}
              onChange={setOrient}
              options={[
                { value: 'h', label: 'Horizontal: y = k' },
                { value: 'v', label: 'Vertical: x = h' },
              ]}
            />
            {vert ? (
              <Slider label="x = h" value={h} min={-4} max={8} step={0.5} onChange={setH} format={(x) => 'x = ' + fmt(x)} />
            ) : (
              <Slider label="y = k" value={k} min={-2} max={6} step={0.5} onChange={setK} format={(x) => 'y = ' + fmt(x)} />
            )}
            {!valid && <div className="callout hot">The axis cuts through the region. Choose an axis on or outside the region’s boundary.</div>}
            {vert && valid && (
              <p className="c-muted" style={{ margin: 0, fontSize: 'var(--fs-s)' }}>
                With a vertical axis, the slices are horizontal, so everything becomes a function of y: the limits are y-values and
                the radii are horizontal distances from x = {fmt(h)}.
              </p>
            )}
          </Group>
          <Group title="View">
            <Seg
              value={mode}
              onChange={setMode}
              options={[
                { value: 'solid', label: 'Solid' },
                { value: 'discs', label: 'Discs / washers' },
              ]}
            />
            {mode === 'solid' ? (
              <>
                <Slider label="Revolve" value={theta} min={0.01} max={2 * Math.PI} step={0.01} onChange={setTheta} format={(x) => fmt((x * 180) / Math.PI, 0) + '°'} />
                <PlayButton playing={playing} onClick={toggle} label="Revolve" />
              </>
            ) : (
              <>
                <Slider label="Number of discs n" value={n} min={3} max={80} step={1} onChange={setN} format={(x) => String(x)} />
                <Slider label="Build progress" value={prog} min={0} max={1} step={0.01} onChange={setProg} format={() => `${shown} of ${discs.length}`} />
              </>
            )}
          </Group>
          <Group title="One slice">
            <Slider label={v} value={slice} min={0} max={1} step={0.005} onChange={setSlice} format={() => fmt(sv, 3)} />
            <Readout
              rows={[
                ['outer radius R', valid ? fmt(Rs, 4) : '—'],
                ['inner radius r', valid ? fmt(rs, 4) : '—'],
                ['slice area π(R² − r²)', valid ? fmt(Math.PI * (Rs * Rs - rs * rs), 4) : '—'],
              ]}
            />
          </Group>
          <Group title="Volume">
            <div className="big-eq" style={{ fontSize: 'var(--fs-m)' }}>
              <Tex>{String.raw`V=\pi\int_{${fmt(lo, 2)}}^{${fmt(hi, 2)}}\Big[R(${v})^2-r(${v})^2\Big]d${v}`}</Tex>
            </div>
            {valid && (
              <div style={{ fontSize: 'var(--fs-s)', display: 'grid', gap: 4 }}>
                {Rtex && rtex ? (
                  <>
                    <Tex>{`R(${v})=${Rtex}`}</Tex>
                    <Tex>{`r(${v})=${rtex}`}</Tex>
                  </>
                ) : (
                  <span className="c-muted">
                    The edges of this region can’t be written as one formula in y, so the radii are measured numerically.
                  </span>
                )}
              </div>
            )}
            <Readout
              rows={[
                [`${n} ${vert ? 'washers' : 'discs'}`, valid ? fmt(discSum, 5) : '—'],
                [<span className="c-hot">exact volume</span>, valid ? fmt(vol, 5) : '—'],
              ]}
            />
          </Group>
        </>
      }
    />
  )
}
