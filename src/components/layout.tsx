import { createContext, Suspense, useContext, useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { allTools, toolPath, units, type FlatTool } from '../curriculum'
import { Tex } from './ui'

/* ---------- app-level settings (theme, presenter) ---------- */
interface Settings {
  dark: boolean
  presenter: boolean
  toggleDark: () => void
  togglePresenter: () => void
}
const SettingsCtx = createContext<Settings>(null!)
export const useSettings = () => useContext(SettingsCtx)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem('derive-theme') === 'dark')
  const [presenter, setPresenter] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('derive-theme', dark ? 'dark' : 'light')
  }, [dark])
  useEffect(() => {
    document.body.classList.toggle('presenter', presenter)
    if (presenter && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {})
    if (!presenter && document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
  }, [presenter])
  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement) setPresenter(false)
    }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  return (
    <SettingsCtx.Provider
      value={{ dark, presenter, toggleDark: () => setDark((d) => !d), togglePresenter: () => setPresenter((p) => !p) }}
    >
      {children}
    </SettingsCtx.Provider>
  )
}

/* ---------- keyboard shortcuts ---------- */
export function useShortcuts(current?: FlatTool) {
  const nav = useNavigate()
  const { toggleDark, togglePresenter } = useSettings()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (t.closest('input, textarea, select, [contenteditable], .MafsView')) return
      if (e.key === 'p' || e.key === 'P') togglePresenter()
      else if (e.key === 't' || e.key === 'T') toggleDark()
      else if (current && (e.key === 'ArrowRight' || e.key === ']')) {
        const n = allTools[current.index + 1]
        if (n) nav(toolPath(n))
      } else if (current && (e.key === 'ArrowLeft' || e.key === '[')) {
        const p = allTools[current.index - 1]
        if (p) nav(toolPath(p))
      } else if (e.key === 'h' || e.key === 'H') nav('/')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, nav, toggleDark, togglePresenter])
}

/* ---------- Sidebar ---------- */
export function Sidebar() {
  const loc = useLocation()
  const activeUnit = Number(loc.pathname.match(/unit\/(\d)/)?.[1] ?? 0)
  const [open, setOpen] = useState<Set<number>>(() => new Set(activeUnit ? [activeUnit] : [5]))
  useEffect(() => {
    if (activeUnit) setOpen((s) => (s.has(activeUnit) ? s : new Set(s).add(activeUnit)))
  }, [activeUnit])

  return (
    <nav className="sidebar" aria-label="Units and tools">
      <Link to="/" className="brand">
        <Logo />
        <span>
          Derive
          <small>AP Calculus AB, visually</small>
        </span>
      </Link>
      {units.map((u) => {
        const isOpen = open.has(u.n)
        return (
          <div key={u.n} className={'nav-unit' + (isOpen ? ' open' : '')}>
            <button
              aria-expanded={isOpen}
              onClick={() =>
                setOpen((s) => {
                  const n = new Set(s)
                  if (n.has(u.n)) n.delete(u.n)
                  else n.add(u.n)
                  return n
                })
              }
            >
              <span className="num">{u.n}</span>
              <span>{u.title}</span>
              <span className="chev">›</span>
            </button>
            {isOpen && (
              <ul>
                <li>
                  <NavLink to={`/unit/${u.n}`} end className="nav-overview">
                    Overview and prerequisites
                  </NavLink>
                </li>
                {u.tools.map((t) => (
                  <li key={t.slug}>
                    <NavLink to={`/unit/${u.n}/${t.slug}`}>{t.title}</NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
      <div className="sidebar-foot">
        <p>
          <kbd>←</kbd> <kbd>→</kbd> previous / next tool
        </p>
        <p>
          <kbd>P</kbd> presenter mode · <kbd>T</kbd> theme · <kbd>H</kbd> home
        </p>
      </div>
    </nav>
  )
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="7" fill="var(--ink)" />
      <path d="M5 23 C 11 23, 12 9, 17 9 S 23 21, 27 15" fill="none" stroke="#6E9BFF" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M9 5 L 25 13" stroke="#F59E42" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.4" fill="#F06AA8" />
    </svg>
  )
}

/* ---------- Tool page ---------- */
const ToolCtx = createContext<FlatTool | null>(null)

export function ToolPage() {
  const { unit, slug } = useParams()
  const tool = allTools.find((t) => t.unit.n === Number(unit) && t.slug === slug)
  useShortcuts(tool)
  const { dark, presenter, toggleDark, togglePresenter } = useSettings()

  useEffect(() => {
    if (tool) document.title = `${tool.title} · Derive`
  }, [tool])

  if (!tool)
    return (
      <div style={{ padding: 40 }}>
        <h1>No tool at this address.</h1>
        <p>
          <Link to="/">Go to the course map</Link> to choose one.
        </p>
      </div>
    )

  const prev = allTools[tool.index - 1]
  const next = allTools[tool.index + 1]

  return (
    <ToolCtx.Provider value={tool}>
      <header className="tool-head">
        <div className="grow">
          <div className="crumb">
            <Link to="/">Course map</Link> / Unit {tool.unit.n}: {tool.unit.title} / CED {tool.topics}
          </div>
          <h1>{tool.title}</h1>
        </div>
        <div className="head-actions">
          <button className="icon-btn" onClick={toggleDark} aria-pressed={dark} title="Toggle dark theme (T)">
            {dark ? '☾ Dark' : '☀ Light'}
          </button>
          <button className="icon-btn" onClick={togglePresenter} aria-pressed={presenter} title="Presenter mode (P)">
            ⛶ Present
          </button>
        </div>
      </header>
      <Suspense fallback={<div className="tool-body" />}>
        <tool.component key={tool.slug} />
      </Suspense>
      <footer className="tool-foot">
        {prev ? <Link to={toolPath(prev)}>← {prev.title}</Link> : <span />}
        {next ? <Link to={toolPath(next)}>{next.title} →</Link> : <span />}
      </footer>
    </ToolCtx.Provider>
  )
}

/** Standard two-column tool layout: big stage + controls column (talking points appended). */
export function ToolLayout({ stage, controls }: { stage: ReactNode; controls: ReactNode }) {
  const tool = useContext(ToolCtx)
  return (
    <div className="tool-body">
      <div className="stage">{stage}</div>
      <aside className="controls">
        {controls}
        {tool && <TalkingPoints tool={tool} />}
      </aside>
    </div>
  )
}

function TalkingPoints({ tool }: { tool: FlatTool }) {
  const { talk } = tool
  return (
    <details className="talk" open>
      <summary>Big idea and talking points</summary>
      <p className="bigidea">{talk.big}</p>
      <p className="must">
        <b>Must understand:</b> {talk.mustKnow}
      </p>
      {talk.formula && (
        <div className="formula">
          <Tex>{talk.formula}</Tex>
        </div>
      )}
      <ul>
        {talk.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      {talk.misconception && (
        <p className="misc">
          <b>Watch for:</b> {talk.misconception}
        </p>
      )}
    </details>
  )
}
