import { useMemo, useState } from 'react'
import { Band, Curve, Dot, Graph, Label, SlopeLine, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Check, FnInput, Group, Readout, Seg, Tex, useUrlState } from '../../components/ui'
import { autoRange, useDerivs } from '../../lib/calc'
import { findRoots, fmt, signIntervals } from '../../lib/numeric'
import type { Fn } from '../../lib/parse'

const presets = [
  { label: 'x³ − 3x', expr: 'x^3 - 3x', w: 2.6 },
  { label: 'x⁴ − 4x²', expr: 'x^4 - 4x^2', w: 2.4 },
  { label: 'sin x', expr: 'sin(x)', w: 7 },
  { label: 'x·e^(−x²)', expr: 'x*exp(-x^2)', w: 3 },
  { label: 'x³ (flat, no extremum)', expr: 'x^3', w: 1.8 },
  { label: 'x⁴ (f″=0, no inflection)', expr: 'x^4', w: 1.6 },
  { label: '1/(1+x²)', expr: '1/(1+x^2)', w: 4 },
  { label: 'x + 2 sin x', expr: 'x + 2sin(x)', w: 7 },
]

type Shade = 'dir' | 'bend' | 'none'

function changes(g: Fn, a: number, b: number) {
  const span = b - a
  const d = span * 1e-3
  return findRoots(g, a, b)
    .map((r) => ({ x: r, before: Math.sign(g(r - d)), after: Math.sign(g(r + d)) }))
    .filter((r) => r.x > a + span * 0.005 && r.x < b - span * 0.005)
}

