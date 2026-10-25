import { extractText } from 'unpdf'
import mammoth from 'mammoth'
import type { DocumentFormat } from '@prisma/client'

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_PDF_PAGES = 10
export const MAX_DOCX_CHARACTERS = 50_000
export const MIN_EXTRACTED_CHARACTERS = 20

export type ExtractionErrorCode =
  | 'INVALID_FORMAT'
  | 'FILE_TOO_LARGE'
  | 'PAGE_LIMIT_EXCEEDED'
  | 'CHARACTER_LIMIT_EXCEEDED'
  | 'EXTRACTION_FAILED'

export class ExtractionError extends Error {
  readonly code: ExtractionErrorCode

  constructor(code: ExtractionErrorCode, message: string) {
    super(message)
    this.name = 'ExtractionError'
    this.code = code
  }
}

export interface ExtractedDocumentResult {
  text: string
  format: DocumentFormat
  pageCount?: number
  characterCount: number
}

/**
 * Validates document magic bytes to guard against extension spoofing.
 */
export function detectDocumentFormat(buffer: Buffer | Uint8Array): DocumentFormat {
  if (!buffer || buffer.length < 4) {
    throw new ExtractionError(
      'INVALID_FORMAT',
      'The uploaded file is empty or corrupted. Please provide a valid PDF or DOCX file.',
    )
  }

  // PDF magic bytes: %PDF (0x25, 0x50, 0x44, 0x46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'PDF'
  }

  // DOCX (ZIP archive) magic bytes: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return 'DOCX'
  }

  throw new ExtractionError(
    'INVALID_FORMAT',
    'Unsupported file format or invalid magic bytes. Only genuine PDF and DOCX files are supported.',
  )
}

/**
 * Inspects extracted text to detect empty or unselectable text streams (e.g. scanned image PDFs).
 */
export function validateExtractedText(text: string): string {
  const trimmed = text.trim()

  // Must have minimum length and contain at least some Arabic or Latin alphabetic characters
  const hasAlphabetChars = /[a-zA-Z\u0600-\u06FF]/.test(trimmed)

  if (trimmed.length < MIN_EXTRACTED_CHARACTERS || !hasAlphabetChars) {
    throw new ExtractionError(
      'EXTRACTION_FAILED',
      'No readable text could be extracted. The document may be a scanned image or empty. Please upload a text selectable version.',
    )
  }

  return trimmed
}

/**
 * In-memory text extraction service for PDF and DOCX files.
 * Discards file binaries after extraction, never storing them on disk.
 */
export async function extractDocumentText(
  fileBuffer: Buffer | Uint8Array,
  fileName?: string,
): Promise<ExtractedDocumentResult> {
  const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer)

  // 1. File size enforcement (AC-1)
  if (buffer.length > MAX_FILE_SIZE) {
    throw new ExtractionError(
      'FILE_TOO_LARGE',
      `File size exceeds the 10MB limit (received ${(buffer.length / (1024 * 1024)).toFixed(1)}MB).`,
    )
  }

  // 2. Magic bytes validation (AC-1, Security Model)
  const format = detectDocumentFormat(buffer)

  // Optional filename check for mismatch
  if (fileName) {
    const lowerName = fileName.toLowerCase()
    if (format === 'PDF' && !lowerName.endsWith('.pdf')) {
      throw new ExtractionError(
        'INVALID_FORMAT',
        'File extension does not match detected PDF content.',
      )
    }
    if (format === 'DOCX' && !lowerName.endsWith('.docx')) {
      throw new ExtractionError(
        'INVALID_FORMAT',
        'File extension does not match detected DOCX content.',
      )
    }
  }

  // 3. In-memory extraction by format (AC-2)
  if (format === 'PDF') {
    try {
      const { text, totalPages } = await extractText(new Uint8Array(buffer), {
        mergePages: true,
      })

      if (totalPages > MAX_PDF_PAGES) {
        throw new ExtractionError(
          'PAGE_LIMIT_EXCEEDED',
          `PDF exceeds the maximum limit of ${MAX_PDF_PAGES} pages (found ${totalPages} pages).`,
        )
      }

      const textString = typeof text === 'string' ? text : String(text || '')
      const validatedText = validateExtractedText(textString)

      return {
        text: validatedText,
        format: 'PDF',
        pageCount: totalPages,
        characterCount: validatedText.length,
      }
    } catch (err) {
      if (err instanceof ExtractionError) {
        throw err
      }
      throw new ExtractionError(
        'EXTRACTION_FAILED',
        'Failed to read PDF structure. The file may be corrupt or encrypted.',
      )
    }
  }

  if (format === 'DOCX') {
    try {
      const result = await mammoth.extractRawText({ buffer })
      const textString = result.value || ''

      if (textString.length > MAX_DOCX_CHARACTERS) {
        throw new ExtractionError(
          'CHARACTER_LIMIT_EXCEEDED',
          `Word document exceeds the 50,000 character volume limit (found ${textString.length} characters).`,
        )
      }

      const validatedText = validateExtractedText(textString)

      return {
        text: validatedText,
        format: 'DOCX',
        characterCount: validatedText.length,
      }
    } catch (err) {
      if (err instanceof ExtractionError) {
        throw err
      }
      throw new ExtractionError(
        'EXTRACTION_FAILED',
        'Failed to read Word document. The file may be corrupt or malformed.',
      )
    }
  }

  throw new ExtractionError('INVALID_FORMAT', 'Unsupported document format.')
}
