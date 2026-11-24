import { Line } from '@react-three/drei'
import { useMemo, useState } from 'react'
import * as THREE from 'three'
import { ToolLayout } from '../../components/layout'
import { Axes3D, Scene3D, tint, useThemeColors } from '../../components/three'
import { Group, Readout, Seg, Slider, Tex } from '../../components/ui'
import { fmt, integrate } from '../../lib/numeric'
import type { Fn } from '../../lib/parse'

type Shape = 'square' | 'semi' | 'equi' | 'iso'
const shapes: Record<Shape, { label: string; A: (s: number) => number; tex: string }> = {
  square: { label: 'Square', A: (s) => s * s, tex: 'A=s^2' },
  semi: { label: 'Semicircle', A: (s) => (Math.PI * s * s) / 8, tex: 'A=\\tfrac{\\pi}{8}s^2' },
  equi: { label: 'Equilateral △', A: (s) => (Math.sqrt(3) / 4) * s * s, tex: 'A=\\tfrac{\\sqrt3}{4}s^2' },
  iso: { label: 'Isosceles right △', A: (s) => (s * s) / 2, tex: 'A=\\tfrac12 s^2' },
}

const bases: { label: string; f: Fn; g: Fn; a: number; b: number; tex: string }[] = [
  { label: 'y = √x, y = 0, 0 ≤ x ≤ 4', f: Math.sqrt, g: () => 0, a: 0, b: 4, tex: 's=\\sqrt{x}' },
  { label: 'y = 2 − x²/2, y = 0', f: (x) => 2 - (x * x) / 2, g: () => 0, a: -2, b: 2, tex: 's=2-\\tfrac{x^2}{2}' },
  { label: 'Circle x² + y² = 4', f: (x) => Math.sqrt(Math.max(0, 4 - x * x)), g: (x) => -Math.sqrt(Math.max(0, 4 - x * x)), a: -2, b: 2, tex: 's=2\\sqrt{4-x^2}' },
  { label: 'y = x and y = x²/3, 0 ≤ x ≤ 3', f: (x) => x, g: (x) => (x * x) / 3, a: 0, b: 3, tex: 's=x-\\tfrac{x^2}{3}' },
]

function slabShape(kind: Shape, lo: number, hi: number): THREE.Shape {
  const s = hi - lo
  const sh = new THREE.Shape()
  if (kind === 'square') {
    sh.moveTo(lo, 0)
    sh.lineTo(hi, 0)
    sh.lineTo(hi, s)
    sh.lineTo(lo, s)
  } else if (kind === 'semi') {
    sh.moveTo(hi, 0)
    sh.absarc((lo + hi) / 2, 0, s / 2, 0, Math.PI, false)
  } else if (kind === 'equi') {
    sh.moveTo(lo, 0)
    sh.lineTo(hi, 0)
    sh.lineTo((lo + hi) / 2, (Math.sqrt(3) / 2) * s)
  } else {
    sh.moveTo(lo, 0)
    sh.lineTo(hi, 0)
    sh.lineTo(lo, s)
  }
  sh.closePath()
  return sh
}

