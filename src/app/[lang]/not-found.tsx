import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md border-border bg-card text-center">
        <CardHeader className="flex flex-col items-center pb-2">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted text-primary">
            <FileQuestion className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">404 - Page Not Found</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
          <p className="text-xs text-muted-foreground font-arabic mt-1">
            الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
          </p>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          <div className="rounded-[6px] border border-border bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
            Error: PAGE_NOT_FOUND (404)
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pt-2">
          <Link href="/">
            <Button variant="default" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              <span>Back to Home / العودة للرئيسية</span>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
