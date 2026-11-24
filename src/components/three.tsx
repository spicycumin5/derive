import { Line, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useState, type ReactNode } from 'react'
import * as THREE from 'three'

/** Lighten a CSS color toward white so lit 3D faces stay readable. */
export const tint = (c: string, k = 0.35) => '#' + new THREE.Color(c).lerp(new THREE.Color('#ffffff'), k).getHexString()
import { useSettings } from './layout'

/** Resolve theme CSS variables to concrete colors for three.js. */
export function useThemeColors() {
  const { dark } = useSettings()
  const read = () => {
    const s = getComputedStyle(document.documentElement)
    const g = (n: string) => s.getPropertyValue(n).trim() || '#888'
    return { f: g('--f'), fp: g('--fp'), fpp: g('--fpp'), hot: g('--hot'), g: g('--g'), ink: g('--ink'), muted: g('--muted'), grid: g('--grid-major'), panel: g('--panel') }
  }
  const [c, setC] = useState(read)
  useEffect(() => {
    // after the theme attribute flips
    const id = requestAnimationFrame(() => setC(read()))
    return () => cancelAnimationFrame(id)
  }, [dark])
  return c
}

export type C3 = ReturnType<typeof useThemeColors>

/** Math axes: x → world X, y → world Y (up) or floor, z toward viewer. */
export function Axes3D({ x, y, z, colors }: { x: [number, number]; y: [number, number]; z?: [number, number]; colors: C3; labels?: string[] }) {
  return (
    <group>
      <Line points={[[x[0], 0, 0], [x[1], 0, 0]]} color={colors.muted} lineWidth={1.5} />
      <Line points={[[0, y[0], 0], [0, y[1], 0]]} color={colors.muted} lineWidth={1.5} />
      {z && <Line points={[[0, 0, z[0]], [0, 0, z[1]]]} color={colors.muted} lineWidth={1.5} />}
    </group>
  )
}

export function Scene3D({ children, camera, target = [0, 0, 0], label }: { children: ReactNode; camera: [number, number, number]; target?: [number, number, number]; label?: ReactNode }) {
  return (
    <div className="graph" style={{ cursor: 'grab' }}>
      {label && <div className="graph-label">{label}</div>}
      <div className="graph-corner" style={{ pointerEvents: 'none' }}>
        <span className="c-muted" style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
          drag to rotate · scroll to zoom
        </span>
      </div>
      <Canvas camera={{ position: camera, fov: 38 }} dpr={[1, 2]}>
        <ambientLight intensity={1.15} />
        <directionalLight position={[6, 10, 8]} intensity={1.6} />
        <directionalLight position={[-6, -3, -6]} intensity={0.45} />
        {children}
        <OrbitControls makeDefault target={target} enableDamping />
      </Canvas>
    </div>
  )
}
