import { useState } from 'react'
import { Graph, Label, Rect, type V2 } from '../../components/graph'
import { ToolLayout } from '../../components/layout'
import { Group, Key, PlayButton, Readout, Slider, Tex, usePlayer } from '../../components/ui'
import { fmt } from '../../lib/numeric'

const f = (t: number) => 1 + 0.6 * t
const fp = () => 0.6
const g = (t: number) => 1 + 0.25 * t * t
const gp = (t: number) => 0.5 * t

export default function ProductRule() {
  const [t, setT] = useState(2)
  const [dt, setDt] = useState(1.5)
  const [playing, toggle] = usePlayer(() => dt, setDt, { from: 1.5, to: 0.01, seconds: 5 })
  const F = f(t)
  const G = g(t)
  const dF = f(t + dt) - F
  const dG = g(t + dt) - G
  const X: V2 = [-0.4, 5.6]
  const Y: V2 = [-0.4, 5.6]
  const dA = (F + dF) * (G + dG) - F * G
  const exact = fp() * G + F * gp(t)

  return (
    <ToolLayout
      stage={
        <Graph equal x={X} y={Y} label="Area = f · g" grid={false}>
          <Rect x0={0} x1={F} y0={0} y1={G} fill="var(--area)" stroke="var(--f)" weight={2} />
          <Rect x0={F} x1={F + dF} y0={0} y1={G} fill="color-mix(in srgb, var(--fp) 35%, transparent)" stroke="var(--fp)" />
          <Rect x0={0} x1={F} y0={G} y1={G + dG} fill="color-mix(in srgb, var(--fpp) 35%, transparent)" stroke="var(--fpp)" />
          <Rect x0={F} x1={F + dF} y0={G} y1={G + dG} fill="color-mix(in srgb, var(--hot) 45%, transparent)" stroke="var(--hot)" />
          <Label x={F / 2} y={G / 2} anchor="middle" dx={0} dy={0} size={18}>
            f · g
          </Label>
          <Label x={F / 2} y={0} anchor="middle" dx={0} dy={20} color="var(--f)">
            f = {fmt(F, 2)}
          </Label>
          <Label x={0} y={G / 2} anchor="end" dx={-8} dy={4} color="var(--f)">
            g = {fmt(G, 2)}
          </Label>
          {dF > 0.08 && (
            <Label x={F + dF / 2} y={G / 2} anchor="middle" dx={0} color="var(--fp)">
              g·Δf
            </Label>
          )}
          {dG > 0.08 && (
            <Label x={F / 2} y={G + dG / 2} anchor="middle" dx={0} dy={5} color="var(--fpp)">
              f·Δg
            </Label>
          )}
        </Graph>
      }
      controls={
        <>
          <Group title="Setup">
            <div className="big-eq">
              <Tex>{'f(t)=1+0.6t,\\quad g(t)=1+0.25t^2'}</Tex>
            </div>
            <Slider label="t" value={t} min={0} max={3} step={0.01} onChange={setT} />
            <Slider label="Δt" value={dt} min={0.01} max={1.5} step={0.01} onChange={setDt} />
            <PlayButton playing={playing} onClick={toggle} label="Shrink Δt" />
          </Group>
          <Group title="Change in area">
            <div className="strip" style={{ padding: 0 }}>
              <Key color="var(--fp)">g·Δf</Key>
              <Key color="var(--fpp)">f·Δg</Key>
              <Key color="var(--hot)">Δf·Δg</Key>
            </div>
            <Readout
              rows={[
                [<span className="c-fp">g·Δf</span>, fmt(G * dF, 4)],
                [<span className="c-fpp">f·Δg</span>, fmt(F * dG, 4)],
                [<span className="c-hot">Δf·Δg (corner)</span>, fmt(dF * dG, 4)],
                ['ΔA / Δt', fmt(dA / dt, 4)],
                ["f′g + fg′", fmt(exact, 4)],
              ]}
            />
            <div className="callout">
              The corner shrinks like (Δt)², so ΔA/Δt → f′g + fg′. As Δt shrinks, the corner’s share of the change goes
              from {fmt((100 * dF * dG) / dA, 1)}% toward 0%.
            </div>
          </Group>
        </>
      }
    />
  )
}
