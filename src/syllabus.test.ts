import { describe, expect, it } from 'vitest'
import { units } from './curriculum'
import { syllabus } from './syllabus'

describe('syllabus', () => {
  it('has prerequisites and topics for every unit', () => {
    for (const u of units) {
      expect(syllabus[u.n]?.prereqs.length, `unit ${u.n} prereqs`).toBeGreaterThan(0)
      expect(syllabus[u.n]?.topics.length, `unit ${u.n} topics`).toBeGreaterThan(0)
    }
  })

  it('links only to tools that exist in the same unit, and every tool is linked', () => {
    for (const u of units) {
      const slugs = new Set(u.tools.map((t) => t.slug))
      const linked = new Set<string>()
      for (const t of syllabus[u.n].topics) {
        for (const s of t.tools ?? []) {
          expect(slugs.has(s), `${t.id} → ${s}`).toBe(true)
          linked.add(s)
        }
      }
      for (const s of slugs) expect(linked.has(s), `tool ${s} not referenced by any topic`).toBe(true)
    }
  })

  it('topic ids belong to their unit and prereq unit links point backwards', () => {
    for (const u of units) {
      for (const t of syllabus[u.n].topics) expect(t.id.startsWith(`${u.n}.`), t.id).toBe(true)
      for (const p of syllabus[u.n].prereqs) if (p.unit) expect(p.unit, p.topic).toBeLessThan(u.n)
    }
  })

  it('every tool has a must-understand line', () => {
    for (const u of units) for (const t of u.tools) expect(t.talk.mustKnow.length, t.slug).toBeGreaterThan(20)
  })
})
