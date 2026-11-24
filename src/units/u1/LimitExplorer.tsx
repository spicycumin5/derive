import { useMemo, useState } from 'react'
import { Curve, Dot, Graph, HLine, Label, Path, VLine, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { FnInput, Group, PlayButton, Readout, Slider, useFnState, usePlayer, useUrlState } from '../../components/ui'
import { fmt, isGood, limitText, oneSidedLimit } from '../../lib/numeric'

const presets = [
  { label: '(x² − 1)/(x − 1)', expr: '(x^2 - 1)/(x - 1)', a: 1 },
  { label: 'sin(x)/x', expr: 'sin(x)/x', a: 0 },
  { label: 'jump', expr: 'x < 1 ? x^2 : 3 - x', a: 1 },
  { label: '1/(x − 1)²', expr: '1/(x - 1)^2', a: 1 },
  { label: '1/(x − 1)', expr: '1/(x - 1)', a: 1 },
  { label: 'sin(1/x)', expr: 'sin(1/x)', a: 0 },
  { label: '(√(x+4) − 2)/x', expr: '(sqrt(x + 4) - 2)/x', a: 0 },
]

export default function LimitExplorer() {
  const { expr, setExpr, fn: f } = useFnState('f', presets[0].expr)
  const [aStr, setA] = useUrlState('a', '1')
  const a = Number(aStr)
  const [logD, setLogD] = useState(0) // δ = 10^logD
  const [logZoom, setLogZoom] = useState(0.5)
  const d = 10 ** logD
  const [playing, toggle] = usePlayer(() => logD, setLogD, { from: 0, to: -3, seconds: 5 })

  const left = useMemo(() => oneSidedLimit(f, a, -1), [f, a])
  const right = useMemo(() => oneSidedLimit(f, a, 1), [f, a])
  const two =
    left.kind !== 'dne' && right.kind !== 'dne' && left.v === right.v
      ? limitText(left)
      : left.kind === 'value' && right.kind === 'value' && Math.abs(left.v - right.v) < 1e-3 * (1 + Math.abs(left.v))
        ? limitText(left)
        : 'DNE'
  const fa = f(a)

  const w = 10 ** logZoom * 2
  const center = left.kind === 'value' ? left.v : right.kind === 'value' ? right.v : 0
  const X: V2 = [a - w, a + w]
  const Y: V2 = [center - w * 0.75, center + w * 0.75]

  const xl = a - d
  const xr = a + d
  const yl = f(xl)
  const yr = f(xr)
  const steps = [1, 0.1, 0.01, 0.001]
  const showTwo = two !== 'DNE'

  return (
    <ToolLayout
      stage={
        <Graph x={X} y={Y} label={<span>Approaching x = {fmt(a)} from both sides</span>}>
          <VLine x={a} color="var(--muted)" />
          {showTwo && left.kind === 'value' && <HLine y={left.v} color="var(--hot)" weight={1.5} />}
          <Curve f={f} samples={1500} />
          {/* approaching points */}
          {isGood(yl) && (
            <>
              <Path pts={[[xl, Y[0] - 10], [xl, yl]]} color="var(--fp)" weight={1.5} dashed />
              <Dot x={xl} y={yl} color="var(--fp)" r={7} />
              <Label x={xl} y={yl} color="var(--fp)" anchor="end" dx={-10}>
                from the left
              </Label>
            </>
          )}
          {isGood(yr) && (
            <>
              <Path pts={[[xr, Y[0] - 10], [xr, yr]]} color="var(--fpp)" weight={1.5} dashed />
              <Dot x={xr} y={yr} color="var(--fpp)" r={7} />
              <Label x={xr} y={yr} color="var(--fpp)" dx={10}>
                from the right
              </Label>
            </>
          )}
          {left.kind === 'value' && <Dot x={a} y={left.v} open color="var(--f)" />}
          {right.kind === 'value' && (left.kind !== 'value' || Math.abs(left.v - right.v) > 1e-6) && (
            <Dot x={a} y={right.v} open color="var(--f)" />
          )}
          {isGood(fa) && <Dot x={a} y={fa} color="var(--f)" />}
        </Graph>
      }
      controls={
        <>
          <Group title="Function">
            <FnInput
              value={expr}
              onChange={(e) => {
                setExpr(e)
                const p = presets.find((p) => p.expr === e)
                if (p) setA(String(p.a))
              }}
              presets={presets}
            />
            <Slider label="Approach point a" value={a} min={-5} max={5} step={0.5} onChange={(v) => setA(String(v))} />
          </Group>
          <Group title="Approach">
            <Slider label="Distance from a" value={logD} min={-4} max={0.3} step={0.01} onChange={setLogD} format={(v) => 'δ = ' + fmt(10 ** v, 4)} />
            <PlayButton playing={playing} onClick={toggle} label="Close in" />
            <Slider label="Zoom" value={logZoom} min={-3} max={1} step={0.01} onChange={setLogZoom} format={(v) => '×' + fmt(1 / 10 ** v, 1)} />
          </Group>
          <Group title="Table of values">
            <table className="vtable">
              <thead>
                <tr>
                  <th>x</th>
                  <th className="c-fp">f(x) left</th>
                  <th>x</th>
                  <th className="c-fpp">f(x) right</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((s) => (
                  <tr key={s}>
                    <td>{fmt(a - s, 4)}</td>
                    <td>{fmt(f(a - s), 5)}</td>
                    <td>{fmt(a + s, 4)}</td>
                    <td>{fmt(f(a + s), 5)}</td>
                  </tr>
                ))}
                <tr className="hl">
                  <td>{fmt(xl, 4)}</td>
                  <td>{fmt(yl, 5)}</td>
                  <td>{fmt(xr, 4)}</td>
                  <td>{fmt(yr, 5)}</td>
                </tr>
              </tbody>
            </table>
          </Group>
          <Group title="Verdict">
            <Readout
              rows={[
                [<span className="c-fp">lim x→a⁻</span>, limitText(left)],
                [<span className="c-fpp">lim x→a⁺</span>, limitText(right)],
                ['lim x→a', <span className="c-hot">{two}</span>],
                ['f(a)', isGood(fa) ? fmt(fa, 4) : 'undefined'],
              ]}
            />
            <div className={'callout ' + (showTwo ? 'good' : 'hot')}>
              {showTwo
                ? isGood(fa) && Math.abs(fa - (left as { v: number }).v) < 1e-6
                  ? 'Both sides agree, and f(a) matches the limit.'
                  : 'Both sides agree, so the limit exists, even though f(a) ' + (isGood(fa) ? 'is a different value.' : 'is undefined.')
                : left.kind === 'dne' || right.kind === 'dne'
                  ? 'The values never settle down (oscillation), so the limit does not exist.'
                  : 'The left and right values head to different places, so the two-sided limit does not exist.'}
            </div>
          </Group>
        </>
      }
    />
  )
}
