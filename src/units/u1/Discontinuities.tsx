import { useMemo, useState } from 'react'
import { Curve, Dot, Graph, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Check, Group, Seg, Slider, Tex } from '../../components/ui'
import { fmt, isGood, limitText, oneSidedLimit } from '../../lib/numeric'
import type { Fn } from '../../lib/parse'

type Kind = 'removable' | 'jump' | 'infinite' | 'osc'

export default function Discontinuities() {
  const [kind, setKind] = useState<Kind>('removable')
  const [defined, setDefined] = useState(true)
  const [fa, setFa] = useState(2)
  const [k, setK] = useState(1.5)

  const cfg = useMemo(() => {
    switch (kind) {
      case 'removable':
        return {
          a: 2,
          f: ((x: number) => (x === 2 ? NaN : (x * x - 4) / (x - 2))) as Fn,
          tex: 'f(x)=\\dfrac{x^2-4}{x-2},\\ x\\ne 2',
          X: [-1, 5] as V2,
          Y: [-0.5, 7] as V2,
          value: defined ? fa : NaN,
        }
      case 'jump':
        return {
          a: 2,
          f: ((x: number) => (x < 2 ? x * x : k * x - 1)) as Fn,
          tex: 'f(x)=\\begin{cases} x^2 & x<2\\\\ kx-1 & x\\ge 2\\end{cases}',
          X: [-1, 5] as V2,
          Y: [-1, 9] as V2,
          value: 2 * k - 1,
        }
      case 'infinite':
        return {
          a: 1,
          f: ((x: number) => 1 / (x - 1)) as Fn,
          tex: 'f(x)=\\dfrac{1}{x-1}',
          X: [-3, 5] as V2,
          Y: [-6, 6] as V2,
          value: NaN,
        }
      default:
        return {
          a: 0,
          f: ((x: number) => (x === 0 ? NaN : Math.sin(1 / x))) as Fn,
          tex: 'f(x)=\\sin\\!\\left(\\tfrac{1}{x}\\right)',
          X: [-1, 1] as V2,
          Y: [-1.6, 1.6] as V2,
          value: NaN,
        }
    }
  }, [kind, defined, fa, k])

  const { a, f, value } = cfg
  const L = oneSidedLimit(f, a, -1)
  const R = oneSidedLimit(f, a, 1)
  const limExists = L.kind === 'value' && R.kind === 'value' && Math.abs(L.v - R.v) < 1e-4
  const c1 = isGood(value)
  const c2 = limExists
  const c3 = c1 && c2 && Math.abs((L as { v: number }).v - value) < 1e-4
  const display: Fn = kind === 'jump' ? f : f

  const verdict = c3
    ? 'Continuous at x = ' + a + '.'
    : kind === 'removable'
      ? 'Removable discontinuity: the limit exists, so redefining one point would fix it.'
      : kind === 'jump'
        ? 'Jump discontinuity: the one-sided limits are different.'
        : kind === 'infinite'
          ? 'Infinite discontinuity: vertical asymptote.'
          : 'Oscillating discontinuity: f never settles down near 0.'

  const Mark = ({ ok }: { ok: boolean }) => <b className={ok ? 'c-fpp' : 'c-hot'}>{ok ? '✓' : '✗'}</b>

  return (
    <ToolLayout
      stage={
        <Graph x={cfg.X} y={cfg.Y} label={<Tex>{cfg.tex}</Tex>}>
          <VLine x={a} />
          <Curve f={display} samples={kind === 'osc' ? 4000 : 800} />
          {kind !== 'osc' && kind !== 'infinite' && L.kind === 'value' && <Dot x={a} y={L.v} open color="var(--f)" />}
          {kind === 'jump' && R.kind === 'value' && <Dot x={a} y={R.v} color="var(--f)" />}
          {kind === 'removable' && c1 && <Dot x={a} y={value} color="var(--f)" />}
        </Graph>
      }
      controls={
        <>
          <Group title="Type">
            <Seg<Kind>
              value={kind}
              onChange={setKind}
              options={[
                { value: 'removable', label: 'Removable' },
                { value: 'jump', label: 'Jump' },
                { value: 'infinite', label: 'Infinite' },
                { value: 'osc', label: 'Oscillating' },
              ]}
            />
          </Group>
          {kind === 'removable' && (
            <Group title="Define f(2)">
              <Check checked={defined} onChange={setDefined}>
                f(2) is defined
              </Check>
              {defined && <Slider label="f(2) =" value={fa} min={0} max={6} step={0.25} onChange={setFa} />}
              <p className="c-muted" style={{ margin: 0, fontSize: 'var(--fs-s)' }}>
                Move f(2) to 4 to make the function continuous.
              </p>
            </Group>
          )}
          {kind === 'jump' && (
            <Group title="Find k for continuity">
              <Slider label="k" value={k} min={0} max={4} step={0.05} onChange={setK} />
              <div className="big-eq">
                <Tex>{`\\lim_{x\\to2^-}=4,\\quad \\lim_{x\\to2^+}=2k-1=${fmt(2 * k - 1)}`}</Tex>
              </div>
              <p className="c-muted" style={{ margin: 0, fontSize: 'var(--fs-s)' }}>
                Solve 2k − 1 = 4 and the jump closes.
              </p>
            </Group>
          )}
          <Group title={`The three conditions at x = ${a}`}>
            <div className="readout" style={{ gridTemplateColumns: '1fr auto' }}>
              <dt>1. f(a) is defined</dt>
              <dd>
                <Mark ok={c1} /> {c1 ? fmt(value) : ''}
              </dd>
              <dt>2. lim f(x) exists</dt>
              <dd>
                <Mark ok={c2} /> {c2 ? limitText(L) : `${limitText(L)} vs ${limitText(R)}`}
              </dd>
              <dt>3. limit = f(a)</dt>
              <dd>
                <Mark ok={c3} />
              </dd>
            </div>
            <div className={'callout ' + (c3 ? 'good' : 'hot')}>{verdict}</div>
          </Group>
        </>
      }
    />
  )
}
