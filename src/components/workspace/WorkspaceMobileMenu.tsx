'use client'

import { useRef } from 'react'
import { LogOut, Menu, X } from 'lucide-react'
import { WorkspaceNav } from './WorkspaceNav'
import { signOutAction } from '@/app/actions/auth'

interface WorkspaceMobileMenuProps {
  lang: string
  labels: {
    profile?: string
    tailor: string
    resumes: string
    tracker: string
    careerPrep?: string
    providers: string
    menu: string
    signOut: string
  }
}

export function WorkspaceMobileMenu({ lang, labels }: WorkspaceMobileMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const close = () => detailsRef.current?.removeAttribute('open')

  return (
    <details ref={detailsRef} className="group relative md:hidden">
      <summary
        aria-label={labels.menu}
        className="inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-[7px] border border-border bg-card text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden"
      >
        <Menu className="h-4 w-4 group-open:hidden" aria-hidden />
        <X className="hidden h-4 w-4 group-open:block" aria-hidden />
      </summary>

      <div className="absolute end-0 top-full z-50 mt-2 w-[min(17rem,calc(100vw-1.5rem))] rounded-[10px] border border-border bg-popover p-2 shadow-2xl shadow-black/10">
        <WorkspaceNav lang={lang} labels={labels} variant="stack" onNavigate={close} />

        <div className="my-2 h-px bg-border" />

        <button
          type="button"
          onClick={() => {
            close()
            void signOutAction(lang)
          }}
          className="flex min-h-11 w-full items-center gap-2 rounded-[7px] px-3 text-start text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
          {labels.signOut}
        </button>
      </div>
    </details>
  )
}