export default function CrossSections() {
  const colors = useThemeColors()
  const [bi, setBi] = useState(0)
  const [kind, setKind] = useState<Shape>('square')
  const [n, setN] = useState(24)
  const [prog, setProg] = useState(1)
  const B = bases[bi]
  const { f, g, a, b } = B
  const dx = (b - a) / n
  const shown = Math.max(1, Math.round(n * prog))
  const S = 4 / (b - a) // world scale

  const slabs = useMemo(() => {
    const out: { x: number; geo: THREE.ExtrudeGeometry }[] = []
    for (let i = 0; i < n; i++) {
      const xm = a + (i + 0.5) * dx
      const hi = f(xm)
      const lo = g(xm)
      if (!(hi - lo > 1e-4)) continue
      // Shape u axis = math y; mapped by mesh rotation to world −Z.
      const geo = new THREE.ExtrudeGeometry(slabShape(kind, lo, hi), { depth: dx * 0.96, bevelEnabled: false, curveSegments: 20 })
      out.push({ x: a + i * dx, geo })
    }
    return out
  }, [f, g, a, dx, n, kind])

  const floor = useMemo(() => {
    const sh = new THREE.Shape()
    const N = 120
    sh.moveTo(a, g(a))
    for (let i = 0; i <= N; i++) sh.lineTo(a + ((b - a) * i) / N, f(a + ((b - a) * i) / N))
    for (let i = N; i >= 0; i--) sh.lineTo(a + ((b - a) * i) / N, g(a + ((b - a) * i) / N))
    return new THREE.ShapeGeometry(sh)
  }, [f, g, a, b])
  const edge = (fn: Fn) => Array.from({ length: 121 }, (_, i) => a + ((b - a) * i) / 120).map((x) => [x, 0, -fn(x)] as [number, number, number])

  const A = shapes[kind].A
  const exact = useMemo(() => integrate((x) => A(f(x) - g(x)), a, b, 1000), [A, f, g, a, b])
  const approx = useMemo(() => {
    let s = 0
    for (let i = 0; i < n; i++) {
      const xm = a + (i + 0.5) * dx
      s += A(f(xm) - g(xm)) * dx
    }
    return s
  }, [A, f, g, a, dx, n])
  const cx = (a + b) / 2

  return (
    <ToolLayout
      stage={
        <Scene3D camera={[3.5, 4.5, 7.5]} target={[0, 0.6, -0.6]} label="Cross sections standing on the base region">
          <group scale={S} position={[-cx * S, 0, 0]}>
            <Axes3D x={[Math.min(0, a) - 0.3, b + 0.6]} y={[0, 2.6 / S + 0.5]} z={[0.5, -(Math.max(...[0, 1, 2, 3, 4].map((t) => f(a + ((b - a) * t) / 4))) + 0.6)]} colors={colors} labels={['x', 'height', 'y']} />
            <mesh geometry={floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
              <meshStandardMaterial color={colors.f} transparent opacity={0.28} side={THREE.DoubleSide} />
            </mesh>
            <Line points={edge(f)} color={colors.f} lineWidth={2.5} />
            <Line points={edge(g)} color={colors.g} lineWidth={2.5} />
            {slabs.slice(0, shown).map((s, i) => (
              <mesh key={i} geometry={s.geo} rotation={[0, Math.PI / 2, 0]} position={[s.x, 0, 0]}>
                <meshStandardMaterial color={i === shown - 1 ? tint(colors.hot, 0.15) : tint(colors.f, i % 2 ? 0.3 : 0.42)} transparent opacity={0.82} roughness={0.55} />
              </mesh>
            ))}
          </group>
        </Scene3D>
      }
      controls={
        <>
          <Group title="Base region">
            <div className="chips">
              {bases.map((x, k) => (
                <button key={k} className="chip" aria-pressed={k === bi} onClick={() => setBi(k)}>
                  {x.label}
                </button>
              ))}
            </div>
          </Group>
          <Group title="Cross-section shape">
            <Seg value={kind} onChange={setKind} options={(Object.keys(shapes) as Shape[]).map((k) => ({ value: k, label: shapes[k].label }))} />
          </Group>
          <Group title="Slices">
            <Slider label="Number of slabs n" value={n} min={3} max={120} step={1} onChange={setN} format={(v) => String(v)} />
            <Slider label="Build progress" value={prog} min={0} max={1} step={0.01} onChange={setProg} format={() => `${shown} of ${n}`} />
          </Group>
          <Group title="Volume">
            <div style={{ fontSize: 'var(--fs-s)', display: 'grid', gap: 6, overflowX: 'auto' }}>
              <Tex>{`${B.tex},\\quad ${shapes[kind].tex}`}</Tex>
              <Tex>{`V=\\int_{${fmt(a)}}^{${fmt(b)}} A\\big(s(x)\\big)\\,dx`}</Tex>
            </div>
            <Readout
              rows={[
                [`sum of ${n} slabs`, fmt(approx, 5)],
                [<span className="c-hot">exact volume</span>, fmt(exact, 5)],
              ]}
            />
          </Group>
        </>
      }
    />
  )
}
