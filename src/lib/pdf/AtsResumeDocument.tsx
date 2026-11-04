import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { shapeArabicText } from './arabic-shaping'
import { getResumeTemplate, type ResumeTemplateId } from './templates'

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

export interface AtsPdfCategorizedSkill {
  category: string
  skills: string[]
}

export interface AtsPdfProject {
  title: string
  role?: string | null
  description?: string | null
  technologies?: string[]
}

export interface AtsPdfData {
  language?: 'EN' | 'AR'
  fullName: string
  headline?: string | null
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
  categorizedSkills?: AtsPdfCategorizedSkill[]
  projects?: AtsPdfProject[]
  templateId?: ResumeTemplateId
  accentColor?: string
  fontFamily?: 'sans' | 'serif' | 'mono'
  pageMode?: '1-page' | '2-pages'
  density?: 'compact' | 'balanced' | 'relaxed'
}

export function formatDisplayDate(dateVal?: string | Date | null): string {
  if (!dateVal) return ''
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? '' : dateVal.getFullYear().toString()
  }
  const trimmed = String(dateVal).trim()
  if (!trimmed) return ''

  // If already a clean 4-digit year like "2026"
  if (/^\d{4}$/.test(trimmed)) {
    return trimmed
  }

  // If ISO string (e.g. "2026-01-01T00:00:00.000Z") or leading YYYY-MM
  if (/^\d{4}-\d{2}/.test(trimmed)) {
    const parsed = new Date(trimmed)
    if (!isNaN(parsed.getTime())) {
      return parsed.getFullYear().toString()
    }
    const match = trimmed.match(/^(\d{4})/)
    if (match) return match[1]
  }

  return trimmed
}

const styles = StyleSheet.create({
  page: {
    padding: 34,
    paddingBottom: 38,
    fontSize: 9.5,
    lineHeight: 1.35,
    color: '#111827',
  },
  headerContainer: {
    marginBottom: 9,
    borderBottomWidth: 0.75,
    paddingBottom: 6,
  },
  fullName: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: -0.3,
    lineHeight: 1.25,
    marginBottom: 4,
  },
  headline: {
    fontSize: 8.5,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#4B5563',
    lineHeight: 1.3,
    marginTop: 2,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    fontSize: 8.25,
    color: '#6B7280',
    marginTop: 2,
    gap: 4,
  },
  contactSeparator: {
    marginHorizontal: 3,
    color: '#9CA3AF',
  },
  miniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderBottomWidth: 1,
    paddingBottom: 4,
    marginBottom: 8,
  },
  miniHeaderText: {
    fontSize: 9.5,
    fontWeight: 700,
  },
  miniHeaderSub: {
    fontSize: 8.5,
    color: '#6B7280',
  },
  pageFooter: {
    position: 'absolute',
    bottom: 18,
    left: 34,
    right: 34,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    paddingTop: 4,
  },
  footerText: {
    fontSize: 7.5,
    color: '#9CA3AF',
    fontFamily: 'Courier',
  },
  sectionFirst: {
    marginBottom: 7,
  },
  sectionDivider: {
    borderTopWidth: 0.75,
    paddingTop: 5.5,
    marginTop: 7,
    marginBottom: 7,
  },
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3.5,
  },
  summaryText: {
    fontSize: 8.75,
    lineHeight: 1.4,
    color: '#4B5563',
  },
  categorizedSkillList: {
    marginTop: 1,
  },
  categorizedSkillLine: {
    fontSize: 8.5,
    lineHeight: 1.38,
    marginBottom: 2.5,
  },
  categorizedSkillLabel: {
    fontSize: 8.5,
    fontWeight: 700,
  },
  categorizedSkillItems: {
    fontSize: 8.5,
    color: '#4B5563',
  },
  experienceBlock: {
    marginBottom: 6,
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
    fontSize: 8.5,
    fontWeight: 400,
    color: '#4B5563',
  },
  bulletList: {
    marginTop: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 4,
  },
  bulletRowArabic: {
    flexDirection: 'row-reverse',
    marginBottom: 2,
    paddingRight: 4,
  },
  bulletSymbol: {
    width: 9,
    fontSize: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 1.38,
    color: '#4B5563',
  },
  projectBlock: {
    marginBottom: 6,
  },
  projectHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 1.5,
  },
  projectTitle: {
    fontSize: 9.5,
    fontWeight: 700,
    color: '#111827',
  },
  projectRole: {
    fontSize: 8.5,
    fontWeight: 400,
    color: '#4B5563',
  },
  projectDescription: {
    fontSize: 8.5,
    lineHeight: 1.35,
    color: '#4B5563',
    marginTop: 1,
    marginBottom: 1.5,
  },
  techStackText: {
    fontSize: 8,
    lineHeight: 1.25,
    marginTop: 1,
  },
  educationBlock: {
    marginBottom: 5,
  },
  degreeText: {
    fontSize: 9.5,
    fontWeight: 700,
    color: '#111827',
  },
  institutionText: {
    fontSize: 8.5,
    fontWeight: 400,
    color: '#4B5563',
  },
  skillsText: {
    fontSize: 8.5,
    lineHeight: 1.4,
    color: '#4B5563',
  },
})

