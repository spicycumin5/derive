import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toolPath, units } from '../curriculum'
import { syllabus } from '../syllabus'
import { useSettings, useShortcuts } from './layout'

export function UnitPage() {
  const { unit } = useParams()
  const u = units.find((x) => x.n === Number(unit))
  const s = u ? syllabus[u.n] : undefined
  useShortcuts()
  const { dark, presenter, toggleDark, togglePresenter } = useSettings()

  useEffect(() => {
    if (u) document.title = `Unit ${u.n}: ${u.title} · Derive`
  }, [u])

  if (!u || !s)
    return (
      <div style={{ padding: 40 }}>
        <h1>No unit at this address.</h1>
        <p>
          <Link to="/">Go to the course map</Link> to choose one.
        </p>
      </div>
    )

  const toolBySlug = new Map(u.tools.map((t) => [t.slug, t]))
  const prev = units.find((x) => x.n === u.n - 1)
  const next = units.find((x) => x.n === u.n + 1)

  return (
    <>
      <header className="tool-head">
        <div className="grow">
          <div className="crumb">
            <Link to="/">Course map</Link> / Unit {u.n}
          </div>
          <h1>
            Unit {u.n}: {u.title}
          </h1>
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

      <div className="unit-page">
        <p className="unit-story">{u.story}</p>

        <section>
          <h2>Before you start</h2>
          <p className="section-lede">Check these before starting the unit. A gap here usually shows up later as a mistake that looks like a calculus error.</p>
          <div className="prereq-grid">
            {s.prereqs.map((p) => (
              <div className="prereq" key={p.topic}>
                <div className="prereq-head">
                  <b>{p.topic}</b>
                  {p.unit && (
                    <Link className="chip" to={`/unit/${p.unit}`}>
                      Unit {p.unit}
                    </Link>
                  )}
                </div>
                <p>{p.why}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Topics and what must be understood</h2>
          <p className="section-lede">One line per AP CED topic: the idea a student needs before they can solve problems on it reliably.</p>
          <ol className="topic-list">
            {s.topics.map((t) => (
              <li className="topic-row" key={t.id}>
                <span className="topic-id">{t.id}</span>
                <div>
                  <div className="topic-title">{t.title}</div>
                  <p className="topic-must">{t.mustKnow}</p>
                </div>
                <div className="topic-tools">
                  {t.tools?.length ? (
                    t.tools.map((slug) => {
                      const tool = toolBySlug.get(slug)
                      return tool ? (
                        <Link key={slug} className="chip" to={toolPath({ unit: u, slug })}>
                          {tool.title}
                        </Link>
                      ) : null
                    })
                  ) : (
                    <span className="chip muted">No tool yet</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {s.note && <p className="unit-note">{s.note}</p>}
        </section>

        <section>
          <h2>Tools in this unit</h2>
          <div className="unit-tools">
            {u.tools.map((t) => (
              <Link key={t.slug} to={toolPath({ unit: u, slug: t.slug })} className={t.flagship ? 'flag' : undefined}>
                <b>{t.title}</b>
                <span>{t.summary}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <footer className="tool-foot">
        {prev ? <Link to={`/unit/${prev.n}`}>← Unit {prev.n}: {prev.title}</Link> : <span />}
        {next ? <Link to={`/unit/${next.n}`}>Unit {next.n}: {next.title} →</Link> : <span />}
      </footer>
    </>
  )
}
