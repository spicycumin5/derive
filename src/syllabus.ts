/**
 * Per-unit prerequisites and the "must understand" idea for every AP Calculus AB CED topic.
 * BC-only topics (6.11–6.13, 7.5, 7.9, 8.13, Units 9–10) are omitted.
 */

export interface Prereq {
  topic: string
  why: string
  /** Set when the prerequisite is an earlier Derive unit; the card links there. */
  unit?: number
}

export interface CedTopic {
  /** CED topic number, e.g. "2.5" */
  id: string
  title: string
  mustKnow: string
  /** Slugs of tools (in the same unit) that cover this topic. */
  tools?: string[]
}

export interface UnitSyllabus {
  prereqs: Prereq[]
  topics: CedTopic[]
  note?: string
}

export const syllabus: Record<number, UnitSyllabus> = {
  1: {
    prereqs: [
      { topic: 'Function notation, domain and range', why: 'Limits ask what f(x) does near a point, so students need to read f(a), spot domain restrictions, and evaluate piecewise rules.' },
      { topic: 'Factoring and rationalizing', why: 'Most 0/0 limits come down to factoring and canceling, or multiplying by a conjugate.' },
      { topic: 'Rational expressions and asymptotes', why: 'Holes, vertical asymptotes and end behavior come straight from the numerator and denominator.' },
      { topic: 'Piecewise functions', why: 'One-sided limits and continuity questions are almost always piecewise.' },
      { topic: 'Unit circle and trig values', why: 'Limits with sin, cos and tan rely on knowing exact values and the trig graphs.' },
      { topic: 'Exponential and log graphs', why: 'End behavior of eˣ and ln x shows up in limits at infinity and infinite limits.' },
    ],
    topics: [
      { id: '1.1', title: 'Introducing calculus: can change occur at an instant?', mustKnow: 'Rates over an interval are easy to compute. An instantaneous rate needs a limit, and that is the reason limits come first.' },
      { id: '1.2', title: 'Defining limits and using limit notation', mustKnow: 'lim f(x) = L means f(x) gets arbitrarily close to L as x approaches a. It says nothing about the value f(a).', tools: ['limit-explorer'] },
      { id: '1.3', title: 'Estimating limit values from graphs', mustKnow: 'Follow the curve toward x = a from each side and read the y-value it approaches. Ignore the dot at x = a.', tools: ['limit-explorer'] },
      { id: '1.4', title: 'Estimating limit values from tables', mustKnow: 'Read the trend as x closes in from both sides. The two sides must head to the same value.', tools: ['limit-explorer'] },
      { id: '1.5', title: 'Determining limits using algebraic properties', mustKnow: 'Limits split over sums, products, quotients (denominator limit ≠ 0) and compositions. If direct substitution gives a real number, that number is the limit for continuous functions.' },
      { id: '1.6', title: 'Determining limits using algebraic manipulation', mustKnow: '0/0 is a signal to simplify, not an answer. Factor, rationalize, or combine fractions, cancel the zero factor, then substitute.', tools: ['limit-explorer'] },
      { id: '1.7', title: 'Selecting procedures for determining limits', mustKnow: 'Always try substitution first. The form you get (number, 0/0, nonzero/0) decides the next step.' },
      { id: '1.8', title: 'Determining limits using the squeeze theorem', mustKnow: 'Trap f between two functions with the same limit at a. The bounds must hold near a, not just at a.', tools: ['squeeze'] },
      { id: '1.9', title: 'Connecting multiple representations of limits', mustKnow: 'Graph, table and formula must give the same limit. Practise moving between them, because AP mixes them in one question.' },
      { id: '1.10', title: 'Exploring types of discontinuities', mustKnow: 'Removable (limit exists), jump (one-sided limits differ), infinite (unbounded). The type comes from the limit, not from the picture alone.', tools: ['discontinuities'] },
      { id: '1.11', title: 'Defining continuity at a point', mustKnow: 'Continuity at a requires all three: f(a) is defined, the limit exists, and they are equal. State all three to justify.', tools: ['discontinuities'] },
      { id: '1.12', title: 'Confirming continuity over an interval', mustKnow: 'Polynomials, exp, sin and cos are continuous everywhere. Rational, log and root functions are continuous on their domains, so check only the trouble points.' },
      { id: '1.13', title: 'Removing discontinuities', mustKnow: 'A removable discontinuity is fixed by defining f(a) as the limit. For a piecewise constant, set the left and right limits equal and solve.', tools: ['discontinuities'] },
      { id: '1.14', title: 'Infinite limits and vertical asymptotes', mustKnow: 'Nonzero ÷ 0 means the function is unbounded there. Test the sign on each side to decide between +∞ and −∞.', tools: ['infinity'] },
      { id: '1.15', title: 'Limits at infinity and horizontal asymptotes', mustKnow: 'Compare the dominant terms of the top and bottom. The fastest-growing term wins, and the left and right ends can differ.', tools: ['infinity'] },
      { id: '1.16', title: 'Working with the intermediate value theorem', mustKnow: 'Continuous on [a, b] and k between f(a) and f(b) guarantees f(c) = k for some c in (a, b). Name both conditions.', tools: ['ivt'] },
    ],
  },
  2: {
    prereqs: [
      { topic: 'Limits and continuity', why: 'The derivative is defined as a limit, and differentiability builds on continuity.', unit: 1 },
      { topic: 'Slope and point-slope form', why: 'Every derivative is a slope, and tangent lines are written as y − y₁ = m(x − x₁).' },
      { topic: 'Exponent rules (negative and fractional)', why: 'The power rule needs 1/x² rewritten as x⁻² and √x as x^(1/2).' },
      { topic: 'Trig identities and values', why: 'Trig derivatives are evaluated at unit-circle angles, and some answers simplify with identities.' },
      { topic: 'Simplifying algebraic fractions', why: 'Difference quotients and quotient-rule answers have to be simplified.' },
    ],
    topics: [
      { id: '2.1', title: 'Defining average and instantaneous rates of change', mustKnow: 'Average rate = [f(b) − f(a)]/(b − a), a secant slope. Instantaneous rate is its limit as the interval shrinks to a point.', tools: ['secant-tangent'] },
      { id: '2.2', title: 'Defining the derivative and using derivative notation', mustKnow: 'f′(a) = lim [f(a+h) − f(a)]/h. Recognize this limit (and the [f(x) − f(a)]/(x − a) form) as a derivative and evaluate it with rules.', tools: ['secant-tangent', 'derivative-grapher'] },
      { id: '2.3', title: 'Estimating derivatives of a function at a point', mustKnow: 'From a table, estimate f′(a) with the secant slope through the closest data points around a. Include units: output units per input unit.', tools: ['derivative-grapher'] },
      { id: '2.4', title: 'Connecting differentiability and continuity', mustKnow: 'Differentiable ⇒ continuous, but not the reverse. Corners, cusps, vertical tangents and discontinuities all break differentiability.', tools: ['differentiability'] },
      { id: '2.5', title: 'Applying the power rule', mustKnow: 'd/dx[xⁿ] = nxⁿ⁻¹ for any real n. Rewrite roots and reciprocals as powers first.' },
      { id: '2.6', title: 'Derivative rules: constant, sum, difference, constant multiple', mustKnow: 'Derivatives go term by term and constants factor out. The derivative of a constant is 0.' },
      { id: '2.7', title: 'Derivatives of cos x, sin x, eˣ and ln x', mustKnow: '(sin x)′ = cos x, (cos x)′ = −sin x, (eˣ)′ = eˣ, (ln x)′ = 1/x. Know them cold, signs included.' },
      { id: '2.8', title: 'The product rule', mustKnow: '(fg)′ = f′g + fg′. The derivative of a product is never just the product of the derivatives.', tools: ['product-rule'] },
      { id: '2.9', title: 'The quotient rule', mustKnow: '(f/g)′ = (f′g − fg′)/g². The order in the numerator matters, so getting it backwards flips the sign.', tools: ['product-rule'] },
      { id: '2.10', title: 'Derivatives of tan x, cot x, sec x and csc x', mustKnow: 'tan → sec², sec → sec·tan, and the "co-" functions get negatives (cot → −csc², csc → −csc·cot). Each one comes from the quotient rule.' },
    ],
  },
  3: {
    prereqs: [
      { topic: 'Basic derivative rules', why: 'Each Unit 3 technique still ends in power, trig, exp and log derivatives.', unit: 2 },
      { topic: 'Composition and decomposition of functions', why: 'The chain rule starts by seeing a function as outer(inner(x)).' },
      { topic: 'Inverse functions', why: 'Students need to swap x and y, read (a, b) ↔ (b, a), and know that f⁻¹ undoes f.' },
      { topic: 'Inverse trig values and domains', why: 'arcsin, arccos and arctan derivatives are evaluated at exact values on restricted domains.' },
      { topic: 'Solving equations for a variable', why: 'Implicit differentiation ends with solving a linear equation for dy/dx.' },
    ],
    topics: [
      { id: '3.1', title: 'The chain rule', mustKnow: 'd/dx f(g(x)) = f′(g(x))·g′(x). Evaluate the outer derivative at the inside, and repeat for every layer.', tools: ['chain-rule'] },
      { id: '3.2', title: 'Implicit differentiation', mustKnow: 'Differentiate both sides with respect to x. Every y-term picks up a dy/dx, and then you solve for dy/dx.', tools: ['implicit'] },
      { id: '3.3', title: 'Differentiating inverse functions', mustKnow: '(f⁻¹)′(b) = 1/f′(a), where f(a) = b. Find a first.', tools: ['inverse'] },
      { id: '3.4', title: 'Differentiating inverse trigonometric functions', mustKnow: 'arcsin → 1/√(1−x²), arccos → −1/√(1−x²), arctan → 1/(1+x²). Multiply by the inside’s derivative (chain rule).', tools: ['inverse'] },
      { id: '3.5', title: 'Selecting procedures for calculating derivatives', mustKnow: 'Read the outermost structure first (sum, product, quotient, composition) and work inward, choosing one rule per layer.' },
      { id: '3.6', title: 'Calculating higher-order derivatives', mustKnow: 'f″ is the derivative of f′. For implicit curves, differentiate dy/dx again and substitute the dy/dx you already found.' },
    ],
  },
  4: {
    prereqs: [
      { topic: 'All derivative rules', why: 'Unit 4 uses derivatives in context, so the computation has to be automatic.', unit: 3 },
      { topic: 'Units and rates', why: 'Every contextual answer needs units (e.g. ft/sec) and a meaning in words.' },
      { topic: 'Geometry formulas', why: 'Related rates uses the Pythagorean theorem, similar triangles, and area/volume of circles, cones and spheres.' },
      { topic: 'Indeterminate forms', why: 'L’Hôpital only applies after you recognize 0/0 or ∞/∞.', unit: 1 },
      { topic: 'Tangent lines', why: 'Linearization is the tangent-line equation used as an estimate.', unit: 2 },
    ],
    topics: [
      { id: '4.1', title: 'Interpreting the meaning of the derivative in context', mustKnow: 'f′(a) is a rate: "at [time/input a], [quantity] is changing at [value] [units] per [unit]." Use all the parts.' },
      { id: '4.2', title: 'Straight-line motion: position, velocity, acceleration', mustKnow: 'v = x′ and a = v′. Direction comes from the sign of v, and speeding up means v and a have the same sign.', tools: ['particle-motion'] },
      { id: '4.3', title: 'Rates of change in applied contexts other than motion', mustKnow: 'The same derivative reasoning works for any quantity: a positive rate means the quantity is increasing, and the units are output per input.', tools: ['particle-motion'] },
      { id: '4.4', title: 'Introduction to related rates', mustKnow: 'If quantities are related by an equation, differentiating it with respect to t relates their rates.', tools: ['related-rates'] },
      { id: '4.5', title: 'Solving related rates problems', mustKnow: 'Write the general equation, differentiate with respect to t, and only then substitute the snapshot values. Use similar triangles to eliminate an extra variable.', tools: ['related-rates'] },
      { id: '4.6', title: 'Approximating values of a function using local linearity and linearization', mustKnow: 'L(x) = f(a) + f′(a)(x − a). Concavity decides over or under: concave up gives an underestimate.', tools: ['linearization'] },
      { id: '4.7', title: 'Using L’Hôpital’s rule for determining limits of indeterminate forms', mustKnow: 'Only for 0/0 or ∞/∞, and you must show that form. Differentiate the top and bottom separately, not with the quotient rule.', tools: ['lhopital'] },
    ],
  },
  5: {
    prereqs: [
      { topic: 'Derivative rules', why: 'Finding critical points means computing and solving f′(x) = 0.', unit: 3 },
      { topic: 'Solving equations and sign charts', why: 'Increasing/decreasing and concavity come from sign charts of f′ and f″.' },
      { topic: 'Continuity and the IVT', why: 'MVT and EVT both need continuity on a closed interval. The IVT logic explains why signs only change at zeros or breaks.', unit: 1 },
      { topic: 'Interval notation', why: 'Answers are given as intervals of increase, decrease and concavity.' },
      { topic: 'Particle motion and context', why: 'Optimization and analysis questions are often set in context.', unit: 4 },
    ],
    topics: [
      { id: '5.1', title: 'Using the mean value theorem', mustKnow: 'Continuous on [a, b] and differentiable on (a, b) ⇒ some c has f′(c) = [f(b) − f(a)]/(b − a). State the hypotheses.', tools: ['mvt'] },
      { id: '5.2', title: 'Extreme value theorem, global vs local extrema, and critical points', mustKnow: 'A critical point is where f′ = 0 or f′ does not exist (in the domain). Continuous on a closed interval guarantees an absolute max and min.', tools: ['extrema'] },
      { id: '5.3', title: 'Determining intervals on which a function is increasing or decreasing', mustKnow: 'f is increasing where f′ > 0 and decreasing where f′ < 0. Find where f′ = 0 or is undefined, then test the sign on each piece.', tools: ['f-fprime-fpp'] },
      { id: '5.4', title: 'Using the first derivative test to determine relative extrema', mustKnow: 'A critical point is a relative max if f′ changes from + to −, and a min if − to +. Justify with the sign change, not with f′ = 0.', tools: ['f-fprime-fpp'] },
      { id: '5.5', title: 'Using the candidates test to determine absolute extrema', mustKnow: 'On [a, b], evaluate f at the endpoints and every critical point. The largest value is the absolute max and the smallest is the absolute min.', tools: ['extrema'] },
      { id: '5.6', title: 'Determining concavity of functions over their domains', mustKnow: 'f″ > 0 means concave up (f′ increasing). f″ < 0 means concave down. An inflection point needs f″ to change sign.', tools: ['f-fprime-fpp'] },
      { id: '5.7', title: 'Using the second derivative test to determine extrema', mustKnow: 'At a point where f′(c) = 0: f″(c) > 0 gives a min, and f″(c) < 0 gives a max. If f″(c) = 0, the test says nothing, so use the first derivative test.', tools: ['f-fprime-fpp'] },
      { id: '5.8', title: 'Sketching graphs of functions and their derivatives', mustKnow: 'Zeros of f′ line up with flat spots on f, and extrema of f′ line up with inflection points of f. Translate one graph’s features into the other’s.', tools: ['f-fprime-fpp'] },
      { id: '5.9', title: 'Connecting a function, its first derivative, and its second derivative', mustKnow: 'Given only a graph of f′, answer questions about f by reading the sign (direction) and slope (concavity) of f′.', tools: ['f-fprime-fpp'] },
      { id: '5.10', title: 'Introduction to optimization problems', mustKnow: 'Optimization = absolute extremum of a function in context. Identify the quantity to maximize or minimize and its domain.', tools: ['optimization'] },
      { id: '5.11', title: 'Solving optimization problems', mustKnow: 'Use the constraint to reduce to one variable, set the derivative to 0, and justify the max or min (candidates test, sign chart, or second derivative).', tools: ['optimization'] },
      { id: '5.12', title: 'Exploring behaviors of implicit relations', mustKnow: 'Use implicit dy/dx: horizontal tangent where the numerator is 0, vertical tangent where the denominator is 0. Check that the point is on the curve.' },
    ],
  },
  6: {
    prereqs: [
      { topic: 'Limits', why: 'The definite integral is defined as a limit of Riemann sums.', unit: 1 },
      { topic: 'Derivative rules, run backwards', why: 'Antidifferentiation is recognizing which function has the given derivative.', unit: 3 },
      { topic: 'Analyzing f from f′', why: 'Accumulation functions repeat the Unit 5 graph analysis one level up.', unit: 5 },
      { topic: 'Area of rectangles and trapezoids', why: 'Riemann sums and trapezoidal sums are built from these shapes.' },
      { topic: 'Summation notation', why: 'Riemann sums are written with Σ, and AP asks students to convert a sum into an integral.' },
    ],
    topics: [
      { id: '6.1', title: 'Exploring accumulations of change', mustKnow: 'Rate × time = amount of change. Area under a rate graph is the net change in the quantity, and area below the axis counts as negative.', tools: ['accumulation'] },
      { id: '6.2', title: 'Approximating areas with Riemann sums', mustKnow: 'Sum (width × height). Left, right and midpoint choose different heights, and uneven intervals in a table give each piece its own width.', tools: ['riemann'] },
      { id: '6.3', title: 'Riemann sums, summation notation, and definite integral notation', mustKnow: 'lim Σ f(xᵢ)Δx = ∫ₐᵇ f(x) dx. Read Δx = (b − a)/n and xᵢ from the sum to recover f, a and b.', tools: ['riemann'] },
      { id: '6.4', title: 'The fundamental theorem of calculus and accumulation functions', mustKnow: 'd/dx ∫ₐˣ f(t) dt = f(x). With an upper limit of g(x), multiply by g′(x).', tools: ['accumulation'] },
      { id: '6.5', title: 'Interpreting the behavior of accumulation functions involving area', mustKnow: 'For F = ∫f: f > 0 means F is increasing, f changing sign gives an extremum of F, and extrema of f give inflection points of F. Values of F come from signed areas.', tools: ['accumulation'] },
      { id: '6.6', title: 'Applying properties of definite integrals', mustKnow: 'Integrals add over adjacent intervals, flip sign when the limits swap, and are linear. Use geometry (triangles, semicircles) to evaluate graphed areas.', tools: ['riemann'] },
      { id: '6.7', title: 'The fundamental theorem of calculus and definite integrals', mustKnow: '∫ₐᵇ f(x) dx = F(b) − F(a) for any antiderivative F. Equivalently, the final amount = initial amount + ∫ rate.', tools: ['accumulation'] },
      { id: '6.8', title: 'Finding antiderivatives and indefinite integrals: basic rules and notation', mustKnow: 'Reverse each derivative rule, with ∫x⁻¹ dx = ln|x| as the special case. Never drop + C.', tools: ['antiderivatives'] },
      { id: '6.9', title: 'Integrating using substitution', mustKnow: 'Choose u so that du (up to a constant) also appears in the integrand. For definite integrals, change the limits to u-values or substitute back.', tools: ['antiderivatives'] },
      { id: '6.10', title: 'Integrating functions using long division and completing the square', mustKnow: 'If the top’s degree is ≥ the bottom’s, divide first. Completing the square turns the denominator into an arctan form.' },
      { id: '6.14', title: 'Selecting techniques for antidifferentiation', mustKnow: 'Rewrite, then try basic rules, then substitution, then algebra (division or completing the square). Check by differentiating the answer.' },
    ],
  },
  7: {
    prereqs: [
      { topic: 'Implicit differentiation', why: 'Verifying solutions and finding d²y/dx² from a DE uses implicit differentiation.', unit: 3 },
      { topic: 'Antiderivatives and u-substitution', why: 'Separation of variables ends with integrating both sides.', unit: 6 },
      { topic: 'Logarithm and exponential algebra', why: 'Solving for y means exponentiating ln|y| = … and handling the constant correctly.' },
      { topic: 'Slope and local linearity', why: 'A slope field is a picture of tangent slopes.', unit: 2 },
    ],
    note: 'Euler’s method (7.5) and logistic models (7.9) are BC-only. The slope-field tool still shows Euler steps as an optional extension.',
    topics: [
      { id: '7.1', title: 'Modeling situations with differential equations', mustKnow: 'Translate the words into an equation for the rate: "proportional to" means "= k ×", and "the rate of change of y" means dy/dt.', tools: ['exponential'] },
      { id: '7.2', title: 'Verifying solutions for differential equations', mustKnow: 'Substitute the proposed y and its derivative into the DE. It is a solution if both sides match for every x.' },
      { id: '7.3', title: 'Sketching slope fields', mustKnow: 'At each grid point, draw a short segment with slope dy/dx evaluated there.', tools: ['slope-field'] },
      { id: '7.4', title: 'Reasoning using slope fields', mustKnow: 'Match a field to a DE using zero slopes, signs, and slopes that stay constant along rows (depends only on y) or columns (depends only on x). A solution curve follows the segments.', tools: ['slope-field'] },
      { id: '7.6', title: 'Finding general solutions using separation of variables', mustKnow: 'Get all the y’s with dy and all the x’s with dx, integrate both sides, and add + C on one side immediately.' },
      { id: '7.7', title: 'Finding particular solutions using initial conditions and separation of variables', mustKnow: 'Solve for C right after integrating (before isolating y) using the initial condition, then solve for y. State any domain restriction.' },
      { id: '7.8', title: 'Exponential models with differential equations', mustKnow: 'dy/dt = ky ⇔ y = y₀e^{kt}. k > 0 means growth and k < 0 means decay. Find k from a second data point.', tools: ['exponential'] },
    ],
  },
  8: {
    prereqs: [
      { topic: 'Definite integrals and the FTC', why: 'Every Unit 8 application is a definite integral set up from a picture or context.', unit: 6 },
      { topic: 'Accumulation and net change', why: 'Position from velocity and "amount at time t" questions are accumulation problems.', unit: 6 },
      { topic: 'Solving for intersection points', why: 'Intersections give the limits of integration for areas and volumes.' },
      { topic: 'Area formulas for squares, semicircles and triangles', why: 'Cross-section volumes use them as A(x).' },
      { topic: 'Writing x as a function of y', why: 'Horizontal slicing (dy) needs each boundary curve written as x = g(y).' },
    ],
    topics: [
      { id: '8.1', title: 'Finding the average value of a function on an interval', mustKnow: 'f_avg = (1/(b − a))∫ₐᵇ f(x) dx. This is different from the average rate of change [f(b) − f(a)]/(b − a).', tools: ['average-value'] },
      { id: '8.2', title: 'Connecting position, velocity, and acceleration using integrals', mustKnow: 'Displacement = ∫v dt, and total distance = ∫|v| dt. Position at t = initial position + ∫ from 0 to t of v.' },
      { id: '8.3', title: 'Using accumulation functions and definite integrals in applied contexts', mustKnow: 'Amount at time t = initial amount + ∫(rate in − rate out). Interpret the integral with units and the time interval.' },
      { id: '8.4', title: 'Area between curves expressed as functions of x', mustKnow: 'A = ∫(top − bottom) dx between the intersection points.', tools: ['area-between'] },
      { id: '8.5', title: 'Area between curves expressed as functions of y', mustKnow: 'A = ∫(right − left) dy, with y-limits. Use this when vertical slicing would need two integrals.', tools: ['area-between'] },
      { id: '8.6', title: 'Area between curves that intersect at more than two points', mustKnow: 'Split the integral at each crossing so that top − bottom stays positive on each piece, or integrate |f − g|.', tools: ['area-between'] },
      { id: '8.7', title: 'Volumes with cross sections: squares and rectangles', mustKnow: 'V = ∫A(x) dx, where the side s is the width of the base at x. A square gives A = s².', tools: ['cross-sections'] },
      { id: '8.8', title: 'Volumes with cross sections: triangles and semicircles', mustKnow: 'Same setup, different area formula: semicircle on diameter s gives πs²/8, and equilateral triangle gives (√3/4)s².', tools: ['cross-sections'] },
      { id: '8.9', title: 'Volume with disc method: revolving around the x- or y-axis', mustKnow: 'V = π∫R² along the axis, where R is the distance from the axis to the curve.', tools: ['volumes'] },
      { id: '8.10', title: 'Volume with disc method: revolving around other axes', mustKnow: 'R is a distance from the axis, so shift it: about y = k, R = |f(x) − k|.', tools: ['volumes'] },
      { id: '8.11', title: 'Volume with washer method: revolving around the x- or y-axis', mustKnow: 'V = π∫(R² − r²). Square the outer and inner radii separately, never (R − r)².', tools: ['volumes'] },
      { id: '8.12', title: 'Volume with washer method: revolving around other axes', mustKnow: 'Measure both R and r from the shifted axis. The farther curve gives R and the nearer curve gives r.', tools: ['volumes'] },
    ],
  },
}
