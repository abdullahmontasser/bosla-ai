declare module 'arabic-persian-reshaper' {
  export interface ShaperOptions {
    [key: string]: unknown
  }

  export interface ArabicShaperStatic {
    convertArabic(text: string, options?: ShaperOptions): string
    convertArabicBack(text: string): string
  }

  export interface PersianShaperStatic {
    convertArabic(text: string, options?: ShaperOptions): string
    convertArabicBack(text: string): string
  }

  export const ArabicShaper: ArabicShaperStatic
  export const PersianShaper: PersianShaperStatic

  const defaultExport: {
    ArabicShaper: ArabicShaperStatic
    PersianShaper: PersianShaperStatic
    default?: {
      ArabicShaper: ArabicShaperStatic
      PersianShaper: PersianShaperStatic
    }
  }

  export default defaultExport
}

declare module 'bidi-js' {
  export interface BidiInstance {
    getEmbeddingLevels(text: string, direction?: 'ltr' | 'rtl' | 'auto'): number[]
    getReorderedString(text: string, levels: number[]): string
    getReorderedIndices(text: string, levels: number[]): number[]
  }

  export default function bidiFactory(): BidiInstance
}
