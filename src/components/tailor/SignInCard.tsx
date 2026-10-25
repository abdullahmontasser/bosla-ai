'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Sparkles, AlertCircle, ArrowRight } from 'lucide-react'
import { signInCredentials } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import type { Dictionary } from '@/lib/i18n/types'

export interface SignInCardProps {
  lang: string
  dict: Partial<Dictionary>
  onSuccess?: () => void
}

export function SignInCard({ lang, onSuccess }: SignInCardProps) {
  const router = useRouter()
  const [email, setEmail] = React.useState('demo@careercraft.ai')
  const [password, setPassword] = React.useState('password123')
  const [isPending, setIsPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    try {
      const res = await signInCredentials(email, password)
      if (res.success) {
        onSuccess?.()
        router.refresh()
      } else {
        setError(res.error || 'Invalid credentials')
      }
    } catch {
      setError('An unexpected error occurred during sign in')
    } finally {
      setIsPending(false)
    }
  }

  async function handleQuickDemoSignIn() {
    setIsPending(true)
    setError(null)
    setEmail('demo@careercraft.ai')
    setPassword('password123')

    try {
      const res = await signInCredentials('demo@careercraft.ai', 'password123')
      if (res.success) {
        onSuccess?.()
        router.refresh()
      } else {
        setError(res.error || 'Failed to sign in with demo credentials')
      }
    } catch {
      setError('An unexpected error occurred during demo sign in')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex min-h-[500px] items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md border border-border bg-card shadow-sm">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <Lock className="size-5" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">
            {lang === 'ar' ? 'تسجيل الدخول إلى الاستوديو' : 'Sign In to Tailoring Studio'}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {lang === 'ar'
              ? 'سجّل الدخول بحسابك أو استخدم حساب العرض التجريبي الجاهز للمتابعة.'
              : 'Sign in to access your candidate profiles, BYOK AI models, and real-time studio.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@careercraft.ai"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {lang === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-9 text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-9 gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground mt-1"
            >
              <span>{lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
              <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Button>
          </form>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-[10px] text-muted-foreground">
                {lang === 'ar' ? 'أو الوصول السريع' : 'or quick access'}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleQuickDemoSignIn}
            disabled={isPending}
            className="w-full h-9 gap-2 text-xs font-medium border-primary/30 text-primary hover:bg-primary/5"
          >
            <Sparkles className="size-3.5" />
            <span>
              {lang === 'ar'
                ? 'الدخول المباشر بحساب العرض التجريبي'
                : 'One-Click Demo Account (demo@careercraft.ai)'}
            </span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
