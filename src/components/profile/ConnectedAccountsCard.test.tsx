// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConnectedAccountsCard } from './ConnectedAccountsCard'
import * as actions from '@/app/actions/account-linking-actions'

vi.mock('@/app/actions/account-linking-actions', () => ({
  getLinkedAccountsAction: vi.fn(),
  unlinkAccountAction: vi.fn(),
}))

describe('ConnectedAccountsCard (covers: Hardening Item 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders linked status from initialStatus prop', () => {
    const mockStatus = {
      hasPassword: true,
      linkedProviders: ['github'] as ('github' | 'google' | 'linkedin')[],
    }

    render(<ConnectedAccountsCard lang="en" initialStatus={mockStatus} />)

    expect(screen.getByText('Connected accounts')).toBeDefined()
    expect(screen.getByText('Email password')).toBeDefined()
    expect(screen.getByText('GitHub')).toBeDefined()
    expect(screen.getByText('Disconnect')).toBeDefined()
  })

  it('disables disconnect button when account cannot be safely unlinked', () => {
    const mockStatus = {
      hasPassword: false,
      linkedProviders: ['google'] as ('github' | 'google' | 'linkedin')[],
    }

    render(<ConnectedAccountsCard lang="en" initialStatus={mockStatus} />)

    const unlinkBtn = screen.getByRole('button', { name: /disconnect/i })
    expect(unlinkBtn.hasAttribute('disabled')).toBe(true)
  })

  it('triggers unlinkAccountAction when disconnect button is clicked', async () => {
    const mockStatus = {
      hasPassword: true,
      linkedProviders: ['github'] as ('github' | 'google' | 'linkedin')[],
    }
    vi.mocked(actions.unlinkAccountAction).mockResolvedValue({ success: true })
    vi.mocked(actions.getLinkedAccountsAction).mockResolvedValue({
      hasPassword: true,
      linkedProviders: [],
    })

    render(<ConnectedAccountsCard lang="en" initialStatus={mockStatus} />)

    const btn = screen.getByRole('button', { name: /disconnect/i })
    expect(btn.hasAttribute('disabled')).toBe(false)

    fireEvent.click(btn)

    await waitFor(() => {
      expect(actions.unlinkAccountAction).toHaveBeenCalledWith('github')
    })
  })
})
