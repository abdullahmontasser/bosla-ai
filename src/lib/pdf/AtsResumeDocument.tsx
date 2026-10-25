import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { shapeArabicText } from './arabic-shaping'

export interface AtsPdfExperience {
  companyName: string
  jobTitle: string
  location?: string | null
  startDate?: string | null
  endDate?: string | null
  isCurrent?: boolean
  bullets: Array<{
    original?: string
    rewritten?: string
    tailored?: string
  }>
}

export interface AtsPdfEducation {
  institution: string
  degree: string
  fieldOfStudy?: string | null
  startDate?: string | null
  endDate?: string | null
}

export interface AtsPdfSkill {
  name: string
  category?: string | null
}

export interface AtsPdfData {
  language?: 'EN' | 'AR'
  fullName: string
  email: string
  phone?: string | null
  location?: string | null
  linkedinUrl?: string | null
  githubUrl?: string | null
  websiteUrl?: string | null
  summary?: string | null
  experiences: AtsPdfExperience[]
  educations?: AtsPdfEducation[]
  skills?: AtsPdfSkill[]
}

const styles = StyleSheet.create({
  page: {
    padding: 36, // 0.5 inch margins
    fontSize: 9.5,
    lineHeight: 1.35,
    color: '#111827',
  },
  headerContainer: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
    paddingBottom: 8,
  },
  fullName: {
    fontSize: 18,
    fontWeight: 700,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    fontSize: 8.5,
    color: '#374151',
    gap: 4,
  },
  contactSeparator: {
    marginHorizontal: 3,
    color: '#9CA3AF',
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 0.75,
    borderBottomColor: '#D1D5DB',
    paddingBottom: 2,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#1F2937',
  },
  experienceBlock: {
    marginBottom: 8,
  },
  experienceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 9.5,
    fontWeight: 700,
    color: '#111827',
  },
  companyName: {
    fontSize: 9,
    fontWeight: 700,
    color: '#4B5563',
  },
  dateLocationText: {
    fontSize: 8,
    color: '#6B7280',
  },
  bulletList: {
    marginTop: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 4,
  },
  bulletRowArabic: {
    flexDirection: 'row-reverse',
    marginBottom: 3,
    paddingRight: 4,
  },
  bulletSymbol: {
    width: 10,
    fontSize: 8,
    color: '#4B5563',
  },
  bulletText: {
    flex: 1,
    fontSize: 8.75,
    lineHeight: 1.35,
    color: '#1F2937',
  },
  educationBlock: {
    marginBottom: 6,
  },
  degreeText: {
    fontSize: 9.5,
    fontWeight: 700,
    color: '#111827',
  },
  institutionText: {
    fontSize: 9,
    color: '#4B5563',
  },
  skillsText: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#1F2937',
  },
})

