import { Coordinates, Mafs, useTransformContext, type vec } from 'mafs'
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Fn } from '../lib/parse'

export type V2 = [number, number]

interface View {
  x: V2
  y: V2
}
const ViewCtx = createContext<View>({ x: [-5, 5], y: [-5, 5] })
export const useView = () => useContext(ViewCtx)

/** A "nice" grid step for a span (1, 2, 5 × 10^k). */
export function niceStep(span: number, target = 8): number {
  const raw = span / target
  const p = 10 ** Math.floor(Math.log10(raw))
  const m = raw / p
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p
}

const fmtTick = (step: number) => (v: number) => {
  const d = Math.max(0, -Math.floor(Math.log10(step)))
  return Number(v.toFixed(d)).toString().replace('-', '−')
}

interface GraphProps {
  x: V2
  y: V2
  label?: ReactNode
  corner?: ReactNode
  small?: boolean
  pan?: boolean
  onPointer?: (p: V2 | null) => void
  onClick?: (p: V2) => void
  children?: ReactNode
  /** custom axis steps */
  xStep?: number
  yStep?: number
  xLabels?: (v: number) => string
  /** Use π labels on x axis */
  piX?: boolean
  style?: React.CSSProperties
  grid?: boolean
  /** keep 1:1 scale: widen/narrow the x range to match the panel's aspect */
  equal?: boolean
}

/** A themed Mafs canvas that fills its flex slot and exposes its view range to children. */
export function Graph({
  x,
  y,
  label,
  corner,
  small,
  pan = false,
  onPointer,
  onClick,
  children,
  xStep,
  yStep,
  xLabels,
  piX,
  style,
  grid = true,
  equal,
}: GraphProps) {
  const box = useRef<HTMLDivElement>(null)
  const [h, setH] = useState(0)
  const [wPx, setWPx] = useState(0)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const read = () => {
      setH(Math.max(80, Math.floor(el.clientHeight)))
      setWPx(el.clientWidth)
    }
    const ro = new ResizeObserver(read)
    ro.observe(el)
    read()
    return () => ro.disconnect()
  }, [])
  if (equal && h > 0 && wPx > 0) {
    const ySpan = y[1] - y[0]
    const xSpan = x[1] - x[0]
    const need = (ySpan * wPx) / h
    if (need >= xSpan) {
      const c = (x[0] + x[1]) / 2
      x = [c - need / 2, c + need / 2]
    } else {
      const c = (y[0] + y[1]) / 2
      const ny = (xSpan * h) / wPx
      y = [c - ny / 2, c + ny / 2]
    }
  }

  const view = useMemo(() => ({ x, y }), [x[0], x[1], y[0], y[1]]) // eslint-disable-line react-hooks/exhaustive-deps
  const xs = xStep ?? (piX ? Math.PI / 2 : niceStep(x[1] - x[0]))
  const ys = yStep ?? niceStep(y[1] - y[0], Math.max(2, Math.min(8, h / 55)))

  return (
    <div ref={box} className={'graph' + (small ? ' small' : '')} style={style}>
      {label && <div className="graph-label">{label}</div>}
      {corner && <div className="graph-corner">{corner}</div>}
      {h > 0 && (
        <ViewCtx.Provider value={view}>
          <Mafs
            height={h}
            pan={pan}
            zoom={false}
            viewBox={{ x, y, padding: 0 }}
            preserveAspectRatio={false}
            onClick={onClick ? (p) => onClick(p as V2) : undefined}
          >
            {grid ? (
              <Coordinates.Cartesian
                xAxis={{ lines: xs, subdivisions: 2, labels: xLabels ?? (piX ? piLabel : fmtTick(xs)) }}
                yAxis={{ lines: ys, subdivisions: 2, labels: fmtTick(ys) }}
              />
            ) : null}
            {children}
            {onPointer && <PointerTracker onPointer={onPointer} />}
          </Mafs>
        </ViewCtx.Provider>
      )}
    </div>
  )
}

