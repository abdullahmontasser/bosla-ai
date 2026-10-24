import { describe, it, expect } from 'vitest'
import { getDictionary, deepMergeFallback } from './get-dictionary'
import { isSupportedLocale, getDirection, defaultLocale, supportedLocales } from './config'

describe('i18n configuration', () => {
  it('supports en and ar locales', () => {
    expect(supportedLocales).toContain('en')
    expect(supportedLocales).toContain('ar')
    expect(defaultLocale).toBe('en')
  })

  it('validates supported locales accurately', () => {
    expect(isSupportedLocale('en')).toBe(true)
    expect(isSupportedLocale('ar')).toBe(true)
    expect(isSupportedLocale('fr')).toBe(false)
    expect(isSupportedLocale('de')).toBe(false)
    expect(isSupportedLocale('')).toBe(false)
  })

  it('returns correct layout direction for each locale', () => {
    expect(getDirection('ar')).toBe('rtl')
    expect(getDirection('en')).toBe('ltr')
    expect(getDirection('fr')).toBe('ltr')
  })
})

describe('getDictionary and deepMergeFallback', () => {
  it('loads English dictionary with complete string map', async () => {
    const dict = await getDictionary('en')
    expect(dict).toBeDefined()
    expect(dict.common.brand).toBe('CareerCraft AI')
    expect(dict.common.save).toBe('Save')
    expect(dict.designSystem.title).toContain('Design System')
  })

  it('loads Arabic dictionary with Arabic translations', async () => {
    const dict = await getDictionary('ar')
    expect(dict).toBeDefined()
    expect(dict.common.brand).toBe('كارير كرافت AI')
    expect(dict.common.save).toBe('حفظ')
    expect(dict.designSystem.title).toContain('نظام التصميم')
  })

  it('falls back to English when an unsupported language is requested', async () => {
    const dict = await getDictionary('fr')
    expect(dict).toBeDefined()
    expect(dict.common.brand).toBe('CareerCraft AI')
  })

  it('deep merges missing keys from canonical dictionary', () => {
    const canonical = {
      common: {
        brand: 'CareerCraft AI',
        save: 'Save',
        nested: { a: 'A', b: 'B' },
      },
    }
    const target = {
      common: {
        save: 'حفظ',
        nested: { a: 'أ' },
      },
    }

    const merged = deepMergeFallback(canonical, target) as typeof canonical
    expect(merged.common.save).toBe('حفظ')
    expect(merged.common.brand).toBe('CareerCraft AI')
    expect(merged.common.nested.a).toBe('أ')
    expect(merged.common.nested.b).toBe('B')
  })
})
