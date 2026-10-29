import { Geist, IBM_Plex_Sans_Arabic, Newsreader, Alexandria, Amiri } from 'next/font/google'

export const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

export const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
})

export const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
})

export const alexandria = Alexandria({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-alexandria',
  display: 'swap',
})

export const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-amiri',
  display: 'swap',
})