function piLabel(v: number): string {
  const k = Math.round(v / (Math.PI / 2))
  if (k === 0) return '0'
  const map: Record<number, string> = { 1: 'π/2', 2: 'π', [-1]: '−π/2', [-2]: '−π' }
  if (map[k]) return map[k]
  return k % 2 === 0 ? `${(k / 2).toString().replace('-', '−')}π` : `${k.toString().replace('-', '−')}π/2`
}

/** Reports the pointer position in math coordinates. */
function PointerTracker({ onPointer }: { onPointer: (p: V2 | null) => void }) {
  const { viewTransform } = useTransformContext()
  const ref = useRef<SVGGElement>(null)
  const vt = useRef<vec.Matrix>(viewTransform)
  const cb = useRef(onPointer)
  vt.current = viewTransform
  cb.current = onPointer
  useEffect(() => {
    const svg = ref.current?.ownerSVGElement
    if (!svg) return
    const move = (e: PointerEvent) => {
      const r = svg.getBoundingClientRect()
      const vb = svg.viewBox.baseVal
      const m = vt.current
      cb.current([(e.clientX - r.left + vb.x) / m[0], (e.clientY - r.top + vb.y) / m[4]])
    }
    const leave = () => cb.current(null)
    svg.addEventListener('pointermove', move)
    svg.addEventListener('pointerleave', leave)
    return () => {
      svg.removeEventListener('pointermove', move)
      svg.removeEventListener('pointerleave', leave)
    }
  }, [])
  return <g ref={ref} />
}

const T = { transform: 'var(--mafs-view-transform)' } as const

/** Sample f into path segments, breaking at NaN and vertical asymptotes. */
export function samplePath(f: Fn, a: number, b: number, yv: V2, n = 700): string {
  const span = yv[1] - yv[0]
  const lo = yv[0] - span * 3
  const hi = yv[1] + span * 3
  let d = ''
  let pen = false
  let px = 0
  let py = 0
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n
    let y = f(x)
    if (!Number.isFinite(y)) {
      pen = false
      continue
    }
    if (pen && Math.abs(y - py) > span * 0.5) {
      // jump or asymptote? check midpoint
      const ym = f((x + px) / 2)
      const between = Number.isFinite(ym) && (ym - py) * (ym - y) <= 0
      if (!between || Math.abs(ym - py) > span * 0.45) pen = false
    }
    y = Math.min(hi, Math.max(lo, y))
    d += (pen ? 'L' : 'M') + x.toFixed(5) + ' ' + y.toFixed(5)
    pen = true
    px = x
    py = y
  }
  return d
}

interface CurveProps {
  f: Fn
  color?: string
  weight?: number
  domain?: V2
  dashed?: boolean
  opacity?: number
  samples?: number
}

/** Function graph y = f(x) that handles asymptotes, holes and jumps cleanly. */
export function Curve({ f, color = 'var(--f)', weight = 3, domain, dashed, opacity = 1, samples }: CurveProps) {
  const v = useView()
  const [a, b] = domain ?? v.x
  const d = useMemo(() => samplePath(f, a, b, v.y, samples), [f, a, b, v.y, samples])
  return (
    <path
      d={d}
      style={{ ...T, stroke: color, fill: 'none' }}
      strokeWidth={weight}
      strokeOpacity={opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? '7 6' : undefined}
      vectorEffect="non-scaling-stroke"
    />
  )
}

/** Polyline through given points (math coords). */
export function Path({
  pts,
  color = 'var(--f)',
  weight = 3,
  dashed,
  fill,
  opacity = 1,
}: {
  pts: V2[]
  color?: string
  weight?: number
  dashed?: boolean
  fill?: string
  opacity?: number
}) {
  if (pts.length < 2) return null
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join('') + (fill ? 'Z' : '')
  return (
    <path
      d={d}
      style={{ ...T, fill: fill ?? 'none', stroke: weight ? color : 'none' }}
      strokeWidth={weight}
      strokeOpacity={opacity}
      strokeDasharray={dashed ? '7 6' : undefined}
      strokeLinejoin="round"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  )
}

