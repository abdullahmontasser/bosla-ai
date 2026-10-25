import { describe, it, expect, vi } from 'vitest'
import {
  detectDocumentFormat,
  validateExtractedText,
  extractDocumentText,
  ExtractionError,
  MAX_FILE_SIZE,
} from './extract'

// Mock unpdf and mammoth for unit testing the extraction branch logic
vi.mock('unpdf', () => ({
  extractText: vi.fn(async (buffer: Uint8Array) => {
    // If corrupted file is simulated
    if (buffer[4] === 0xdd) {
      throw new Error('Corrupted PDF header or stream')
    }
    // If the mock payload signifies multi-page overflow
    if (buffer[4] === 0xff) {
      return { totalPages: 12, text: 'Overflow text content' }
    }
    // If empty text is simulated
    if (buffer[4] === 0xee) {
      return { totalPages: 1, text: '   ' }
    }
    return {
      totalPages: 2,
      text: 'Experienced Software Engineer with a passion for bilingual Next.js web applications.',
    }
  }),
}))

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(async ({ buffer }: { buffer: Buffer }) => {
      if (buffer[4] === 0xdd) {
        throw new Error('Malformed docx zip archive')
      }
      if (buffer[4] === 0xff) {
        return { value: 'x'.repeat(55_000) }
      }
      if (buffer[4] === 0xee) {
        return { value: '   ' }
      }
      return {
        value: 'مهندس برمجيات أول بخبرة واسعة في بناء الأنظمة الموزعة والذكاء الاصطناعي.',
      }
    }),
  },
}))

