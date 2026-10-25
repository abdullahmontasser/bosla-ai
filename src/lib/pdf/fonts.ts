import { Font } from '@react-pdf/renderer'
import path from 'path'
import fs from 'fs'

let fontsRegistered = false

export function registerPdfFonts() {
  if (fontsRegistered) return

  const geistRegular = path.resolve(
    process.cwd(),
    'node_modules/@fontsource/geist-sans/files/geist-sans-latin-400-normal.woff',
  )
  const geistBold = path.resolve(
    process.cwd(),
    'node_modules/@fontsource/geist-sans/files/geist-sans-latin-700-normal.woff',
  )

  const arabicRegular = path.resolve(
    process.cwd(),
    'node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-400-normal.woff',
  )
  const arabicBold = path.resolve(
    process.cwd(),
    'node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-700-normal.woff',
  )

  if (fs.existsSync(geistRegular) && fs.existsSync(geistBold)) {
    Font.register({
      family: 'GeistSans',
      fonts: [
        { src: geistRegular, fontWeight: 400 },
        { src: geistBold, fontWeight: 700 },
      ],
    })
  }

  if (fs.existsSync(arabicRegular) && fs.existsSync(arabicBold)) {
    Font.register({
      family: 'IBMPlexSansArabic',
      fonts: [
        { src: arabicRegular, fontWeight: 400 },
        { src: arabicBold, fontWeight: 700 },
      ],
    })
  }

  fontsRegistered = true
}
