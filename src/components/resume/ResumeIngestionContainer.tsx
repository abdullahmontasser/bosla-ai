'use client'

import React, { useState } from 'react'
import { ResumeUploadDropzone } from './ResumeUploadDropzone'
import { ResumeReviewWorkbench } from './ResumeReviewWorkbench'
import {
  parseResumeAction,
  retryParsingAction,
  commitParsedResumeAction,
} from '@/app/actions/resume-actions'
import type { ParsedResumePayload } from '@/lib/validations/parsed-resume'

export interface ResumeIngestionContainerProps {
  lang: string
  dict: Record<string, unknown>
  initialParsedResumeId?: string
  initialParsedPayload?: ParsedResumePayload
  initialFileName?: string
  initialFileFormat?: 'PDF' | 'DOCX'
}

export function ResumeIngestionContainer({
  lang,
  dict,
  initialParsedResumeId,
  initialParsedPayload,
  initialFileName = 'resume.pdf',
  initialFileFormat = 'PDF',
}: ResumeIngestionContainerProps) {
  const [parsedResumeId, setParsedResumeId] = useState<string | null>(initialParsedResumeId || null)
  const [parsedData, setParsedData] = useState<ParsedResumePayload | null>(
    initialParsedPayload || null,
  )
  const [fileName, setFileName] = useState<string>(initialFileName)
  const [fileFormat, setFileFormat] = useState<'PDF' | 'DOCX'>(initialFileFormat)

  const handleParsingSuccess = (result: {
    parsedResumeId: string
    parsedPayload: ParsedResumePayload
    fileName: string
    fileFormat: 'PDF' | 'DOCX'
  }) => {
    setParsedResumeId(result.parsedResumeId)
    setParsedData(result.parsedPayload)
    setFileName(result.fileName)
    setFileFormat(result.fileFormat)
  }

  const handleResetUpload = () => {
    setParsedResumeId(null)
    setParsedData(null)
  }

  return (
    <div className="w-full space-y-6">
      {!parsedData || !parsedResumeId ? (
        <ResumeUploadDropzone
          lang={lang}
          dict={dict}
          onParsingSuccess={handleParsingSuccess}
          onParseAction={parseResumeAction}
          onRetryAction={retryParsingAction}
        />
      ) : (
        <ResumeReviewWorkbench
          lang={lang}
          dict={dict}
          parsedResumeId={parsedResumeId}
          initialData={parsedData}
          fileName={fileName}
          fileFormat={fileFormat}
          onCommitAction={commitParsedResumeAction}
          onResetUpload={handleResetUpload}
        />
      )}
    </div>
  )
}
