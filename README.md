# Derive: AP Calculus AB, visually

Interactive tools for every unit of AP Calculus AB, built for live tutoring sessions.

## Run it

```bash
npm install      # first time only
npm run dev      # opens at http://localhost:5173
```

For a production build, run `npm run build`, then `npm run preview` to serve it locally. You can also upload the `dist/` folder to any static host, such as Netlify, GitHub Pages or Vercel, to get a link you can share with students.

## Using it in a session

| Key | Action |
| --- | --- |
| `P` | Presenter mode: hides the sidebar, makes everything bigger, goes fullscreen |
| `T` | Light / dark theme |
| `←` `→` | Previous / next tool, in curriculum order |
| `H` | Course map |

- Every tool has a **Big idea and talking points** panel with the key formula and a common misconception.
- Function inputs accept student-style math: `x^3 - 3x`, `sin(x)/x`, `ln(x)`, `sqrt(x+4)`, `abs(x)`, `e^x`, and piecewise `x < 1 ? x^2 : 3 - x`.
- The function you choose is saved in the URL, so you can bookmark a setup before a session.

## What's inside

| Unit | Tools |
| --- | --- |
| 1 Limits and continuity | Limit explorer · Types of discontinuity · Squeeze theorem · Limits at infinity · IVT |
| 2 Definition of the derivative | Secant to tangent · Building f′ from f · Differentiability · Product rule as area |
| 3 Composite, implicit, inverse | Chain rule machine · Implicit curves · Inverse function slopes |
| 4 Contextual applications | Particle motion · Related rates · Linearization · L'Hôpital |
| 5 Analytical applications | **f, f′, f″ together** · MVT · Candidates test · Optimization |
| 6 Integration and accumulation | Riemann sums · **Accumulation function and FTC** · Antiderivative families |
| 7 Differential equations | **Slope fields** (with Euler's method) · Exponential models |
| 8 Applications of integration | Average value · Area between curves · Cross sections (3D) · **Solids of revolution (3D)** |

## Adding a tool

1. Create `src/units/uN/MyTool.tsx` that returns `<ToolLayout stage={…} controls={…} />`.
2. Register it in `src/curriculum.ts` with its title, CED topics and talking points.

The sidebar, course map, routing and prev/next navigation all update automatically.

Shared building blocks:

- `src/components/graph.tsx`: `Graph`, `Curve`, `Band`, `AreaBetween`, `SlopeLine`, `Dot`, and others.
- `src/components/ui.tsx`: `FnInput`, `Slider`, `Seg`, `Readout`, `usePlayer`.
- `src/lib/`: parsing and numerical methods, tested with `npm test`.