/** Vertical band from x=a to x=b spanning the whole view. */
export function Band({ a, b, color }: { a: number; b: number; color: string }) {
  const v = useView()
  const span = v.y[1] - v.y[0]
  return (
    <rect
      x={Math.min(a, b)}
      y={v.y[0] - span}
      width={Math.abs(b - a)}
      height={span * 3}
      style={{ ...T, fill: color }}
    />
  )
}

/** Horizontal band from y=a to y=b. */
export function HBand({ a, b, color }: { a: number; b: number; color: string }) {
  const v = useView()
  const span = v.x[1] - v.x[0]
  return <rect x={v.x[0] - span} y={Math.min(a, b)} width={span * 3} height={Math.abs(b - a)} fill={color} style={T} />
}

/** Rectangle in math coords. */
export function Rect({
  x0,
  x1,
  y0,
  y1,
  fill,
  stroke,
  weight = 1.5,
}: {
  x0: number
  x1: number
  y0: number
  y1: number
  fill: string
  stroke?: string
  weight?: number
}) {
  return (
    <rect
      x={Math.min(x0, x1)}
      y={Math.min(y0, y1)}
      width={Math.abs(x1 - x0)}
      height={Math.abs(y1 - y0)}
      fill={fill}
      stroke={stroke}
      strokeWidth={weight}
      vectorEffect="non-scaling-stroke"
      style={T}
    />
  )
}

/** Filled region between f (top) and g (bottom, default 0) on [a,b]. */
export function AreaBetween({
  f,
  g = () => 0,
  a,
  b,
  fill = 'var(--area)',
  n = 300,
}: {
  f: Fn
  g?: Fn
  a: number
  b: number
  fill?: string
  n?: number
}) {
  const d = useMemo(() => {
    if (b <= a) return ''
    const top: string[] = []
    const bot: string[] = []
    for (let i = 0; i <= n; i++) {
      const x = a + ((b - a) * i) / n
      const fy = f(x)
      const gy = g(x)
      if (!Number.isFinite(fy) || !Number.isFinite(gy)) continue
      top.push(`${x} ${fy}`)
      bot.push(`${x} ${gy}`)
    }
    if (top.length < 2) return ''
    return 'M' + top.join('L') + 'L' + bot.reverse().join('L') + 'Z'
  }, [f, g, a, b, n])
  return <path d={d} style={{ ...T, fill, stroke: 'none' }} />
}

/** Positive part blue, negative part pink: signed area under f on [a,b]. */
export function SignedArea({ f, a, b }: { f: Fn; a: number; b: number }) {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  const pos = useMemo(() => (x: number) => Math.max(0, f(x)), [f])
  const neg = useMemo(() => (x: number) => Math.min(0, f(x)), [f])
  return (
    <>
      <AreaBetween f={pos} a={lo} b={hi} fill="var(--area)" />
      <AreaBetween f={neg} a={lo} b={hi} fill="var(--area-neg)" />
    </>
  )
}

/** Vertical guide line at x. */
export function VLine({ x, color = 'var(--muted)', dashed = true, weight = 1.5 }: { x: number; color?: string; dashed?: boolean; weight?: number }) {
  const v = useView()
  const span = v.y[1] - v.y[0]
  return (
    <Path
      pts={[
        [x, v.y[0] - span],
        [x, v.y[1] + span],
      ]}
      color={color}
      dashed={dashed}
      weight={weight}
    />
  )
}
export function HLine({ y, color = 'var(--muted)', dashed = true, weight = 1.5 }: { y: number; color?: string; dashed?: boolean; weight?: number }) {
  const v = useView()
  const span = v.x[1] - v.x[0]
  return (
    <Path
      pts={[
        [v.x[0] - span, y],
        [v.x[1] + span, y],
      ]}
      color={color}
      dashed={dashed}
      weight={weight}
    />
  )
}

