// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LiveTailorStream } from './LiveTailorStream'
import type { Dictionary } from '@/lib/i18n/types'

describe('LiveTailorStream (covers: AC-2, AC-5, AC-6, AC-7, AC-8)', () => {
  const dummyDict = {
    tailor: {
      previewPanelTitle: 'Live Tailoring Output',
      previewPanelDesc: 'Real-time AI streamed summary and bullet points.',
      generatingBadge: 'Streaming Live',
      completedBadge: 'Completed & Saved',
      failedBadge: 'Failed',
      copyAll: 'Copy',
      copied: 'Copied',
      errorTitle: 'Generation Error',
      retry: 'Retry Generation',
      streamIdle: 'Your tailored summary will stream live into this panel once you submit.',
      summaryTitle: 'Tailored Professional Summary',
      bulletsTitle: 'Tailored Experience Bullets',
      savedNotice: 'Tailored snapshot saved to database.',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders idle placeholder when no stream text exists and status is IDLE', () => {
    render(
      <LiveTailorStream
        status="IDLE"
        streamText=""
        dict={dummyDict as unknown as Partial<Dictionary>}
      />,
    )

    expect(screen.getByRole('heading', { name: /Live Tailoring Output/i })).toBeDefined()
    expect(screen.getByText(/Your tailored summary will stream live/i)).toBeDefined()
  })

  it('renders streaming live badge during GENERATING status (covers: AC-5)', () => {
    render(
      <LiveTailorStream
        status="GENERATING"
        streamText="### SUMMARY\nArchitecting modern cloud solutions."
        dict={dummyDict as unknown as Partial<Dictionary>}
      />,
    )

    expect(screen.getByText('Streaming Live')).toBeDefined()
    expect(screen.getByText(/Architecting modern cloud solutions/i)).toBeDefined()
    expect(screen.getByText('Waiting for bullet stream...')).toBeDefined()
  })

  it('renders completed badge and parsed bullets when stream completes (covers: AC-6, AC-7)', () => {
    const stream = [
      '### SUMMARY',
      'Senior full stack engineer with cloud expertise.',
      '### BULLETS',
      '- Engineered streaming endpoints with Vercel AI SDK.',
      '- Spearheaded PostgreSQL schema optimization with Prisma.',
    ].join('\n')

    render(
      <LiveTailorStream
        status="COMPLETED"
        streamText={stream}
        dict={dummyDict as unknown as Partial<Dictionary>}
      />,
    )

    expect(screen.getByText('Completed & Saved')).toBeDefined()
    expect(screen.getByText('Senior full stack engineer with cloud expertise.')).toBeDefined()
    expect(screen.getByText('Engineered streaming endpoints with Vercel AI SDK.')).toBeDefined()
    expect(
      screen.getByText('Spearheaded PostgreSQL schema optimization with Prisma.'),
    ).toBeDefined()
    expect(screen.getByText('Tailored snapshot saved to database.')).toBeDefined()
  })

  it('renders error alert with retry button on FAILED status (covers: AC-8)', () => {
    const onRetry = vi.fn()

    render(
      <LiveTailorStream
        status="FAILED"
        streamText=""
        errorMessage="Upstream API key invalid"
        dict={dummyDict as unknown as Partial<Dictionary>}
        onRetry={onRetry}
      />,
    )

    expect(screen.getByText('Failed')).toBeDefined()
    expect(screen.getByText('Generation Error')).toBeDefined()
    expect(screen.getByText('Upstream API key invalid')).toBeDefined()

    const retryBtn = screen.getByRole('button', { name: /Retry Generation/i })
    fireEvent.click(retryBtn)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('copies stream text to clipboard and shows temporary copied indicator', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    })

    render(
      <LiveTailorStream
        status="COMPLETED"
        streamText="Sample tailored resume text"
        dict={dummyDict as unknown as Partial<Dictionary>}
      />,
    )

    const copyBtn = screen.getByRole('button', { name: /Copy/i })
    fireEvent.click(copyBtn)

    expect(writeTextMock).toHaveBeenCalledWith('Sample tailored resume text')
    await waitFor(() => {
      expect(screen.getByText('Copied')).toBeDefined()
    })
  })
})