export default function ThreeGraphs() {
  const [expr, setExpr] = useUrlState('f', presets[0].expr)
  const [wStr, setW] = useUrlState('w', String(presets[0].w))
  const w = Number(wStr) || 3
  const [shade, setShade] = useState<Shade>('dir')
  const [hideF, setHideF] = useState(false)
  const [showFpp, setShowFpp] = useState(true)
  const [showTangent, setShowTangent] = useState(true)
  const [cx, setCx] = useState(w * 0.35)

  const { f, fp, fpp, fpTex, fppTex } = useDerivs(expr)
  const X: V2 = [-w, w]
  const yF = useMemo(() => autoRange([f], -w, w), [f, w])
  const yFp = useMemo(() => autoRange([fp], -w, w), [fp, w])
  const yFpp = useMemo(() => autoRange([fpp], -w, w), [fpp, w])

  const crit = useMemo(() => changes(fp, -w, w), [fp, w])
  const infl = useMemo(() => changes(fpp, -w, w).filter((r) => r.before !== r.after), [fpp, w])
  const bandsDir = useMemo(() => signIntervals(fp, -w, w), [fp, w])
  const bandsBend = useMemo(() => signIntervals(fpp, -w, w), [fpp, w])
  const bands = shade === 'dir' ? bandsDir : shade === 'bend' ? bandsBend : []

  const onPtr = (p: V2 | null) => p && setCx(Math.max(-w, Math.min(w, p[0])))

  const fx = f(cx)
  const m1 = fp(cx)
  const m2 = fpp(cx)
  const eps = 1e-3 * Math.max(1, yFp[1] - yFp[0])
  const dir = Math.abs(m1) < eps ? 'flat' : m1 > 0 ? 'increasing' : 'decreasing'
  const bend = Math.abs(m2) < 1e-3 * Math.max(1, yFpp[1] - yFpp[0]) ? 'no concavity here' : m2 > 0 ? 'concave up' : 'concave down'
  const story =
    dir === 'flat'
      ? 'f′ = 0: a horizontal tangent. Check whether f′ changes sign here.'
      : `f is ${dir} and ${bend}: ${
          dir === 'increasing'
            ? m2 > 0
              ? 'rising, and rising faster.'
              : 'rising, but more and more slowly.'
            : m2 > 0
              ? 'falling, but more and more slowly.'
              : 'falling, and falling faster.'
        }`

  const bandColor = (s: number) => (s > 0 ? 'var(--pos-band)' : s < 0 ? 'var(--neg-band)' : 'transparent')
  const bandsEl = (
    <>
      {bands.map((b, i) => (
        <Band key={i} a={b.from} b={b.to} color={bandColor(b.sign)} />
      ))}
    </>
  )
  const critEl = (
    <>
      {crit.map((c) => (
        <VLine key={'c' + c.x} x={c.x} color="var(--hot)" weight={1} />
      ))}
      {infl.map((c) => (
        <VLine key={'i' + c.x} x={c.x} color="var(--muted)" weight={1} />
      ))}
    </>
  )

  const kind = (c: { before: number; after: number }) =>
    c.before > 0 && c.after < 0 ? 'rel. max' : c.before < 0 && c.after > 0 ? 'rel. min' : 'no extremum'

  return (
    <ToolLayout
      stage={
        <>
          <Graph
            small
            x={X}
            y={yF}
            onPointer={onPtr}
            label={<span className="c-f">{hideF ? 'f(x): hidden. Sketch it from f′.' : 'f(x)'}</span>}
          >
            {bandsEl}
            {critEl}
            {!hideF && (
              <>
                <Curve f={f} color="var(--f)" weight={3.5} />
                {showTangent && <SlopeLine x0={cx} y0={fx} m={m1} color="var(--fp)" half={w * 0.28} />}
                {crit.map((c) => (
                  <g key={c.x}>
                    <Dot x={c.x} y={f(c.x)} color="var(--hot)" />
                    <Label x={c.x} y={f(c.x)} color="var(--hot)" dy={c.before > 0 ? -12 : 22} anchor="middle" dx={0}>
                      {kind(c)}
                    </Label>
                  </g>
                ))}
                {infl.map((c) => (
                  <Dot key={c.x} x={c.x} y={f(c.x)} color="var(--ink)" open r={5} />
                ))}
                <Dot x={cx} y={fx} color="var(--f)" r={7} />
              </>
            )}
            <VLine x={cx} color="var(--ink)" dashed={false} weight={1} />
          </Graph>

          <Graph small x={X} y={yFp} onPointer={onPtr} label={<span className="c-fp">f′(x): slope of f</span>}>
            {bandsEl}
            {critEl}
            <Curve f={fp} color="var(--fp)" weight={3.5} />
            {showTangent && showFpp && <SlopeLine x0={cx} y0={m1} m={m2} color="var(--fpp)" half={w * 0.22} />}
            {crit.map((c) => (
              <Dot key={c.x} x={c.x} y={0} color="var(--hot)" />
            ))}
            {infl.map((c) => (
              <Dot key={c.x} x={c.x} y={fp(c.x)} color="var(--ink)" open r={5} />
            ))}
            <Dot x={cx} y={m1} color="var(--fp)" r={7} />
            <VLine x={cx} color="var(--ink)" dashed={false} weight={1} />
          </Graph>

          {showFpp && (
            <Graph small x={X} y={yFpp} onPointer={onPtr} label={<span className="c-fpp">f″(x): slope of f′</span>}>
              {bandsEl}
              {critEl}
              <Curve f={fpp} color="var(--fpp)" weight={3.5} />
              {infl.map((c) => (
                <Dot key={c.x} x={c.x} y={0} color="var(--ink)" open r={5} />
              ))}
              <Dot x={cx} y={m2} color="var(--fpp)" r={7} />
              <VLine x={cx} color="var(--ink)" dashed={false} weight={1} />
            </Graph>
          )}
        </>
      }
      controls={
        <>
          <Group title="Function">
            <FnInput
              value={expr}
              onChange={(e) => {
                setExpr(e)
                const p = presets.find((p) => p.expr === e)
                if (p) setW(String(p.w))
              }}
              presets={presets}
            />
            <Seg
              label="x window"
              value={String(w)}
              onChange={(v) => setW(v)}
              options={[1.6, 2.6, 4, 7, 10].map((v) => ({ value: String(v), label: `±${v}` }))}
            />
          </Group>

          <Group title="Shade the intervals by">
            <Seg<Shade>
              value={shade}
              onChange={setShade}
              options={[
                { value: 'dir', label: 'Sign of f′' },
                { value: 'bend', label: 'Sign of f″' },
                { value: 'none', label: 'Off' },
              ]}
            />
            <div className="strip" style={{ padding: 0 }}>
              <span>
                <span className="swatch" style={{ background: 'var(--fpp)', height: 10 }} />
                {shade === 'bend' ? 'concave up (f″ > 0)' : 'increasing (f′ > 0)'}
              </span>
              <span>
                <span className="swatch" style={{ background: 'var(--hot)', height: 10 }} />
                {shade === 'bend' ? 'concave down (f″ < 0)' : 'decreasing (f′ < 0)'}
              </span>
            </div>
          </Group>

          <Group title={`At x = ${fmt(cx, 2)} (hover any graph)`}>
            <Readout
              rows={[
                [<span className="c-f">f(x)</span>, hideF ? '?' : fmt(fx)],
                [<span className="c-fp">f′(x)</span>, fmt(m1)],
                [<span className="c-fpp">f″(x)</span>, fmt(m2)],
              ]}
            />
            <div className={'callout ' + (dir === 'flat' ? 'hot' : 'good')}>{hideF ? 'Use the sign of f′ to decide: is f going up or down here?' : story}</div>
          </Group>

          <Group title="Show">
            <Check checked={hideF} onChange={setHideF}>
              Hide f (sketch-from-f′ challenge)
            </Check>
            <Check checked={showFpp} onChange={setShowFpp}>
              Show f″ graph
            </Check>
            <Check checked={showTangent} onChange={setShowTangent}>
              Tangent lines at the cursor
            </Check>
          </Group>

          <Group title="Critical and inflection points">
            {crit.length === 0 && infl.length === 0 ? (
              <p className="c-muted" style={{ margin: 0, fontSize: 'var(--fs-s)' }}>
                None in this window.
              </p>
            ) : (
              <table className="vtable">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>x</th>
                    <th style={{ textAlign: 'left' }}>Why</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {crit.map((c) => (
                    <tr key={'c' + c.x}>
                      <td style={{ textAlign: 'left' }}>{fmt(c.x)}</td>
                      <td style={{ textAlign: 'left' }}>
                        f′: {c.before > 0 ? '+' : '−'} → {c.after > 0 ? '+' : '−'}
                      </td>
                      <td className="c-hot">{kind(c)}</td>
                    </tr>
                  ))}
                  {infl.map((c) => (
                    <tr key={'i' + c.x}>
                      <td style={{ textAlign: 'left' }}>{fmt(c.x)}</td>
                      <td style={{ textAlign: 'left' }}>
                        f″: {c.before > 0 ? '+' : '−'} → {c.after > 0 ? '+' : '−'}
                      </td>
                      <td>inflection</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Group>

          {fpTex && !hideF && (
            <Group title="Formulas">
              <div style={{ fontSize: 'var(--fs-s)', overflowX: 'auto' }}>
                <div>
                  <Tex>{`f'(x) = ${fpTex}`}</Tex>
                </div>
                {fppTex && (
                  <div style={{ marginTop: 6 }}>
                    <Tex>{`f''(x) = ${fppTex}`}</Tex>
                  </div>
                )}
              </div>
            </Group>
          )}
        </>
      }
    />
  )
}
