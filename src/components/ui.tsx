import katex from 'katex'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseFn, parseFn2, type Fn, type Fn2 } from '../lib/parse'

/* ---------- KaTeX ---------- */
export function Tex({ children, block }: { children: string; block?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(children, { throwOnError: false, displayMode: !!block }),
    [children, block],
  )
  return <span className={block ? 'tex-block' : 'tex'} dangerouslySetInnerHTML={{ __html: html }} />
}

/* ---------- URL-backed state (so a setup can be bookmarked) ---------- */
export function useUrlState(key: string, initial: string): [string, (v: string) => void] {
  const [params, setParams] = useSearchParams()
  const value = params.get(key) ?? initial
  const set = useCallback(
    (v: string) =>
      setParams(
        (p) => {
          const n = new URLSearchParams(p)
          if (v === initial) n.delete(key)
          else n.set(key, v)
          return n
        },
        { replace: true },
      ),
    [key, initial, setParams],
  )
  return [value, set]
}

/** Parsed function backed by URL state. */
export function useFnState(key: string, initial: string): { expr: string; setExpr: (s: string) => void; fn: Fn } {
  const [expr, setExpr] = useUrlState(key, initial)
  const fn = useMemo(() => parseFn(expr).fn, [expr])
  return { expr, setExpr, fn }
}
export function useFn2(expr: string): Fn2 {
  return useMemo(() => parseFn2(expr).fn, [expr])
}

/* ---------- Function input with presets ---------- */
export interface Preset {
  label: string
  expr: string
}

export function FnInput({
  label = 'f(x) =',
  value,
  onChange,
  presets,
  twoVar,
  color,
  variable = 'x',
}: {
  label?: ReactNode
  value: string
  onChange: (expr: string) => void
  presets?: Preset[]
  twoVar?: boolean
  color?: string
  variable?: string
}) {
  const [text, setText] = useState(value)
  const [err, setErr] = useState<string | null>(null)
  const last = useRef(value)
  useEffect(() => {
    if (value !== last.current) {
      setText(value)
      setErr(null)
      last.current = value
    }
  }, [value])

  const commit = (s: string) => {
    setText(s)
    if (!s.trim()) {
      setErr(`Type a function of ${variable}.`)
      return
    }
    const r = twoVar ? parseFn2(s) : parseFn(s, variable)
    setErr(r.error)
    if (!r.error) {
      last.current = s
      onChange(s)
    }
  }

  return (
    <div className="fn-input">
      <div className="row" style={color ? { boxShadow: `inset 3px 0 0 ${color}` } : undefined}>
        <span className="prefix" style={color ? { color } : undefined}>
          {label}
        </span>
        <input
          value={text}
          spellCheck={false}
          autoComplete="off"
          aria-label={typeof label === 'string' ? label : 'expression'}
          onChange={(e) => commit(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
        />
      </div>
      {err && <div className="err">{err}</div>}
      {presets && (
        <div className="chips">
          {presets.map((p) => (
            <button key={p.expr} className="chip" aria-pressed={p.expr === value} onClick={() => commit(p.expr)}>
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- Slider ---------- */
export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  format,
}: {
  label: ReactNode
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  return (
    <label className="slider-row">
      <span className="lbl">{label}</span>
      <span className="val">{format ? format(value) : String(+value.toFixed(3)).replace('-', '−')}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
      />
    </label>
  )
}

/* ---------- Segmented control ---------- */
export function Seg<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (v: T) => void
  label?: string
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  )
}

export function Group({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <section className="ctl-group">
      {title && <h3 className="ctl-title">{title}</h3>}
      {children}
    </section>
  )
}

export function Readout({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <dl className="readout">
      {rows.map(([k, v], i) => (
        <div key={i} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/* ---------- Animation ---------- */
/**
 * Animate a value from its current position toward `to` over `seconds`,
 * calling `set` every frame. Returns [playing, toggle].
 */
export function usePlayer(
  get: () => number,
  set: (v: number) => void,
  opts: { from: number; to: number; seconds: number; loop?: boolean },
): [boolean, () => void] {
  const [playing, setPlaying] = useState(false)
  const raf = useRef(0)
  const o = useRef(opts)
  o.current = opts
  const getRef = useRef(get)
  getRef.current = get
  const setRef = useRef(set)
  setRef.current = set

  useEffect(() => {
    if (!playing) return
    let prev = performance.now()
    let v = getRef.current()
    const { from, to } = o.current
    if ((to - from) * (to - v) <= 1e-12) v = from
    const tick = (t: number) => {
      const { from, to, seconds, loop } = o.current
      const dt = (t - prev) / 1000
      prev = t
      v += ((to - from) / seconds) * dt
      const done = (to - from) * (v - to) >= 0
      if (done) {
        if (loop) v = from
        else {
          setRef.current(to)
          setPlaying(false)
          return
        }
      }
      setRef.current(v)
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [playing])

  return [playing, () => setPlaying((p) => !p)]
}

export function PlayButton({ playing, onClick, label = 'Play' }: { playing: boolean; onClick: () => void; label?: string }) {
  return (
    <button className="btn" onClick={onClick} style={{ minWidth: 96 }}>
      {playing ? '❚❚ Pause' : `▶ ${label}`}
    </button>
  )
}

/** Small legend item. */
export function Key({ color, children, dashed }: { color: string; children: ReactNode; dashed?: boolean }) {
  return (
    <span>
      <span
        className="swatch"
        style={{
          background: dashed ? `repeating-linear-gradient(90deg, ${color} 0 5px, transparent 5px 8px)` : color,
        }}
      />
      {children}
    </span>
  )
}
