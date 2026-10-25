'use client'

import React, { useState, useRef } from 'react'
import { UploadCloud, FileText, AlertCircle, RefreshCw, Loader2, FileUp } from 'lucide-react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
} from '@/components/ui'
import type { ParsedResumePayload } from '@/lib/validations/parsed-resume'

export interface ResumeUploadDropzoneProps {
  lang: string
  dict: Record<string, unknown>
  onParsingSuccess: (data: {
    parsedResumeId: string
    parsedPayload: ParsedResumePayload
    fileName: string
    fileFormat: 'PDF' | 'DOCX'
  }) => void
  onParseAction: (formData: FormData) => Promise<{
    success: boolean
    parsedResumeId?: string
    data?: ParsedResumePayload
    errorCode?: string
    error?: string
  }>
  onRetryAction?: (parsedResumeId: string) => Promise<{
    success: boolean
    data?: ParsedResumePayload
    errorCode?: string
    error?: string
  }>
}

export function ResumeUploadDropzone({
  lang,
  dict,
  onParsingSuccess,
  onParseAction,
  onRetryAction,
}: ResumeUploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStep, setUploadStep] = useState<'idle' | 'extracting' | 'ai'>('idle')
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastParsedResumeId, setLastParsedResumeId] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const r = (dict.resume || {}) as Record<string, string>

  const validateAndSelectFile = (file: File) => {
    setErrorCode(null)
    setErrorMessage(null)

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorCode('FILE_TOO_LARGE')
      setErrorMessage(
        lang === 'ar'
          ? 'حجم الملف يتجاوز الحد الأقصى المسموح به (10 ميجابايت).'
          : 'File size exceeds the 10MB limit. Please upload a smaller file.',
      )
      setSelectedFile(null)
      return
    }

    const lowerName = file.name.toLowerCase()
    const isPdf = lowerName.endsWith('.pdf') || file.type === 'application/pdf'
    const isDocx =
      lowerName.endsWith('.docx') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    if (!isPdf && !isDocx) {
      setErrorCode('INVALID_FORMAT')
      setErrorMessage(
        lang === 'ar'
          ? 'نوع الملف غير مدعوم. يرجى اختيار ملف PDF أو Word (DOCX).'
          : 'Unsupported file format. Please upload a genuine PDF or Word (DOCX) document.',
      )
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0])
    }
  }

  const handleUploadAndParse = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadStep('extracting')
    setErrorCode(null)
    setErrorMessage(null)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      setUploadStep('ai')
      const result = await onParseAction(formData)

      if (result.success && result.data && result.parsedResumeId) {
        const fileFormat = selectedFile.name.toLowerCase().endsWith('.docx') ? 'DOCX' : 'PDF'
        onParsingSuccess({
          parsedResumeId: result.parsedResumeId,
          parsedPayload: result.data,
          fileName: selectedFile.name,
          fileFormat,
        })
      } else {
        if (result.parsedResumeId) {
          setLastParsedResumeId(result.parsedResumeId)
        }
        setErrorCode(result.errorCode || 'EXTRACTION_FAILED')
        setErrorMessage(
          result.error ||
            (lang === 'ar' ? 'حدث خطأ أثناء معالجة المستند.' : 'Failed to process document.'),
        )
      }
    } catch (err) {
      setErrorCode('EXTRACTION_FAILED')
      setErrorMessage(err instanceof Error ? err.message : 'Unexpected upload error.')
    } finally {
      setIsUploading(false)
      setUploadStep('idle')
    }
  }

  const handleRetryAi = async () => {
    if (!lastParsedResumeId || !onRetryAction) return

    setIsRetrying(true)
    setErrorCode(null)
    setErrorMessage(null)

    try {
      const result = await onRetryAction(lastParsedResumeId)
      if (result.success && result.data) {
        const fileFormat = selectedFile?.name.toLowerCase().endsWith('.docx') ? 'DOCX' : 'PDF'
        onParsingSuccess({
          parsedResumeId: lastParsedResumeId,
          parsedPayload: result.data,
          fileName: selectedFile?.name || 'resume',
          fileFormat,
        })
      } else {
        setErrorCode(result.errorCode || 'AI_PROVIDER_ERROR')
        setErrorMessage(result.error || 'Retry attempt failed.')
      }
    } catch (err) {
      setErrorCode('AI_PROVIDER_ERROR')
      setErrorMessage(err instanceof Error ? err.message : 'Retry attempt failed.')
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <Card className="border border-border bg-card shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
              {r.dropzoneTitle || 'Upload Your Resume'}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              {r.dropzoneConstraints || 'PDF up to 10 pages, DOCX up to 50k chars (max 10MB)'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono uppercase tracking-wider">
            PDF · DOCX
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Drag & Drop Canvas */}
        <div
          data-testid="resume-dropzone-box"
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-8 sm:p-12 text-center transition-colors cursor-pointer ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-border/80 hover:border-primary/50 hover:bg-muted/40'
          } ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            data-testid="resume-file-input"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <UploadCloud className="h-6 w-6 text-primary" />
              )}
            </div>

            {isUploading ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {uploadStep === 'ai'
                    ? r.parsingWithAi || 'Parsing candidate details with AI...'
                    : r.uploading || 'Extracting raw document text in memory...'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lang === 'ar'
                    ? 'يتم فحص النص وضمان خصوصية الملف دون تخزينه على السحابة'
                    : 'Discarding file binary after extraction for total privacy'}
                </p>
              </div>
            ) : selectedFile ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <p className="text-xs text-primary font-medium">
                  {lang === 'ar' ? 'اضغط لاختيار ملف مختلف' : 'Click to select a different file'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {r.dropzoneHint || 'Drag & drop your PDF or DOCX file here, or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lang === 'ar'
                    ? 'يدعم استخراج النصوص باللغتين العربية والإنجليزية بدقة تامة'
                    : 'Supports accurate bilingual English and Arabic document extraction'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error / Failure Banner */}
        {errorCode && (
          <div
            data-testid="extraction-error-banner"
            className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-start space-y-2"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <h4 className="text-xs font-semibold text-destructive uppercase tracking-wide">
                  {errorCode === 'EXTRACTION_FAILED'
                    ? r.extractionFailedTitle || 'Text Extraction Failed'
                    : errorCode === 'AI_PROVIDER_ERROR'
                      ? r.aiErrorTitle || 'AI Parsing Failed'
                      : errorCode}
                </h4>
                <p className="text-xs text-destructive/90 leading-relaxed">{errorMessage}</p>

                {errorCode === 'EXTRACTION_FAILED' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.scannedPdfHelp ||
                      'The uploaded file could not be read. Scanned documents or image-only PDFs lack selectable text. Please upload a digital PDF with selectable text or a Word document.'}
                  </p>
                )}
              </div>
            </div>

            {/* AI Error Recovery (Inline Retry) */}
            {errorCode === 'AI_PROVIDER_ERROR' && lastParsedResumeId && onRetryAction && (
              <div className="pt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetryAi}
                  disabled={isRetrying}
                  className="gap-1.5 text-xs h-8 border-destructive/40 text-destructive hover:bg-destructive/10"
                  data-testid="retry-ai-button"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                  <span>
                    {isRetrying
                      ? r.uploading || 'Retrying...'
                      : r.retryAiButton || 'Retry AI Extraction'}
                  </span>
                </Button>
                <span className="text-xs text-muted-foreground">
                  {lang === 'ar'
                    ? 'يتم إعادة المحاولة باستخدام النص المحفوظ دون إعادة رفع الملف'
                    : 'Re-tries with preserved raw text without re-uploading'}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex items-center justify-between border-t border-border/40 px-6 py-4">
        <span className="text-xs text-muted-foreground">
          {selectedFile
            ? `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(0)} KB)`
            : lang === 'ar'
              ? 'لم يتم تحديد أي ملف بعد'
              : 'No file selected yet'}
        </span>

        <Button
          onClick={handleUploadAndParse}
          disabled={!selectedFile || isUploading}
          size="sm"
          className="gap-2 bg-primary text-primary-foreground font-medium"
          data-testid="parse-submit-button"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {uploadStep === 'ai'
                  ? r.parsingWithAi || 'Parsing...'
                  : r.uploading || 'Uploading...'}
              </span>
            </>
          ) : (
            <>
              <FileUp className="h-4 w-4" />
              <span>{lang === 'ar' ? 'بدء التحليل والاستخراج' : 'Start Extraction'}</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