export function AtsResumeDocument({ data }: { data: AtsPdfData }) {
  const isArabic = data.language === 'AR'
  const template = getResumeTemplate(data.templateId || 'harvard-classic')

  const effectiveAccentColor = data.accentColor || template.accentColor || '#111827'
  const effectiveBorderColor = data.accentColor
    ? data.accentColor === '#000000' || data.accentColor === '#111827'
      ? '#111827'
      : data.accentColor
    : template.borderColor || '#CBD5E1'

  // Font family resolution: Arabic always shaped with IBMPlexSansArabic; Latin respects serif/mono/sans
  const requestedFont = data.fontFamily || template.fontFamily
  const fontFamily = isArabic
    ? 'IBMPlexSansArabic'
    : requestedFont === 'serif'
      ? 'Times-Roman'
      : requestedFont === 'mono'
        ? 'Courier'
        : 'GeistSans'

  const isCentered = template.layoutType === 'centered'
  const textAlign: 'center' | 'right' | 'left' = isCentered ? 'center' : isArabic ? 'right' : 'left'

  // Dynamic density geometry matching web preview (compact / balanced / relaxed)
  const density = data.density || 'balanced'
  const isCompact = density === 'compact'
  const isRelaxed = density === 'relaxed'

  const paddingScale = isCompact ? 0.72 : isRelaxed ? 1.22 : 1.0
  const effectivePadding = Math.round((template.padding || 34) * paddingScale)
  const baseFontSize = isCompact ? 8.5 : isRelaxed ? 10.5 : 9.5
  const baseLineHeight = isCompact ? 1.25 : isRelaxed ? 1.48 : 1.35
  const fullNameSize = isCompact ? 17 : isRelaxed ? 23 : 20
  const sectionDividerMargin = isCompact ? 4.5 : isRelaxed ? 9.5 : 7
  const sectionDividerPadding = isCompact ? 3.5 : isRelaxed ? 7.5 : 5.5
  const blockMargin = isCompact ? 4 : isRelaxed ? 8.5 : 6
  const bulletMargin = isCompact ? 1.2 : isRelaxed ? 3 : 2
  const headerMargin = isCompact ? 6 : isRelaxed ? 12 : 9
  const headerPadding = isCompact ? 4 : isRelaxed ? 8 : 6

  const dynamicStyles = {
    page: {
      padding: effectivePadding,
      paddingBottom: isCompact ? 24 : isRelaxed ? 40 : 34,
      fontSize: baseFontSize,
      lineHeight: baseLineHeight,
    },
    headerContainer: {
      marginBottom: headerMargin,
      paddingBottom: headerPadding,
    },
    fullName: {
      fontSize: fullNameSize,
    },
    sectionDivider: {
      marginTop: sectionDividerMargin,
      marginBottom: sectionDividerMargin,
      paddingTop: sectionDividerPadding,
    },
    sectionFirst: {
      marginBottom: sectionDividerMargin,
    },
    experienceBlock: {
      marginBottom: blockMargin,
    },
    bulletRow: {
      marginBottom: bulletMargin,
    },
    projectBlock: {
      marginBottom: blockMargin,
    },
    educationBlock: {
      marginBottom: Math.max(2, blockMargin - 1),
    },
    bodyText: {
      fontSize: isCompact ? 8 : isRelaxed ? 9.5 : 8.5,
      lineHeight: baseLineHeight,
    },
  }

  const t = (text: string | null | undefined): string => {
    if (!text) return ''
    return isArabic ? shapeArabicText(text) : text
  }

  // Section titles
  const summaryTitle = isArabic ? t('الملخص المهني') : 'PROFESSIONAL SUMMARY'
  const experienceTitle = isArabic ? t('الخبرات المهنية والإنجازات') : 'PROFESSIONAL EXPERIENCE'
  const priorExperienceTitle = isArabic ? t('الخبرات السابقة') : 'PRIOR PROFESSIONAL ROLES'
  const educationTitle = isArabic ? t('التعليم والمؤهلات') : 'EDUCATION & CREDENTIALS'
  const skillsTitle = isArabic ? t('المهارات التقنية المصنفة') : 'CORE TECHNICAL COMPETENCIES'
  const projectsTitle = isArabic ? t('المشاريع الفنية البارزة') : 'FEATURED TECHNICAL PROJECTS'

  const contactItems: string[] = []
  if (data.email) contactItems.push(data.email)
  if (data.phone) contactItems.push(data.phone)
  if (data.location) contactItems.push(t(data.location))
  if (data.linkedinUrl) contactItems.push(data.linkedinUrl.replace(/^https?:\/\/(www\.)?/, ''))
  if (data.githubUrl) contactItems.push(data.githubUrl.replace(/^https?:\/\/(www\.)?/, ''))
  if (data.websiteUrl) contactItems.push(data.websiteUrl.replace(/^https?:\/\/(www\.)?/, ''))

  const sectionTitleStyle = [styles.sectionTitle, { textAlign, color: effectiveAccentColor }]

  // Render sub-components for sections matching the canvas preview
  const renderSummary = (isFirstSection: boolean = true) =>
    data.summary ? (
      <View
        style={
          isFirstSection
            ? [styles.sectionFirst, dynamicStyles.sectionFirst]
            : [
                styles.sectionDivider,
                dynamicStyles.sectionDivider,
                { borderTopColor: effectiveBorderColor },
              ]
        }
        wrap={false}
      >
        <Text style={sectionTitleStyle}>{summaryTitle}</Text>
        <Text style={[styles.summaryText, dynamicStyles.bodyText, { textAlign }]}>
          {t(data.summary)}
        </Text>
      </View>
    ) : null

  const renderSkills = (isFirstSection: boolean = false) => {
    if (data.categorizedSkills && data.categorizedSkills.length > 0) {
      return (
        <View
          style={
            isFirstSection
              ? [styles.sectionFirst, dynamicStyles.sectionFirst]
              : [
                  styles.sectionDivider,
                  dynamicStyles.sectionDivider,
                  { borderTopColor: effectiveBorderColor },
                ]
          }
          wrap={false}
        >
          <Text style={sectionTitleStyle}>{skillsTitle}</Text>
          <View style={styles.categorizedSkillList}>
            {data.categorizedSkills.map((cat, idx) => (
              <Text
                key={idx}
                style={[
                  styles.categorizedSkillLine,
                  dynamicStyles.bodyText,
                  { textAlign, marginBottom: isCompact ? 1.5 : 2.5 },
                ]}
              >
                <Text style={[styles.categorizedSkillLabel, { color: effectiveAccentColor }]}>
                  {t(cat.category)}:{' '}
                </Text>
                <Text style={styles.categorizedSkillItems}>
                  {cat.skills.map((s) => t(s)).join(' • ')}
                </Text>
              </Text>
            ))}
          </View>
        </View>
      )
    }

    if (data.skills && data.skills.length > 0) {
      return (
        <View
          style={
            isFirstSection
              ? [styles.sectionFirst, dynamicStyles.sectionFirst]
              : [
                  styles.sectionDivider,
                  dynamicStyles.sectionDivider,
                  { borderTopColor: effectiveBorderColor },
                ]
          }
          wrap={false}
        >
          <Text style={sectionTitleStyle}>{skillsTitle}</Text>
          <Text style={[styles.skillsText, dynamicStyles.bodyText, { textAlign }]}>
            {data.skills.map((s) => t(s.name)).join(' • ')}
          </Text>
        </View>
      )
    }

    return null
  }

  const renderExperienceList = (
    experiencesToRender: AtsPdfExperience[],
    titleText: string,
    isFirstSection: boolean = false,
  ) =>
    experiencesToRender && experiencesToRender.length > 0 ? (
      <View
        style={
          isFirstSection
            ? [styles.sectionFirst, dynamicStyles.sectionFirst]
            : [
                styles.sectionDivider,
                dynamicStyles.sectionDivider,
                { borderTopColor: effectiveBorderColor },
              ]
        }
      >
        <Text style={sectionTitleStyle}>{titleText}</Text>
        {experiencesToRender.map((exp, expIdx) => {
          const startYear = formatDisplayDate(exp.startDate)
          const endYear = exp.isCurrent
            ? isArabic
              ? 'حتى الآن'
              : 'Present'
            : formatDisplayDate(exp.endDate)
          const dateRange = [startYear, endYear].filter(Boolean).join(' – ')

          const subtitleItems = [
            exp.companyName ? t(exp.companyName) : null,
            dateRange ? t(dateRange) : null,
          ].filter(Boolean)

          return (
            <View
              key={expIdx}
              style={[styles.experienceBlock, dynamicStyles.experienceBlock]}
              wrap={false}
            >
              <View
                style={[
                  styles.experienceHeaderRow,
                  isArabic ? { flexDirection: 'row-reverse' } : {},
                ]}
              >
                <Text
                  style={[
                    styles.jobTitle,
                    { flex: 1, textAlign, fontSize: isCompact ? 8.5 : isRelaxed ? 10.5 : 9.5 },
                  ]}
                >
                  {t(exp.jobTitle)}
                </Text>
                {subtitleItems.length > 0 && (
                  <Text
                    style={[
                      styles.companyName,
                      dynamicStyles.bodyText,
                      isArabic ? { marginRight: 6 } : { marginLeft: 6 },
                    ]}
                  >
                    {subtitleItems.join(' • ')}
                  </Text>
                )}
              </View>

              <View style={styles.bulletList}>
                {exp.bullets.map((bullet, bIdx) => {
                  const bulletText = bullet.rewritten || bullet.tailored || bullet.original || ''
                  if (!bulletText) return null

                  return (
                    <View
                      key={bIdx}
                      style={[
                        isArabic ? styles.bulletRowArabic : styles.bulletRow,
                        dynamicStyles.bulletRow,
                      ]}
                      wrap={false}
                    >
                      <Text
                        style={[
                          styles.bulletSymbol,
                          { color: effectiveAccentColor, fontWeight: 700 },
                        ]}
                      >
                        •
                      </Text>
                      <Text style={[styles.bulletText, dynamicStyles.bodyText, { textAlign }]}>
                        {t(bulletText)}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )
        })}
      </View>
    ) : null

  const renderProjects = (isFirstSection: boolean = false) =>
    data.projects && data.projects.length > 0 ? (
      <View
        style={
          isFirstSection
            ? [styles.sectionFirst, dynamicStyles.sectionFirst]
            : [
                styles.sectionDivider,
                dynamicStyles.sectionDivider,
                { borderTopColor: effectiveBorderColor },
              ]
        }
      >
        <Text style={sectionTitleStyle}>{projectsTitle}</Text>
        {data.projects.map((proj, pIdx) => {
          const techList = Array.isArray(proj.technologies) ? proj.technologies : []
          return (
            <View key={pIdx} style={[styles.projectBlock, dynamicStyles.projectBlock]} wrap={false}>
              <View
                style={[styles.projectHeaderRow, isArabic ? { flexDirection: 'row-reverse' } : {}]}
              >
                <Text
                  style={[
                    styles.projectTitle,
                    { flex: 1, textAlign, fontSize: isCompact ? 8.5 : isRelaxed ? 10.5 : 9.5 },
                  ]}
                >
                  {t(proj.title)}
                </Text>
                {proj.role && (
                  <Text
                    style={[
                      styles.projectRole,
                      dynamicStyles.bodyText,
                      isArabic ? { marginRight: 6 } : { marginLeft: 6 },
                    ]}
                  >
                    {t(proj.role)}
                  </Text>
                )}
              </View>
              {proj.description && (
                <Text style={[styles.projectDescription, dynamicStyles.bodyText, { textAlign }]}>
                  {t(proj.description)}
                </Text>
              )}
              {techList.length > 0 && (
                <Text
                  style={[
                    styles.techStackText,
                    {
                      textAlign,
                      color: effectiveAccentColor,
                      fontSize: isCompact ? 7.5 : isRelaxed ? 9 : 8,
                    },
                  ]}
                >
                  {t(techList.join(' • '))}
                </Text>
              )}
            </View>
          )
        })}
      </View>
    ) : null

  const renderEducation = (isFirstSection: boolean = false) =>
    data.educations && data.educations.length > 0 ? (
      <View
        style={
          isFirstSection
            ? [styles.sectionFirst, dynamicStyles.sectionFirst]
            : [
                styles.sectionDivider,
                dynamicStyles.sectionDivider,
                { borderTopColor: effectiveBorderColor },
              ]
        }
      >
        <Text style={sectionTitleStyle}>{educationTitle}</Text>
        {data.educations.map((edu, eduIdx) => {
          const formattedYear = formatDisplayDate(edu.endDate || edu.startDate)
          const schoolSubtitle = [
            edu.institution ? t(edu.institution) : null,
            formattedYear ? t(formattedYear) : null,
          ]
            .filter(Boolean)
            .join(' • ')

          return (
            <View
              key={eduIdx}
              style={[styles.educationBlock, dynamicStyles.educationBlock]}
              wrap={false}
            >
              <View
                style={[
                  styles.experienceHeaderRow,
                  isArabic ? { flexDirection: 'row-reverse' } : {},
                ]}
              >
                <Text
                  style={[
                    styles.degreeText,
                    { flex: 1, textAlign, fontSize: isCompact ? 8.5 : isRelaxed ? 10.5 : 9.5 },
                  ]}
                >
                  {t(edu.degree)}
                  {edu.fieldOfStudy ? ` ${isArabic ? 'في' : 'in'} ${t(edu.fieldOfStudy)}` : ''}
                </Text>
                {schoolSubtitle ? (
                  <Text
                    style={[
                      styles.institutionText,
                      dynamicStyles.bodyText,
                      isArabic ? { marginRight: 6 } : { marginLeft: 6 },
                    ]}
                  >
                    {schoolSubtitle}
                  </Text>
                ) : null}
              </View>
            </View>
          )
        })}
      </View>
    ) : null

  const isTwoPages = data.pageMode === '2-pages' && (data.experiences?.length || 0) > 1

  if (isTwoPages) {
    const primaryExperience = data.experiences.slice(0, 1)
    const subsequentExperiences = data.experiences.slice(1)

    return (
      <Document title={`${data.fullName} - Resume`} author={data.fullName}>
        {/* PAGE 1: Header, Summary, Categorized Skills, Primary Tailored Experience */}
        <Page size="LETTER" style={[styles.page, dynamicStyles.page, { fontFamily }]}>
          <View
            style={[
              styles.headerContainer,
              dynamicStyles.headerContainer,
              { borderBottomColor: effectiveBorderColor },
              isCentered ? { alignItems: 'center' } : {},
            ]}
          >
            <Text
              style={[
                styles.fullName,
                dynamicStyles.fullName,
                { textAlign, color: effectiveAccentColor },
              ]}
            >
              {t(data.fullName)}
            </Text>
            {data.headline && (
              <Text style={[styles.headline, { textAlign }]}>{t(data.headline).toUpperCase()}</Text>
            )}
            <View
              style={[
                styles.contactRow,
                isCentered
                  ? { justifyContent: 'center' }
                  : isArabic
                    ? { justifyContent: 'flex-end', flexDirection: 'row-reverse' }
                    : { justifyContent: 'flex-start' },
              ]}
            >
              {contactItems.map((item, index) => (
                <React.Fragment key={index}>
                  <Text>{item}</Text>
                  {index < contactItems.length - 1 && (
                    <Text style={styles.contactSeparator}>•</Text>
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>

          {renderSummary(true)}
          {renderSkills(false)}
          {renderExperienceList(primaryExperience, experienceTitle, false)}

          <View style={styles.pageFooter} fixed>
            <Text style={styles.footerText}>{isArabic ? 'صفحة 1 من 2' : 'Page 1 of 2'}</Text>
          </View>
        </Page>

        {/* PAGE 2: Mini Header, Prior Roles, Featured Projects, Education */}
        <Page size="LETTER" style={[styles.page, dynamicStyles.page, { fontFamily }]}>
          <View
            style={[
              styles.miniHeader,
              { borderBottomColor: effectiveBorderColor },
              isArabic ? { flexDirection: 'row-reverse' } : {},
            ]}
          >
            <Text style={[styles.miniHeaderText, { color: effectiveAccentColor }]}>
              {t(data.fullName)} — {isArabic ? 'الصفحة 2' : 'Page 2'}
            </Text>
            <Text style={styles.miniHeaderSub}>{data.email}</Text>
          </View>

          {subsequentExperiences.length > 0 &&
            renderExperienceList(subsequentExperiences, priorExperienceTitle, true)}

          {renderProjects(subsequentExperiences.length === 0)}
          {renderEducation(false)}

          <View style={styles.pageFooter} fixed>
            <Text style={styles.footerText}>{isArabic ? 'صفحة 2 من 2' : 'Page 2 of 2'}</Text>
          </View>
        </Page>
      </Document>
    )
  }

  // 1-Page / Standard Auto-Flow Mode
  return (
    <Document title={`${data.fullName} - Resume`} author={data.fullName}>
      <Page size="LETTER" style={[styles.page, dynamicStyles.page, { fontFamily }]}>
        {/* Contact Header */}
        <View
          style={[
            styles.headerContainer,
            dynamicStyles.headerContainer,
            { borderBottomColor: effectiveBorderColor },
            isCentered ? { alignItems: 'center' } : {},
          ]}
        >
          <Text
            style={[
              styles.fullName,
              dynamicStyles.fullName,
              { textAlign, color: effectiveAccentColor },
            ]}
          >
            {t(data.fullName)}
          </Text>
          {data.headline && (
            <Text style={[styles.headline, { textAlign }]}>{t(data.headline).toUpperCase()}</Text>
          )}
          <View
            style={[
              styles.contactRow,
              isCentered
                ? { justifyContent: 'center' }
                : isArabic
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

        {/* Section Ordering: Summary -> Skills -> Experience -> Projects -> Education */}
        {renderSummary(true)}
        {renderSkills(false)}
        {renderExperienceList(data.experiences, experienceTitle, false)}
        {renderProjects(false)}
        {renderEducation(false)}

        <View style={styles.pageFooter} fixed>
          <Text style={styles.footerText}>{isArabic ? 'صفحة 1 من 1' : 'Page 1 of 1'}</Text>
        </View>
      </Page>
    </Document>
  )
}
