import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { registerPdfFonts } from './fonts'
import { AtsResumeDocument, type AtsPdfData } from './AtsResumeDocument'

/**
 * Ephemerally generates a searchable vector PDF buffer from resume data.
 * Zero files are written to disk.
 */
export async function generateResumePdfBuffer(data: AtsPdfData): Promise<Buffer> {
  // Ensure font definitions are loaded
  registerPdfFonts()

  const element = React.createElement(AtsResumeDocument, { data })
  const buffer = await renderToBuffer(element as unknown as Parameters<typeof renderToBuffer>[0])

  return Buffer.from(buffer)
}