/** Line through (x0,y0) with slope m across the view. */
export function SlopeLine({
  x0,
  y0,
  m,
  color = 'var(--fp)',
  weight = 2.5,
  half,
  dashed,
}: {
  x0: number
  y0: number
  m: number
  color?: string
  weight?: number
  /** half-length in x (segment) instead of full line */
  half?: number
  dashed?: boolean
}) {
  const v = useView()
  if (!Number.isFinite(m) || !Number.isFinite(y0)) return null
  const span = v.x[1] - v.x[0]
  const L = half ?? span * 2
  // keep visual length roughly constant for steep segments
  let dx = L
  if (half != null) {
    const sx = span
    const sy = v.y[1] - v.y[0]
    const k = Math.hypot(1 / sx, m / sy)
    dx = (half / sx) / k
  }
  return (
    <Path
      pts={[
        [x0 - dx, y0 - m * dx],
        [x0 + dx, y0 + m * dx],
      ]}
      color={color}
      weight={weight}
      dashed={dashed}
    />
  )
}

/** Dot (filled) or hole (open) at a point, pixel-sized. */
export function Dot({
  x,
  y,
  color = 'var(--hot)',
  open,
  r = 6,
}: {
  x: number
  y: number
  color?: string
  open?: boolean
  r?: number
}) {
  const { viewTransform } = useTransformContext()
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  const px = x * viewTransform[0]
  const py = y * viewTransform[4]
  return (
    <circle
      cx={px}
      cy={py}
      r={r}
      fill={open ? 'var(--panel)' : color}
      stroke={color}
      strokeWidth={open ? 2.5 : 0}
    />
  )
}

/** Text label at math coords with pixel offset. */
export function Label({
  x,
  y,
  children,
  color = 'var(--ink)',
  dx = 8,
  dy = -8,
  anchor = 'start',
  size = 14,
  weight = 700,
}: {
  x: number
  y: number
  children: ReactNode
  color?: string
  dx?: number
  dy?: number
  anchor?: 'start' | 'middle' | 'end'
  size?: number
  weight?: number
}) {
  const { viewTransform } = useTransformContext()
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return (
    <text
      x={x * viewTransform[0] + dx}
      y={y * viewTransform[4] + dy}
      fill={color}
      fontSize={size}
      fontWeight={weight}
      textAnchor={anchor}
      className="mafs-shadow"
      style={{ fill: color }}
    >
      {children}
    </text>
  )
}

/** Arrow from p to q (math coords) with a pixel-sized head. */
export function Arrow({ from, to, color = 'var(--hot)', weight = 2.5 }: { from: V2; to: V2; color?: string; weight?: number }) {
  const { viewTransform } = useTransformContext()
  const a: V2 = [from[0] * viewTransform[0], from[1] * viewTransform[4]]
  const b: V2 = [to[0] * viewTransform[0], to[1] * viewTransform[4]]
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  if (!Number.isFinite(len) || len < 1) return null
  const ux = (b[0] - a[0]) / len
  const uy = (b[1] - a[1]) / len
  const hs = Math.min(11, len * 0.5)
  const h1: V2 = [b[0] - ux * hs - uy * hs * 0.5, b[1] - uy * hs + ux * hs * 0.5]
  const h2: V2 = [b[0] - ux * hs + uy * hs * 0.5, b[1] - uy * hs - ux * hs * 0.5]
  return (
    <g stroke={color} strokeWidth={weight} strokeLinecap="round" fill={color}>
      <line x1={a[0]} y1={a[1]} x2={b[0] - ux * hs * 0.6} y2={b[1] - uy * hs * 0.6} />
      <path d={`M${b[0]} ${b[1]}L${h1[0]} ${h1[1]}L${h2[0]} ${h2[1]}Z`} strokeWidth={1} style={{ fill: color, stroke: color }} />
    </g>
  )
}
