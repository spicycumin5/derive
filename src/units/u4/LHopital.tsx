import { useMemo, useState } from 'react'
import { Curve, Dot, Graph, HLine, SlopeLine, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Group, Key, PlayButton, Readout, Seg, Slider, Tex, usePlayer } from '../../components/ui'
import { autoRange, derivs } from '../../lib/calc'
import { fmt } from '../../lib/numeric'

const exs = [
  { label: 'sin x / x', f: 'sin(x)', g: 'x', a: 0, tex: '\\lim_{x\\to0}\\frac{\\sin x}{x}' },
  { label: '(eˣ − 1)/x', f: 'exp(x) - 1', g: 'x', a: 0, tex: '\\lim_{x\\to0}\\frac{e^x-1}{x}' },
  { label: 'ln x/(x − 1)', f: 'ln(x)', g: 'x - 1', a: 1, tex: '\\lim_{x\\to1}\\frac{\\ln x}{x-1}' },
  { label: '(x² − 4)/(x − 2)', f: 'x^2 - 4', g: 'x - 2', a: 2, tex: '\\lim_{x\\to2}\\frac{x^2-4}{x-2}' },
  { label: '(1 − cos x)/x²', f: '1 - cos(x)', g: 'x^2', a: 0, tex: '\\lim_{x\\to0}\\frac{1-\\cos x}{x^2}' },
]

export default function LHopital() {
  const [i, setI] = useState(0)
  const e = exs[i]
  const F = useMemo(() => derivs(e.f), [e.f])
  const G = useMemo(() => derivs(e.g), [e.g])
  const ratio = useMemo(() => (x: number) => F.f(x) / G.f(x), [F, G])
  const [z, setZ] = useState(0.3)
  const [playing, toggle] = usePlayer(() => z, setZ, { from: 0.3, to: -2.5, seconds: 5 })
  const w = 10 ** z
  const a = e.a
  const X: V2 = [a - w, a + w]
  const Y: V2 = [-w * 1.2, w * 1.2]
  const fpa = F.fp(a)
  const gpa = G.fp(a)
  const twice = Math.abs(fpa) < 1e-9 && Math.abs(gpa) < 1e-9
  const limit = twice ? F.fpp(a) / G.fpp(a) : fpa / gpa
  const Yr = useMemo(() => autoRange([ratio], a - 2, a + 2, { includeZero: false, min: 1 }), [ratio, a])
  const probe = a + w * 0.3

  return (
    <ToolLayout
      stage={
        <>
          <Graph x={X} y={Y} label={<span>Zoom in at x = {a}: both curves look like lines through zero</span>}>
            <Curve f={F.f} color="var(--f)" />
            <Curve f={G.f} color="var(--g)" />
            {!twice && <SlopeLine x0={a} y0={0} m={fpa} color="var(--f)" dashed weight={1.5} />}
            {!twice && <SlopeLine x0={a} y0={0} m={gpa} color="var(--g)" dashed weight={1.5} />}
            <Dot x={a} y={0} color="var(--hot)" />
          </Graph>
          <Graph small x={[a - 2, a + 2]} y={Yr} label={<span className="c-fp">the ratio f(x)/g(x)</span>}>
            <HLine y={limit} color="var(--hot)" />
            <Curve f={ratio} color="var(--fp)" samples={1500} />
            <VLine x={a} />
            <Dot x={a} y={limit} open color="var(--fp)" />
          </Graph>
        </>
      }
      controls={
        <>
          <Group title="Limit">
            <Seg value={String(i)} onChange={(v) => setI(Number(v))} options={exs.map((x, k) => ({ value: String(k), label: x.label }))} />
            <div className="big-eq">
              <Tex>{e.tex}</Tex>
            </div>
            <div className="strip" style={{ padding: 0 }}>
              <Key color="var(--f)">f (top)</Key>
              <Key color="var(--g)">g (bottom)</Key>
            </div>
          </Group>
          <Group title="Zoom">
            <Slider label="Window" value={z} min={-3} max={0.5} step={0.01} onChange={setZ} format={() => '±' + fmt(w, 4)} />
            <PlayButton playing={playing} onClick={toggle} label="Zoom in" />
          </Group>
          <Group title="Compare">
            <Readout
              rows={[
                ['f(a), g(a)', `${fmt(F.f(a), 3)}, ${fmt(G.f(a), 3)}  → 0/0`],
                [`f/g at x = ${fmt(probe, 4)}`, fmt(ratio(probe), 6)],
                ["f′(a) / g′(a)", twice ? '0/0 again' : `${fmt(fpa, 3)} / ${fmt(gpa, 3)}`],
                ...(twice ? ([["f″(a) / g″(a)", `${fmt(F.fpp(a), 3)} / ${fmt(G.fpp(a), 3)}`]] as [string, string][]) : []),
                ['limit', <b className="c-hot">{fmt(limit, 5)}</b>],
              ]}
            />
            <div className="callout">
              {twice
                ? 'Both derivatives are also 0 at a. That is 0/0 again, so apply the rule a second time. The curves are flat at a, so compare their curvature.'
                : `Near a, f ≈ ${fmt(fpa, 3)}(x − a) and g ≈ ${fmt(gpa, 3)}(x − a). The (x − a) cancels, leaving the ratio of the slopes.`}
            </div>
          </Group>
        </>
      }
    />
  )
}
