import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { units } from '../curriculum'
import { fmt } from '../lib/numeric'
import { useShortcuts } from './layout'

const f = (x: number) => 1.25 * Math.sin(0.9 * x) + 0.28 * x
const fp = (x: number) => 1.125 * Math.cos(0.9 * x) + 0.28
const fpp = (x: number) => -1.0125 * Math.sin(0.9 * x)
const X: [number, number] = [-1.2, 12.5]
const Y: [number, number] = [-2.2, 6.2]

function HeroPlot() {
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 1000, h: 440 })
  const [x, setX] = useState(4.2)
  const userMoved = useRef(false)

  useLayoutEffect(() => {
    const el = box.current!
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // One slow, orchestrated drift until the visitor takes over.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      if (userMoved.current) return
      const s = (t - t0) / 1000
      setX(5.6 + 4.2 * Math.sin(s * 0.35 - 0.3))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const { w, h } = size
  const sx = (v: number) => ((v - X[0]) / (X[1] - X[0])) * w
  const sy = (v: number) => h - ((v - Y[0]) / (Y[1] - Y[0])) * h
  const ix = (px: number) => X[0] + (px / w) * (X[1] - X[0])

  let d = ''
  for (let i = 0; i <= 400; i++) {
    const xv = X[0] + ((X[1] - X[0]) * i) / 400
    d += (i ? 'L' : 'M') + sx(xv).toFixed(1) + ' ' + sy(f(xv)).toFixed(1)
  }
  const y = f(x)
  const m = fp(x)
  const L = 2.2
  const k = L / Math.hypot(1, m * ((X[1] - X[0]) / w) / ((Y[1] - Y[0]) / h))
  const t1 = [x - k, y - m * k]
  const t2 = [x + k, y + m * k]
  const grid: number[] = []
  for (let g = Math.ceil(X[0]); g <= X[1]; g++) grid.push(g)
  const gridY: number[] = []
  for (let g = Math.ceil(Y[0]); g <= Y[1]; g++) gridY.push(g)

  const dir = Math.abs(m) < 0.06 ? 'turning' : m > 0 ? 'increasing' : 'decreasing'
  const bend = Math.abs(fpp(x)) < 0.06 ? 'changing concavity' : fpp(x) > 0 ? 'concave up' : 'concave down'

  return (
    <div
      ref={box}
      style={{ position: 'absolute', inset: 0 }}
      onPointerMove={(e) => {
        userMoved.current = true
        const r = e.currentTarget.getBoundingClientRect()
        setX(Math.min(X[1] - 0.3, Math.max(X[0] + 0.3, ix(e.clientX - r.left))))
      }}
    >
      <svg className="hero-plot" width={w} height={h} role="img" aria-label="A curve with its tangent line following your pointer">
        {grid.map((g) => (
          <line key={'x' + g} x1={sx(g)} x2={sx(g)} y1={0} y2={h} stroke="var(--grid-minor)" />
        ))}
        {gridY.map((g) => (
          <line key={'y' + g} y1={sy(g)} y2={sy(g)} x1={0} x2={w} stroke="var(--grid-minor)" />
        ))}
        <line x1={0} x2={w} y1={sy(0)} y2={sy(0)} stroke="var(--grid-major)" strokeWidth={1.5} />
        <line x1={sx(x)} x2={sx(x)} y1={sy(y)} y2={sy(0)} stroke="var(--faint)" strokeDasharray="4 5" />
        <path d={d} fill="none" stroke="var(--f)" strokeWidth={4} strokeLinecap="round" />
        <line x1={sx(t1[0])} y1={sy(t1[1])} x2={sx(t2[0])} y2={sy(t2[1])} stroke="var(--fp)" strokeWidth={3} strokeLinecap="round" />
        <circle cx={sx(x)} cy={sy(y)} r={8} fill="var(--hot)" stroke="var(--panel)" strokeWidth={3} />
      </svg>
      <div className="hero-readout">
        slope <span className="c-fp">f′ = {fmt(m, 2)}</span>, so f is {dir}, {bend}
      </div>
    </div>
  )
}

export function Home() {
  useShortcuts()
  useEffect(() => {
    document.title = 'Derive · AP Calculus AB Visual Toolkit'
  }, [])
  return (
    <div className="home">
      <section className="hero">
        <HeroPlot />
        <div className="hero-copy">
          <h1>See the calculus.</h1>
          <p>Interactive tools for every unit of AP Calculus AB, built for live tutoring. Move your pointer across the curve to see its tangent slope.</p>
        </div>
      </section>
      <section className="units">
        <div className="units-intro">
          <h2>Course map</h2>
          <p>
            Eight units, one story: limits make the derivative possible, the derivative describes change, and the integral
            adds change back up. Outlined tools are the central visual for their unit.
          </p>
        </div>
        {units.map((u) => (
          <div className="unit-row" key={u.n}>
            <div className="n">{u.n}</div>
            <div>
              <h3>
                <Link to={`/unit/${u.n}`}>{u.title}</Link>
              </h3>
              <p className="story">{u.story}</p>
              <Link className="unit-overview-link" to={`/unit/${u.n}`}>
                Prerequisites and key ideas →
              </Link>
            </div>
            <div className="unit-tools">
              {u.tools.map((t) => (
                <Link key={t.slug} to={`/unit/${u.n}/${t.slug}`} className={t.flagship ? 'flag' : undefined}>
                  <b>{t.title}</b>
                  <span>{t.summary}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
