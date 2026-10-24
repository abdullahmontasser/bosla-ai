// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChevronRight } from 'lucide-react'
import {
  Button,
  Input,
  Textarea,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  LanguageSwitcher,
  ThemeSwitcher,
  RtlIcon,
} from './index'
import { LOCALE_COOKIE_NAME } from '@/lib/i18n/config'

// Mock next/navigation
const mockPush = vi.fn()
let mockCurrentPathname = '/en/design-system'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockCurrentPathname,
}))

// Mock next-themes
const mockSetTheme = vi.fn()
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
    resolvedTheme: 'light',
  }),
}))

describe('Button component', () => {
  it('renders button with default styling and responds to clicks', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click Me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeDefined()
    expect(button.className).toContain('bg-primary')

    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders different variants correctly', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button').className).toContain('bg-destructive')

    rerender(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button').className).toContain('border-border')

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button').className).toContain('bg-secondary')
  })

  it('honors disabled prop', () => {
    const handleClick = vi.fn()
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    )

    const button = screen.getByRole('button')
    expect(button).toHaveProperty('disabled', true)
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('supports asChild rendering with Slot', () => {
    render(
      <Button asChild>
        <a href="https://example.com/test-link">Anchor Link</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: /anchor link/i })
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe('https://example.com/test-link')
  })
})

describe('Input and Textarea components', () => {
  it('renders Input with text-start and updates value', () => {
    render(<Input placeholder="Enter title" defaultValue="Initial" />)
    const input = screen.getByPlaceholderText('Enter title') as HTMLInputElement
    expect(input.className).toContain('text-start')
    expect(input.value).toBe('Initial')

    fireEvent.change(input, { target: { value: 'Updated' } })
    expect(input.value).toBe('Updated')
  })

  it('renders Textarea with text-start and logical padding', () => {
    render(<Textarea placeholder="Job details" />)
    const textarea = screen.getByPlaceholderText('Job details')
    expect(textarea.className).toContain('text-start')
    expect(textarea.className).toContain('px-3')
    expect(textarea.className).toContain('py-2')
  })
})

describe('Badge component', () => {
  it('renders semantic variants', () => {
    const { container, rerender } = render(<Badge variant="success">Verified</Badge>)
    expect(container.textContent).toBe('Verified')
    expect(container.firstChild).toHaveProperty('className')
    expect((container.firstChild as HTMLElement).className).toContain('bg-success')

    rerender(<Badge variant="destructive">Failed</Badge>)
    expect((container.firstChild as HTMLElement).className).toContain('bg-destructive')
  })
})

describe('Compound Card component', () => {
  it('renders all compound subcomponents with structured content', () => {
    render(
      <Card data-testid="card-root">
        <CardHeader>
          <CardTitle>Profile Summary</CardTitle>
          <CardDescription>Master career profile</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Body content details</p>
        </CardContent>
        <CardFooter>
          <span>Footer note</span>
        </CardFooter>
      </Card>,
    )

    expect(screen.getByText('Profile Summary')).toBeDefined()
    expect(screen.getByText('Master career profile')).toBeDefined()
    expect(screen.getByText('Body content details')).toBeDefined()
    expect(screen.getByText('Footer note')).toBeDefined()
    expect(screen.getByTestId('card-root').className).toContain('bg-card')
  })
})

describe('RtlIcon directional helper', () => {
  it('applies rtl:rotate-180 class for automatic mirroring', () => {
    const { container } = render(<RtlIcon icon={ChevronRight} data-testid="rtl-icon" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeDefined()
    expect(svg?.getAttribute('class')).toContain('rtl:rotate-180')
  })
})

describe('Dialog component', () => {
  it('renders trigger and controlled dialog content with logical footer gap', () => {
    render(
      <Dialog open>
        <DialogTrigger asChild>
          <Button>Open Modal</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tailor Resume</DialogTitle>
            <DialogDescription>Select the target job description</DialogDescription>
          </DialogHeader>
          <p>Dialog body content</p>
          <DialogFooter className="test-footer">
            <Button variant="outline">Cancel</Button>
            <Button>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    )

    expect(screen.getByText('Tailor Resume')).toBeDefined()
    expect(screen.getByText('Select the target job description')).toBeDefined()
    expect(screen.getByText('Dialog body content')).toBeDefined()
    const footer = screen.getByText('Cancel').parentElement
    expect(footer?.className).toContain('sm:gap-2')
  })
})

describe('DropdownMenu component', () => {
  it('renders trigger and controlled content with menu items', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger asChild>
          <Button>Options</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit Profile</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )

    expect(screen.getByText('Options')).toBeDefined()
    expect(screen.getByText('Edit Profile')).toBeDefined()
    expect(screen.getByText('Duplicate')).toBeDefined()
  })
})

describe('LanguageSwitcher component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentPathname = '/en/design-system'
    // Clear cookies
    document.cookie = ''
  })

  it('renders active language and switches locale on selection with cookie persistence', () => {
    render(<LanguageSwitcher currentLang="en" />)
    expect(screen.getByText('English')).toBeDefined()

    // Open dropdown menu
    const trigger = screen.getByLabelText('Switch Language')
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })

    // Select Arabic
    const arOption = screen.getByText('العربية')
    fireEvent.click(arOption)

    // Check cookie was updated
    expect(document.cookie).toContain(`${LOCALE_COOKIE_NAME}=ar`)

    // Check router navigation was invoked
    expect(mockPush).toHaveBeenCalledWith('/ar/design-system')
  })

  it('preserves query parameters and hashes when switching languages', () => {
    // Setup window.location search and hash
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...originalLocation,
        search: '?filter=active&sort=asc',
        hash: '#section-experience',
      },
    })

    render(<LanguageSwitcher currentLang="en" />)
    const trigger = screen.getByLabelText('Switch Language')
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })

    const arOption = screen.getByText('العربية')
    fireEvent.click(arOption)

    expect(mockPush).toHaveBeenCalledWith(
      '/ar/design-system?filter=active&sort=asc#section-experience',
    )
  })
})

describe('ThemeSwitcher component', () => {
  it('renders theme switcher and triggers setTheme on click', () => {
    render(<ThemeSwitcher />)
    const trigger = screen.getByLabelText('Select visual theme')
    expect(trigger).toBeDefined()

    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    const darkOption = screen.getByText('Dark')
    fireEvent.click(darkOption)

    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })
})

describe('Logical CSS invariant audit', () => {
  it('ensures foundation components avoid physical margin/padding classes', () => {
    const { container } = render(
      <div>
        <Button>Test</Button>
        <Input placeholder="test" />
        <Textarea placeholder="test" />
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      </div>,
    )

    const html = container.innerHTML
    // Check that physical directional utilities are absent
    expect(html).not.toMatch(/\b(ml-|mr-|pl-|pr-|left-|right-)\b/)
  })
})
