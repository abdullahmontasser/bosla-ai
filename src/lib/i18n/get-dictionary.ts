import type { Dictionary } from '@/lib/i18n/types'

const dictionaries: Record<string, () => Promise<Dictionary>> = {
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  ar: () => import('@/dictionaries/ar.json').then((module) => module.default),
}

export function deepMergeFallback(
  canonical: Record<string, unknown>,
  target: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...canonical }
  for (const key of Object.keys(target || {})) {
    const targetVal = target[key]
    const canonicalVal = canonical[key]
    if (
      targetVal &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal) &&
      canonicalVal &&
      typeof canonicalVal === 'object' &&
      !Array.isArray(canonicalVal)
    ) {
      result[key] = deepMergeFallback(
        canonicalVal as Record<string, unknown>,
        targetVal as Record<string, unknown>,
      )
    } else if (targetVal !== undefined) {
      result[key] = targetVal
    }
  }
  return result
}

export async function getDictionary(lang: string): Promise<Dictionary> {
  const enDict = await dictionaries.en()
  if (lang === 'en') return enDict
  const loader = dictionaries[lang]
  if (!loader) return enDict
  const targetDict = await loader()
  return deepMergeFallback(
    enDict as Record<string, unknown>,
    targetDict as Record<string, unknown>,
  ) as unknown as Dictionary
}
