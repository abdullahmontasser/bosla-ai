import { describe, it, expect } from 'vitest'
import { RESUME_TEMPLATES, getResumeTemplate, type ResumeTemplateId } from './templates'

describe('15 ATS-Proven Resume Templates', () => {
  it('contains exactly 15 distinct ATS-proven templates plus aliases', () => {
    expect(RESUME_TEMPLATES.length).toBe(15)
  })

  const expectedIds: ResumeTemplateId[] = [
    'harvard-classic',
    'tech-minimalist',
    'modern-editorial',
    'executive-navy',
    'wall-street-finance',
    'compact-one-page',
    'startup-builder',
    'bilingual-mirror',
    'data-ai-specialist',
    'cybersecurity-ops',
    'product-strategy',
    'consultant-deliverable',
    'engineering-manager',
    'clean-monochrome',
    'hybrid-functional',
  ]

  it.each(expectedIds)('has complete bilingual metadata for template %s', (id) => {
    const template = getResumeTemplate(id)
    expect(template).toBeDefined()
    expect(template.id).toBe(id)
    expect(template.nameEn).toBeTruthy()
    expect(template.nameAr).toBeTruthy()
    expect(template.personaEn).toBeTruthy()
    expect(template.personaAr).toBeTruthy()
    expect(template.traitsEn).toBeTruthy()
    expect(template.traitsAr).toBeTruthy()
    expect(template.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(template.padding).toBeGreaterThan(0)
  })

  it('maps legacy executive-classic to executive-navy seamlessly', () => {
    const template = getResumeTemplate('executive-classic')
    expect(template.id).toBe('executive-navy')
    expect(template.nameEn).toBe('Executive Leadership')
  })

  it('falls back to default template for unknown id', () => {
    // @ts-expect-error testing invalid ID
    const template = getResumeTemplate('unknown-template')
    expect(template.id).toBe('harvard-classic')
  })
})
