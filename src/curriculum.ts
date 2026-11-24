import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export interface Talk {
  /** The one-sentence big idea. */
  big: string
  points: string[]
  /** KaTeX formula */
  formula?: string
  misconception?: string
}

export interface ToolMeta {
  slug: string
  title: string
  summary: string
  /** AP CED topic numbers */
  topics: string
  flagship?: boolean
  component: LazyExoticComponent<ComponentType>
  talk: Talk
}

export interface Unit {
  n: number
  title: string
  story: string
  tools: ToolMeta[]
}

const L = (f: () => Promise<{ default: ComponentType }>) => lazy(f)

export const units: Unit[] = [
  {
    n: 1,
    title: 'Limits and continuity',
    story: 'What value is a function heading toward? Everything else in calculus is built on that question.',
    tools: [
      {
        slug: 'limit-explorer',
        title: 'Limit explorer',
        summary: 'Approach x = a from both sides and watch f(x) settle (or not).',
        topics: '1.2–1.6',
        component: L(() => import('./units/u1/LimitExplorer')),
        talk: {
          big: 'A limit is about where f(x) is heading as x gets close to a. It doesn’t depend on f(a) itself.',
          points: [
            'Drag a toward the hole: the table fills in values from the left and right.',
            'The limit exists only when the left-hand and right-hand values agree.',
            'Zoom in. A limit is something you can see when you zoom in close.',
            'Try the jump preset: both one-sided limits exist but they differ, so the two-sided limit does not exist.',
          ],
          formula: '\\lim_{x\\to a} f(x) = L \\iff \\lim_{x\\to a^-} f(x) = \\lim_{x\\to a^+} f(x) = L',
          misconception: 'A limit is not the same as plugging in. f(a) can be undefined, or different from the limit.',
        },
      },
      {
        slug: 'discontinuities',
        title: 'Types of discontinuity',
        summary: 'Removable, jump, infinite, oscillating. Drag a slider to repair or break continuity.',
        topics: '1.10–1.13',
        component: L(() => import('./units/u1/Discontinuities')),
        talk: {
          big: 'Continuity at a takes three things: f(a) exists, the limit exists, and the two are equal.',
          points: [
            'Removable: the limit exists but f(a) is missing or misplaced. You can fix it by redefining one point.',
            'Jump: the one-sided limits exist but are different. No single point can fix it.',
            'Infinite: f blows up near a vertical asymptote.',
            'Use the piecewise slider to find the value of k that makes the function continuous. This is a common AP question.',
          ],
          formula: '\\lim_{x\\to a} f(x) = f(a)',
          misconception: '“Continuous means you can draw it without lifting your pencil” is a good intuition, but on the exam you must check all three conditions.',
        },
      },
      {
        slug: 'squeeze',
        title: 'Squeeze theorem',
        summary: 'Trap a wiggly function between two that share a limit.',
        topics: '1.8',
        component: L(() => import('./units/u1/Squeeze')),
        talk: {
          big: 'If f is trapped between g and h, and g and h head to the same limit, f has nowhere else to go.',
          points: [
            'x²·sin(1/x) oscillates infinitely often near 0, yet it’s pinned between −x² and x².',
            'Zoom in: the squeeze gets tighter and tighter around the limit point.',
            'This is how we prove that sin(x)/x → 1.',
          ],
          formula: 'g(x)\\le f(x)\\le h(x),\\ \\lim g=\\lim h=L \\Rightarrow \\lim f = L',
        },
      },
      {
        slug: 'infinity',
        title: 'Limits at infinity',
        summary: 'Zoom out to see end behavior and horizontal asymptotes.',
        topics: '1.14–1.15',
        component: L(() => import('./units/u1/Infinity')),
        talk: {
          big: 'Limits at infinity describe what a function does far away: its end behavior.',
          points: [
            'For rational functions, compare the degrees of the top and bottom.',
            'Same degree: the asymptote is the ratio of the leading coefficients.',
            'A graph can cross its horizontal asymptote. The asymptote only describes what happens far out.',
          ],
          formula: '\\lim_{x\\to\\infty}\\frac{3x^2+1}{x^2-4}=3',
          misconception: 'A function can cross its horizontal asymptote, even infinitely many times, as sin(x)/x does.',
        },
      },
      {
        slug: 'ivt',
        title: 'Intermediate value theorem',
        summary: 'Drag the target height k and find where a continuous function must hit it.',
        topics: '1.16',
        component: L(() => import('./units/u1/IVT')),
        talk: {
          big: 'A continuous function on [a, b] takes every value between f(a) and f(b).',
          points: [
            'Drag k between f(a) and f(b). There is always at least one c with f(c) = k.',
            'Switch on the discontinuous example and the guarantee breaks.',
            'IVT tells you that a solution exists, not where it is or how many there are.',
            'AP justification: “f is continuous on [a, b] and f(a) < k < f(b), so by the IVT…”',
          ],
          formula: 'f \\text{ cont. on } [a,b],\\ k \\text{ between } f(a), f(b) \\Rightarrow \\exists\\, c: f(c)=k',
          misconception: 'Students forget to state continuity. On the exam, that costs the point.',
        },
      },
    ],
  },
  {
    n: 2,
    title: 'Differentiation: definition and basic rules',
    story: 'Zoom in on any smooth curve and it looks like a line. The slope of that line is the derivative.',
    tools: [
      {
        slug: 'secant-tangent',
        title: 'Secant to tangent',
        summary: 'Shrink h and watch the secant line become the tangent line.',
        topics: '2.1–2.2',
        component: L(() => import('./units/u2/SecantTangent')),
        talk: {
          big: 'The derivative is the limit of average rates of change: the slope of the secant line as h → 0.',
          points: [
            'Press play: h shrinks and the secant swings into the tangent.',
            'The difference quotient settles on one number. That number is f′(a).',
            'Try negative h. The secant comes in from the left and gives the same limit.',
          ],
          formula: "f'(a)=\\lim_{h\\to 0}\\frac{f(a+h)-f(a)}{h}",
          misconception: 'Average rate of change uses two points. Instantaneous rate of change is the limit as the two points merge into one.',
        },
      },
      {
        slug: 'derivative-grapher',
        title: 'Building f′ from f',
        summary: 'Slide along f and plot each tangent slope to trace out f′.',
        topics: '2.2–2.3',
        component: L(() => import('./units/u2/DerivativeGrapher')),
        talk: {
          big: 'f′ is a new function: its output at x is the slope of f at x.',
          points: [
            'Move the point slowly. Each tangent slope is plotted as a height on the lower graph.',
            'Where f has a flat tangent, f′ crosses zero.',
            'Steep uphill gives large positive f′. Steep downhill gives large negative f′.',
            'Turn on “Leave a trail” to draw f′ point by point, then reveal the true curve.',
          ],
          formula: "f'(x) = \\text{slope of } f \\text{ at } x",
        },
      },
      {
        slug: 'differentiability',
        title: 'Where is f differentiable?',
        summary: 'Zoom in on corners, cusps, vertical tangents and jumps to see local linearity fail.',
        topics: '2.4',
        component: L(() => import('./units/u2/Differentiability')),
        talk: {
          big: 'Differentiable means locally linear: zoom in far enough and the graph becomes a straight line.',
          points: [
            'At a corner, the left and right slopes stay different no matter how far you zoom.',
            'At a cusp, the slopes go to +∞ and −∞.',
            'At a vertical tangent the graph straightens, but the line is vertical, so its slope is undefined.',
            'Differentiable implies continuous. Continuous does NOT imply differentiable (|x| is the example).',
          ],
          formula: "\\lim_{h\\to0^-}\\frac{f(a+h)-f(a)}{h} = \\lim_{h\\to0^+}\\frac{f(a+h)-f(a)}{h}",
          misconception: '“It’s continuous, so it must be differentiable.” No. Corners are continuous.',
        },
      },
      {
        slug: 'product-rule',
        title: 'Product rule as area',
        summary: 'Watch a rectangle with sides f and g grow. Its new area is f′g + fg′.',
        topics: '2.8–2.9',
        component: L(() => import('./units/u2/ProductRule')),
        talk: {
          big: 'When both sides of a rectangle grow, the area gains two strips plus a tiny corner that vanishes.',
          points: [
            'Strip 1 is f·Δg and strip 2 is g·Δf.',
            'The corner Δf·Δg shrinks much faster than the strips, so it disappears in the limit.',
            'This is why (fg)′ is NOT f′g′.',
          ],
          formula: "(fg)' = f'g + fg'",
          misconception: "(fg)' = f'g' is the classic error. The picture makes it obvious that it’s missing the strips.",
        },
      },
    ],
  },
  {
    n: 3,
    title: 'Composite, implicit, and inverse functions',
    story: 'Rates multiply through compositions, and you can still find slopes of curves that aren’t functions.',
    tools: [
      {
        slug: 'chain-rule',
        title: 'Chain rule machine',
        summary: 'Linked number lines show the inner and outer stretch factors multiplying.',
        topics: '3.1',
        component: L(() => import('./units/u3/ChainRule')),
        talk: {
          big: 'A composition stretches twice: first by g′(x), then by f′(g(x)). The total stretch is the product.',
          points: [
            'Nudge x a little. u = g(x) moves g′(x) times as much.',
            'y = f(u) then moves f′(u) times that.',
            'Gear analogy: if gear A turns B 3× and B turns C 2×, then A turns C 6×.',
          ],
          formula: "\\frac{dy}{dx}=\\frac{dy}{du}\\cdot\\frac{du}{dx} = f'(g(x))\\,g'(x)",
          misconception: 'Evaluating f′ at x instead of at g(x). The outer derivative is evaluated at the inside.',
        },
      },
      {
        slug: 'implicit',
        title: 'Implicit curves and tangents',
        summary: 'Slide a tangent line around circles, ellipses and the folium.',
        topics: '3.2',
        component: L(() => import('./units/u3/Implicit')),
        talk: {
          big: 'A curve doesn’t have to be a function to have tangent lines. Implicit differentiation finds their slope.',
          points: [
            'dy/dx depends on both x AND y, because one x can have two points.',
            'Horizontal tangents: set the numerator of dy/dx to 0. Vertical tangents: set the denominator to 0.',
            'Differentiate y terms with the chain rule: d/dx[y²] = 2y·dy/dx.',
          ],
          formula: 'x^2+y^2=r^2 \\Rightarrow \\frac{dy}{dx}=-\\frac{x}{y}',
        },
      },
      {
        slug: 'inverse',
        title: 'Inverse function slopes',
        summary: 'Reflect over y = x and watch the slopes become reciprocals.',
        topics: '3.3–3.4',
        component: L(() => import('./units/u3/Inverse')),
        talk: {
          big: 'Reflecting over y = x swaps rise and run, so the slopes become reciprocals.',
          points: [
            'The point (a, b) on f matches the point (b, a) on f⁻¹.',
            "The slope of f at a is m, so the slope of f⁻¹ at b is 1/m.",
            'This is where the derivatives of ln x and arcsin x come from.',
          ],
          formula: "(f^{-1})'(b) = \\frac{1}{f'(a)},\\quad b=f(a)",
          misconception: "Evaluating f′ at b instead of a. The x-value has to be traced back through the inverse first.",
        },
      },
    ],
  },
  {
    n: 4,
    title: 'Contextual applications of differentiation',
    story: 'The derivative is a rate. Use it to describe motion, connect changing quantities, and approximate values.',
    tools: [
      {
        slug: 'particle-motion',
        title: 'Particle motion',
        summary: 'A particle moves along a line, synced with its x(t), v(t) and a(t) graphs.',
        topics: '4.1–4.3',
        component: L(() => import('./units/u4/ParticleMotion')),
        talk: {
          big: 'Velocity is the derivative of position, and acceleration is the derivative of velocity. Their signs tell the whole story.',
          points: [
            'v > 0: moving right. v < 0: moving left. v = 0 and changes sign: turns around.',
            'Speeding up when v and a have the SAME sign. Slowing down when the signs differ.',
            'Watch the shaded speeding-up and slowing-down bands while the particle moves.',
          ],
          formula: "v(t)=x'(t),\\quad a(t)=v'(t)=x''(t)",
          misconception: 'Negative acceleration does not mean slowing down. If v < 0 too, the particle speeds up.',
        },
      },
      {
        slug: 'related-rates',
        title: 'Related rates',
        summary: 'Animated ladder, cone and ripple scenes with live rates.',
        topics: '4.4–4.5',
        component: L(() => import('./units/u4/RelatedRates')),
        talk: {
          big: 'When quantities are linked by an equation, their rates of change are linked by its derivative.',
          points: [
            '1) Draw and label. 2) Write the equation. 3) Differentiate with respect to t. 4) Substitute.',
            'Substitute numbers only AFTER differentiating. Constants first make the rates disappear.',
            'Ladder: the bottom slides at a constant rate, but the top falls faster and faster.',
          ],
          formula: "x^2+y^2=L^2 \\Rightarrow 2x\\frac{dx}{dt}+2y\\frac{dy}{dt}=0",
          misconception: 'Plugging in the snapshot values before differentiating.',
        },
      },
      {
        slug: 'linearization',
        title: 'Local linearity and approximation',
        summary: 'Use the tangent line to estimate f near a and measure the error.',
        topics: '4.6',
        component: L(() => import('./units/u4/Linearization')),
        talk: {
          big: 'Near x = a, the tangent line is a cheap, accurate stand-in for the curve.',
          points: [
            'The error grows the farther you move from a.',
            'Concave up: the tangent lies below the curve, so the estimate is an UNDERestimate.',
            'Concave down: the tangent lies above the curve, so it’s an OVERestimate.',
          ],
          formula: "L(x)=f(a)+f'(a)(x-a)",
        },
      },
      {
        slug: 'lhopital',
        title: "L'Hôpital's rule",
        summary: 'Zoom in on f/g near a 0/0 point. Both behave like their tangent lines.',
        topics: '4.7',
        component: L(() => import('./units/u4/LHopital')),
        talk: {
          big: 'When f and g both vanish at a, near a they look like lines through zero, and the ratio of two lines is the ratio of their slopes.',
          points: [
            'Zoom in: f ≈ f′(a)(x−a) and g ≈ g′(a)(x−a).',
            'The (x−a) cancels, leaving f′(a)/g′(a).',
            'You must check for 0/0 or ∞/∞ FIRST, and say so on the exam.',
          ],
          formula: "\\lim_{x\\to a}\\frac{f(x)}{g(x)}=\\lim_{x\\to a}\\frac{f'(x)}{g'(x)}",
          misconception: "Using the quotient rule. L'Hôpital differentiates the top and bottom separately.",
        },
      },
    ],
  },
  {
    n: 5,
    title: 'Analytical applications of differentiation',
    story: 'f′ and f″ tell you the shape of f: where it rises and falls, where it bends, and where its extremes are.',
    tools: [
      {
        slug: 'f-fprime-fpp',
        title: 'f, f′, f″ together',
        summary: 'Three synced graphs with a shared cursor and color-coded intervals. The core of Unit 5.',
        topics: '5.3–5.9',
        flagship: true,
        component: L(() => import('./units/u5/ThreeGraphs')),
        talk: {
          big: 'The sign of f′ tells you the direction of f. The sign of f″ tells you how f bends. The zeros of each mark where the behavior changes.',
          points: [
            'f′ > 0 ⇔ f increasing. f′ < 0 ⇔ f decreasing. f′ changes sign ⇒ relative extremum.',
            'f″ > 0 ⇔ f concave up (f′ increasing). f″ changes sign ⇒ point of inflection.',
            'Inflection points of f line up with the extrema of f′.',
            'Use “Hide f” to ask students to sketch f from f′ alone.',
          ],
          formula: "f' > 0 \\Rightarrow f\\nearrow \\qquad f''>0 \\Rightarrow f \\smile",
          misconception: 'f′(c) = 0 does not guarantee an extremum (x³ at 0), and f″(c) = 0 does not guarantee an inflection point (x⁴ at 0). The sign must CHANGE.',
        },
      },
      {
        slug: 'mvt',
        title: 'Mean value theorem',
        summary: 'Find where the tangent is parallel to the secant over [a, b].',
        topics: '5.1',
        component: L(() => import('./units/u5/MVT')),
        talk: {
          big: 'Somewhere along the way, your instantaneous rate equals your average rate.',
          points: [
            'Drag a and b. The points c where the tangent is parallel to the secant light up.',
            'Requirements: continuous on [a, b] and differentiable on (a, b). Try |x| to see it fail.',
            'Story: if you average 60 mph, at some moment the speedometer reads exactly 60.',
          ],
          formula: "f'(c)=\\frac{f(b)-f(a)}{b-a}",
          misconception: 'Mixing up IVT (hits a VALUE) with MVT (hits a SLOPE).',
        },
      },
      {
        slug: 'extrema',
        title: 'Candidates test',
        summary: 'Absolute extrema on [a, b]: check critical points and endpoints.',
        topics: '5.2, 5.5',
        component: L(() => import('./units/u5/Extrema')),
        talk: {
          big: 'On a closed interval, absolute extrema occur at critical points or at endpoints. Check every candidate.',
          points: [
            'Extreme Value Theorem: continuous on [a, b] ⇒ there is an absolute max and an absolute min.',
            'Candidates: endpoints, plus the points where f′ = 0 or f′ is undefined.',
            'Make a table, evaluate f at each candidate, and pick the biggest and smallest.',
          ],
          formula: "\\text{candidates} = \\{a,\\ b\\} \\cup \\{c : f'(c)=0 \\text{ or DNE}\\}",
          misconception: 'Forgetting to test the endpoints.',
        },
      },
      {
        slug: 'optimization',
        title: 'Optimization: the open box',
        summary: 'Cut squares from a sheet, fold up a box, and find the volume peak on V(x).',
        topics: '5.11',
        component: L(() => import('./units/u5/Optimization')),
        talk: {
          big: 'Optimization: write the quantity as a function of one variable, then find where its derivative is 0.',
          points: [
            'Small cuts make a flat box. Big cuts make a narrow tower. The best box is somewhere in between.',
            'The domain matters: 0 < x < W/2.',
            'At the maximum, V′(x) = 0 and the tangent line is flat.',
          ],
          formula: "V(x)=x(L-2x)(W-2x),\\quad V'(x)=0",
        },
      },
    ],
  },
  {
    n: 6,
    title: 'Integration and accumulation of change',
    story: 'Add up a rate to get the total change. The Fundamental Theorem shows that accumulation and differentiation undo each other.',
    tools: [
      {
        slug: 'riemann',
        title: 'Riemann sums',
        summary: 'Left, right, midpoint and trapezoid approximations, with an n slider and the error shown.',
        topics: '6.2–6.3, 6.6',
        component: L(() => import('./units/u6/Riemann')),
        talk: {
          big: 'Slice the area into rectangles, add them up, and take the limit: that limit is the definite integral.',
          points: [
            'Increasing f: the left sum underestimates and the right sum overestimates. Reversed for decreasing f.',
            'Trapezoids overestimate when f is concave up and underestimate when f is concave down.',
            'Slide n up and every method converges to the same number.',
            'Rectangles below the axis count as negative.',
          ],
          formula: '\\int_a^b f(x)\\,dx = \\lim_{n\\to\\infty}\\sum_{i=1}^{n} f(x_i^*)\\,\\Delta x',
        },
      },
      {
        slug: 'accumulation',
        title: 'Accumulation function and FTC',
        summary: 'Sweep area under f and watch F(x) = ∫f get drawn.',
        topics: '6.4–6.5',
        flagship: true,
        component: L(() => import('./units/u6/Accumulation')),
        talk: {
          big: 'The rate at which area accumulates is the height of f, so F′(x) = f(x). This is the Fundamental Theorem.',
          points: [
            'Where f > 0, F increases. Where f < 0, F decreases.',
            'Zeros of f where f changes sign are the extrema of F.',
            'Extrema of f are the inflection points of F.',
            'This is the same picture as f/f′ from Unit 5, one level up.',
          ],
          formula: "F(x)=\\int_a^x f(t)\\,dt \\;\\Rightarrow\\; F'(x)=f(x)",
          misconception: 'Thinking F(x) is “the area”. It is SIGNED area, so it can decrease and go negative.',
        },
      },
      {
        slug: 'antiderivatives',
        title: 'Families of antiderivatives',
        summary: 'Every vertical shift has the same slopes. Pin down C with an initial condition.',
        topics: '6.7–6.10',
        component: L(() => import('./units/u6/Antiderivatives')),
        talk: {
          big: 'An antiderivative is only known up to a vertical shift, because shifting doesn’t change slopes.',
          points: [
            'Every curve in the family has the same tangent slope at any given x.',
            'Drag the initial condition point to choose the one curve you want.',
            'That is why the indefinite integral needs + C.',
          ],
          formula: '\\int f(x)\\,dx = F(x) + C',
        },
      },
    ],
  },
  {
    n: 7,
    title: 'Differential equations',
    story: 'An equation for the slope at every point. Draw the slopes and the solutions appear.',
    tools: [
      {
        slug: 'slope-field',
        title: 'Slope fields',
        summary: 'Click to drop an initial condition and see the solution flow. Compare Euler steps against the exact solution.',
        topics: '7.3–7.6',
        flagship: true,
        component: L(() => import('./units/u7/SlopeField')),
        talk: {
          big: 'A differential equation gives a slope at every point. A solution is a curve that follows those slopes everywhere.',
          points: [
            'If dy/dx depends only on x, the slopes are the same along each vertical column.',
            'If dy/dx depends only on y, the slopes are the same along each horizontal row (autonomous).',
            'Equilibrium solutions are horizontal lines where dy/dx = 0 for every x.',
            'Euler’s method follows the tangent for a step, then recalculates.',
          ],
          formula: '\\frac{dy}{dx}=g(x,y),\\quad y_{n+1}=y_n+h\\,g(x_n,y_n)',
        },
      },
      {
        slug: 'exponential',
        title: 'Exponential models',
        summary: 'dy/dt = ky: growth proportional to size.',
        topics: '7.7–7.8',
        component: L(() => import('./units/u7/Exponential')),
        talk: {
          big: 'When the rate is proportional to the amount, the solution is exponential.',
          points: [
            'dy/dt = ky ⇒ y = y₀e^{kt}. Separate the variables to derive it.',
            'k > 0 gives growth and k < 0 gives decay. Doubling time and half-life depend only on k.',
            'The slope at every point is k times the height.',
          ],
          formula: '\\frac{dy}{dt}=ky \\Rightarrow y=y_0e^{kt}',
        },
      },
    ],
  },
  {
    n: 8,
    title: 'Applications of integration',
    story: 'Average values, areas, and volumes all come from the same idea: slice, approximate, add, take the limit.',
    tools: [
      {
        slug: 'average-value',
        title: 'Average value',
        summary: 'Find the rectangle with the same area as the region under f.',
        topics: '8.1',
        component: L(() => import('./units/u8/AverageValue')),
        talk: {
          big: 'The average value is the height of the rectangle on [a, b] with the same area as the region under f.',
          points: [
            'The pieces above the line fill the gaps below it exactly.',
            'The MVT for integrals: f actually reaches its average value somewhere.',
            'Don’t confuse this with average RATE of change, which is the slope of a secant line.',
          ],
          formula: 'f_{\\text{avg}}=\\frac{1}{b-a}\\int_a^b f(x)\\,dx',
          misconception: 'Mixing up the average value of f with the average rate of change of f.',
        },
      },
      {
        slug: 'area-between',
        title: 'Area between curves',
        summary: 'Slice vertically (dx) or horizontally (dy). The area is top minus bottom.',
        topics: '8.4–8.6',
        component: L(() => import('./units/u8/AreaBetween')),
        talk: {
          big: 'Area = ∫(top − bottom) dx, or ∫(right − left) dy. Pick the slicing direction that keeps the formula to one piece.',
          points: [
            'Find the intersection points first. They are your limits of integration.',
            'If top and bottom swap partway, split the integral.',
            'Some regions are easier with horizontal slices.',
          ],
          formula: 'A=\\int_a^b \\big(f(x)-g(x)\\big)\\,dx',
        },
      },
      {
        slug: 'cross-sections',
        title: 'Volumes by cross sections',
        summary: 'Stack squares, semicircles or triangles on a base region in 3D.',
        topics: '8.7–8.8',
        component: L(() => import('./units/u8/CrossSections')),
        talk: {
          big: 'Volume = ∫ (area of one slice) dx. Each slice is a shape built on the base region’s width.',
          points: [
            'Square of side s: A = s². Semicircle of diameter s: A = πs²/8.',
            'Equilateral triangle of side s: A = (√3/4)s². Isosceles right triangle with leg s: A = s²/2.',
            's is the length of the slice across the base: top − bottom.',
          ],
          formula: 'V=\\int_a^b A(x)\\,dx',
        },
      },
      {
        slug: 'volumes',
        title: 'Solids of revolution',
        summary: 'Spin a region about a horizontal or vertical axis. Disc and washer method in 3D.',
        topics: '8.9–8.12',
        flagship: true,
        component: L(() => import('./units/u8/Volumes')),
        talk: {
          big: 'Spin one thin slice and you get a disc, or a washer if there is a hole. Add up the discs.',
          points: [
            'Disc: V = π∫R² dx. Washer: V = π∫(R² − r²) dx.',
            'R and r are distances from the AXIS. When the axis isn’t y = 0, shift them (e.g. R = 3 − g(x) for y = 3).',
            'Vertical axis (x = h): slice horizontally, so integrate in y. Rewrite the edges as x = …(y), and use y-values as the limits.',
            'Use the progress slider to build the solid one disc at a time.',
          ],
          formula: 'V=\\pi\\int_a^b \\left(R(x)^2-r(x)^2\\right)dx',
          misconception: 'Writing π∫(R − r)² dx. You square each radius first, then subtract. With a vertical axis, a common mistake is keeping dx and x-limits.',
        },
      },
    ],
  },
]

export interface FlatTool extends ToolMeta {
  unit: Unit
  index: number
}

export const allTools: FlatTool[] = units.flatMap((u) => u.tools.map((t) => ({ ...t, unit: u, index: 0 }))).map((t, i) => ({ ...t, index: i }))

export const toolPath = (t: { unit: Unit; slug: string }) => `/unit/${t.unit.n}/${t.slug}`
