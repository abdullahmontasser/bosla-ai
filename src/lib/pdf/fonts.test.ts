import { describe, it, expect } from 'vitest'
import { registerPdfFonts } from './fonts'

describe('PDF Font Registration (covers: AC-6)', () => {
  it('registers Geist Sans and IBM Plex Sans Arabic fonts without throwing', () => {
    expect(() => registerPdfFonts()).not.toThrow()
  })

  it('is idempotent on subsequent calls', () => {
    expect(() => {
      registerPdfFonts()
      registerPdfFonts()
    }).not.toThrow()
  })
})