describe('Text Extraction Service (AC-1, AC-2)', () => {
  describe('detectDocumentFormat & Magic Bytes Validation (Security Model)', () => {
    it('detects valid PDF magic bytes %PDF', () => {
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35])
      expect(detectDocumentFormat(pdfBuffer)).toBe('PDF')
    })

    it('detects valid DOCX magic bytes PK\\x03\\x04', () => {
      const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00])
      expect(detectDocumentFormat(docxBuffer)).toBe('DOCX')
    })

    it('rejects spoofed extension with executable or invalid magic bytes', () => {
      const spoofedBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]) // EXE MZ header
      expect(() => detectDocumentFormat(spoofedBuffer)).toThrowError(ExtractionError)
      try {
        detectDocumentFormat(spoofedBuffer)
      } catch (err) {
        expect(err).toBeInstanceOf(ExtractionError)
        expect((err as ExtractionError).code).toBe('INVALID_FORMAT')
      }
    })

    it('rejects files smaller than 4 bytes', () => {
      const tinyBuffer = Buffer.from([0x25, 0x50])
      expect(() => detectDocumentFormat(tinyBuffer)).toThrowError(ExtractionError)
    })
  })

  describe('validateExtractedText (AC-2)', () => {
    it('approves readable English text', () => {
      const text = '  Senior Staff Engineer with 8 years of TypeScript experience.  '
      expect(validateExtractedText(text)).toBe(
        'Senior Staff Engineer with 8 years of TypeScript experience.',
      )
    })

    it('approves readable Arabic text', () => {
      const text = '  مهندس برمجيات متمرس في بناء التطبيقات السحابية  '
      expect(validateExtractedText(text)).toBe('مهندس برمجيات متمرس في بناء التطبيقات السحابية')
    })

    it('rejects empty or whitespace-only text with EXTRACTION_FAILED (scanned PDF)', () => {
      expect(() => validateExtractedText('     \n\n\t  ')).toThrowError(ExtractionError)
      try {
        validateExtractedText('   ')
      } catch (err) {
        expect((err as ExtractionError).code).toBe('EXTRACTION_FAILED')
        expect((err as ExtractionError).message).toContain('scanned image or empty')
      }
    })

    it('rejects text under 20 characters with no alphabetic characters', () => {
      expect(() => validateExtractedText('12345 67890 ---')).toThrowError(ExtractionError)
    })
  })

  describe('extractDocumentText file constraints and format workflows (AC-1, AC-2)', () => {
    it('enforces maximum 10MB file size limit', async () => {
      const oversizedBuffer = Buffer.alloc(MAX_FILE_SIZE + 10)
      await expect(extractDocumentText(oversizedBuffer)).rejects.toThrowError(ExtractionError)
      try {
        await extractDocumentText(oversizedBuffer)
      } catch (err) {
        expect((err as ExtractionError).code).toBe('FILE_TOO_LARGE')
      }
    })

    it('rejects extension mismatch if fileName is provided', async () => {
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x00])
      await expect(extractDocumentText(pdfBuffer, 'resume.docx')).rejects.toThrowError(
        ExtractionError,
      )
    })

    it('extracts valid PDF text and returns pageCount and format', async () => {
      const validPdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x01, 0x02])
      const result = await extractDocumentText(validPdfBuffer, 'cv.pdf')
      expect(result.format).toBe('PDF')
      expect(result.pageCount).toBe(2)
      expect(result.text).toContain('Experienced Software Engineer')
    })

    it('enforces PDF page limit (maximum 10 pages)', async () => {
      const multiPageBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0xff])
      await expect(extractDocumentText(multiPageBuffer, 'large.pdf')).rejects.toThrowError(
        ExtractionError,
      )
      try {
        await extractDocumentText(multiPageBuffer)
      } catch (err) {
        expect((err as ExtractionError).code).toBe('PAGE_LIMIT_EXCEEDED')
      }
    })

    it('rejects scanned/empty PDF text stream with EXTRACTION_FAILED', async () => {
      const emptyPdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0xee])
      await expect(extractDocumentText(emptyPdfBuffer)).rejects.toThrowError(ExtractionError)
      try {
        await extractDocumentText(emptyPdfBuffer)
      } catch (err) {
        expect((err as ExtractionError).code).toBe('EXTRACTION_FAILED')
      }
    })

    it('extracts valid DOCX Arabic text and returns characterCount', async () => {
      const validDocxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x01, 0x02])
      const result = await extractDocumentText(validDocxBuffer, 'resume.docx')
      expect(result.format).toBe('DOCX')
      expect(result.text).toContain('مهندس برمجيات')
      expect(result.characterCount).toBeGreaterThan(20)
    })

    it('enforces DOCX 50,000 character volume limit', async () => {
      const hugeDocxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0xff])
      await expect(extractDocumentText(hugeDocxBuffer)).rejects.toThrowError(ExtractionError)
      try {
        await extractDocumentText(hugeDocxBuffer)
      } catch (err) {
        expect((err as ExtractionError).code).toBe('CHARACTER_LIMIT_EXCEEDED')
      }
    })

    it('wraps unpdf unexpected parsing errors in ExtractionError with EXTRACTION_FAILED (AC-2)', async () => {
      const corruptPdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0xdd])
      await expect(extractDocumentText(corruptPdf)).rejects.toThrowError(ExtractionError)
      try {
        await extractDocumentText(corruptPdf)
      } catch (err) {
        expect(err).toBeInstanceOf(ExtractionError)
        expect((err as ExtractionError).code).toBe('EXTRACTION_FAILED')
        expect((err as ExtractionError).message).toContain('Failed to read PDF structure')
      }
    })

    it('wraps mammoth unexpected parsing errors in ExtractionError with EXTRACTION_FAILED (AC-2)', async () => {
      const corruptDocx = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0xdd])
      await expect(extractDocumentText(corruptDocx)).rejects.toThrowError(ExtractionError)
      try {
        await extractDocumentText(corruptDocx)
      } catch (err) {
        expect(err).toBeInstanceOf(ExtractionError)
        expect((err as ExtractionError).code).toBe('EXTRACTION_FAILED')
        expect((err as ExtractionError).message).toContain('Failed to read Word document')
      }
    })

    it('accepts raw Uint8Array input and parses correctly', async () => {
      const uint8 = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x01, 0x02])
      const result = await extractDocumentText(uint8)
      expect(result.format).toBe('PDF')
      expect(result.text).toContain('Experienced Software Engineer')
    })
  })
})