export function AtsResumeDocument({ data }: { data: AtsPdfData }) {
  const isArabic = data.language === 'AR'
  const fontFamily = isArabic ? 'IBMPlexSansArabic' : 'GeistSans'
  const textAlign = isArabic ? 'right' : 'left'

  const t = (text: string | null | undefined): string => {
    if (!text) return ''
    return isArabic ? shapeArabicText(text) : text
  }

  // Section titles
  const summaryTitle = isArabic ? t('الملخص المهني') : 'SUMMARY'
  const experienceTitle = isArabic ? t('الخبرات المهنية') : 'PROFESSIONAL EXPERIENCE'
  const educationTitle = isArabic ? t('التعليم والمؤهلات') : 'EDUCATION'
  const skillsTitle = isArabic ? t('المهارات التقنية') : 'TECHNICAL SKILLS'

  const contactItems: string[] = []
  if (data.email) contactItems.push(data.email)
  if (data.phone) contactItems.push(data.phone)
  if (data.location) contactItems.push(t(data.location))
  if (data.linkedinUrl) contactItems.push(data.linkedinUrl.replace(/^https?:\/\/(www\.)?/, ''))
  if (data.githubUrl) contactItems.push(data.githubUrl.replace(/^https?:\/\/(www\.)?/, ''))
  if (data.websiteUrl) contactItems.push(data.websiteUrl.replace(/^https?:\/\/(www\.)?/, ''))

  return (
    <Document title={`${data.fullName} - Resume`} author={data.fullName}>
      <Page size="LETTER" style={[styles.page, { fontFamily }]}>
        {/* Contact Header */}
        <View style={styles.headerContainer}>
          <Text style={[styles.fullName, { textAlign }]}>{t(data.fullName)}</Text>
          <View
            style={[
              styles.contactRow,
              isArabic
                ? { justifyContent: 'flex-end', flexDirection: 'row-reverse' }
                : { justifyContent: 'flex-start' },
            ]}
          >
            {contactItems.map((item, index) => (
              <React.Fragment key={index}>
                <Text>{item}</Text>
                {index < contactItems.length - 1 && <Text style={styles.contactSeparator}>•</Text>}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Summary Section */}
        {data.summary && (
          <View style={styles.section} wrap={false}>
            <Text style={[styles.sectionTitle, { textAlign }]}>{summaryTitle}</Text>
            <Text style={[styles.summaryText, { textAlign }]}>{t(data.summary)}</Text>
          </View>
        )}

        {/* Experience Section */}
        {data.experiences && data.experiences.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign }]}>{experienceTitle}</Text>
            {data.experiences.map((exp, expIdx) => {
              const dateRange = [
                exp.startDate,
                exp.isCurrent ? (isArabic ? 'حتى الآن' : 'Present') : exp.endDate,
              ]
                .filter(Boolean)
                .join(' – ')

              return (
                <View key={expIdx} style={styles.experienceBlock} wrap={false}>
                  <View
                    style={[
                      styles.experienceHeaderRow,
                      isArabic ? { flexDirection: 'row-reverse' } : {},
                    ]}
                  >
                    <Text style={styles.jobTitle}>{t(exp.jobTitle)}</Text>
                    {dateRange && <Text style={styles.dateLocationText}>{t(dateRange)}</Text>}
                  </View>

                  <View
                    style={[
                      styles.experienceHeaderRow,
                      isArabic ? { flexDirection: 'row-reverse' } : {},
                    ]}
                  >
                    <Text style={styles.companyName}>{t(exp.companyName)}</Text>
                    {exp.location && <Text style={styles.dateLocationText}>{t(exp.location)}</Text>}
                  </View>

                  <View style={styles.bulletList}>
                    {exp.bullets.map((bullet, bIdx) => {
                      const bulletText =
                        bullet.rewritten || bullet.tailored || bullet.original || ''
                      if (!bulletText) return null

                      return (
                        <View
                          key={bIdx}
                          style={isArabic ? styles.bulletRowArabic : styles.bulletRow}
                          wrap={false}
                        >
                          <Text style={styles.bulletSymbol}>•</Text>
                          <Text style={[styles.bulletText, { textAlign }]}>{t(bulletText)}</Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* Education Section */}
        {data.educations && data.educations.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={[styles.sectionTitle, { textAlign }]}>{educationTitle}</Text>
            {data.educations.map((edu, eduIdx) => (
              <View key={eduIdx} style={styles.educationBlock}>
                <View
                  style={[
                    styles.experienceHeaderRow,
                    isArabic ? { flexDirection: 'row-reverse' } : {},
                  ]}
                >
                  <Text style={styles.degreeText}>
                    {t(edu.degree)}
                    {edu.fieldOfStudy ? ` ${isArabic ? 'في' : 'in'} ${t(edu.fieldOfStudy)}` : ''}
                  </Text>
                  {edu.endDate && <Text style={styles.dateLocationText}>{t(edu.endDate)}</Text>}
                </View>
                <Text style={[styles.institutionText, { textAlign }]}>{t(edu.institution)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills Section */}
        {data.skills && data.skills.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={[styles.sectionTitle, { textAlign }]}>{skillsTitle}</Text>
            <Text style={[styles.skillsText, { textAlign }]}>
              {data.skills.map((s) => t(s.name)).join(', ')}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  )
}
