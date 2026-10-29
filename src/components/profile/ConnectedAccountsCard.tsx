'use client'

import React, { useState, useTransition } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, KeyRound, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { getLinkedAccountsAction, unlinkAccountAction } from '@/app/actions/account-linking-actions'
import type { LinkedAccountsStatus } from '@/lib/auth/account-linking'

interface ConnectedAccountsCardProps {
  lang: string
  initialStatus: LinkedAccountsStatus
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" r="2" cy="4" />
    </svg>
  )
}

const PROVIDERS = [
  { id: 'google' as const, label: 'Google', icon: GoogleIcon },
  { id: 'github' as const, label: 'GitHub', icon: GitHubIcon },
  { id: 'linkedin' as const, label: 'LinkedIn', icon: LinkedInIcon },
]

export function ConnectedAccountsCard({ lang, initialStatus }: ConnectedAccountsCardProps) {
  const isAr = lang === 'ar'
  const [data, setData] = useState<LinkedAccountsStatus>(initialStatus)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleUnlink = (provider: 'github' | 'google' | 'linkedin') => {
    setActionError(null)
    startTransition(async () => {
      const res = await unlinkAccountAction(provider)
      if (res.success) {
        const refreshed = await getLinkedAccountsAction()
        setData(refreshed)
      } else {
        setActionError(res.error || (isAr ? 'فشل فك ارتباط الحساب' : 'Failed to unlink account'))
      }
    })
  }

  const copy = {
    title: isAr ? 'الحسابات المرتبطة' : 'Connected accounts',
    description: isAr
      ? 'إدارة وسائل تسجيل الدخول والربط بحسابات التواصل المهني'
      : 'Manage your login methods and connected professional identities',
    passwordLabel: isAr ? 'كلمة المرور' : 'Email password',
    passwordActive: isAr ? 'نشطة' : 'Active',
    passwordNone: isAr ? 'غير محددة' : 'Not configured',
    connected: isAr ? 'مرتبط' : 'Connected',
    notConnected: isAr ? 'غير مرتبط' : 'Not connected',
    unlink: isAr ? 'فك الارتباط' : 'Disconnect',
    unlinkDisabledSole: isAr
      ? 'لا يمكن إلغاء وسيلة الدخول الوحيدة'
      : 'Cannot disconnect your sole login method',
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" aria-hidden />
          <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
            {copy.title}
          </CardTitle>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{copy.description}</p>
      </CardHeader>

      <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
        {actionError ? (
          <div className="flex items-center gap-2 rounded-[6px] border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            <span>{actionError}</span>
          </div>
        ) : null}

        <div className="space-y-2.5">
          {/* Password Authentication status */}
          <div className="flex items-center justify-between rounded-[8px] border border-border/60 bg-background/50 p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-muted/60 text-muted-foreground">
                <KeyRound className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{copy.passwordLabel}</p>
                <p className="text-[11px] text-muted-foreground">
                  {data.hasPassword ? copy.passwordActive : copy.passwordNone}
                </p>
              </div>
            </div>

            {data.hasPassword ? (
              <Badge
                variant="outline"
                className="gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2 className="h-3 w-3" aria-hidden />
                <span className="text-[10px]">{copy.passwordActive}</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="border-border text-muted-foreground">
                <span className="text-[10px]">{copy.passwordNone}</span>
              </Badge>
            )}
          </div>

          {/* OAuth Providers */}
          {PROVIDERS.map((item) => {
            const isLinked = data.linkedProviders.includes(item.id)
            const Icon = item.icon
            const canDisconnect = Boolean(
              (data.hasPassword || data.linkedProviders.length > 1) && isLinked,
            )

            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-[8px] border border-border/60 bg-background/50 p-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-muted/60 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {isLinked ? copy.connected : copy.notConnected}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isLinked ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!canDisconnect || isPending}
                      onClick={() => handleUnlink(item.id)}
                      title={!canDisconnect ? copy.unlinkDisabledSole : undefined}
                      className="h-7 px-2.5 text-[11px] text-muted-foreground hover:text-destructive"
                    >
                      {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                      ) : (
                        copy.unlink
                      )}
                    </Button>
                  ) : (
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      <span className="text-[10px]">{copy.notConnected}</span>
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
