import { Suspense } from 'react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <Suspense>
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-lg mb-2">Page Not Found</p>
          <p className="text-base mb-4">The page you are looking for does not exist.</p>
          <Link 
            href="/" 
            className="text-primary hover:text-primary-foreground hover:underline transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </Suspense>
  )
}
