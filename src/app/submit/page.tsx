'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/hooks/useAuthStore'
import { PageContainer } from '@/components/ui/layout'
import { Heading, ErrorText, Text } from '@/components/ui/typography'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function SubmitPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [textContent, setTextContent] = useState('')
  const [type, setType] = useState<'LINK' | 'TEXT'>('LINK')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !user && !isSubmitting) {
      router.push('/login?next=/submit')
    }
  }, [user, isSubmitting, router])

  if (!user) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Text>Redirecting to login...</Text>
      </PageContainer>
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (type === 'LINK' && !url.trim()) {
      setError('URL is required for link posts')
      return
    }
    if (type === 'LINK' && url.trim()) {
      try {
        new URL(url.trim())
      } catch (_) {
        setError('Invalid URL format')
        return
      }
    }

    if (type === 'TEXT' && !textContent.trim()) {
      setError('Text content is required for text posts')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user!.token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          url: type === 'LINK' ? url.trim() : null,
          textContent: type === 'TEXT' ? textContent.trim() : null,
          type,
        }),
      })

      const responseData = await response.json()
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create post')
      }
      router.push(`/post/${responseData.id}`)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An error occurred while creating the post')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageContainer className="max-w-2xl mx-auto py-8 sm:py-12">
      <Heading as="h1" className="text-2xl sm:text-3xl font-bold text-center mb-8">
        Create Post
      </Heading>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-md mb-6 text-sm">
          <ErrorText>{error}</ErrorText>
        </div>
      )}

      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-md shadow-sm bg-card border border-border" role="group">
          <Button
            type="button"
            variant={type === 'LINK' ? 'default' : 'ghost'}
            onClick={() => setType('LINK')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${type === 'LINK' ? '' : 'hover:bg-muted'}`}
          >
            Link
          </Button>
          <Button
            type="button"
            variant={type === 'TEXT' ? 'default' : 'ghost'}
            onClick={() => setType('TEXT')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md border-l border-border ${type === 'TEXT' ? '' : 'hover:bg-muted'}`}
          >
            Text
          </Button>
        </div>
      </div>

      <div className="bg-card p-6 sm:p-8 rounded-lg shadow-xl border border-border">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
              Title <span className="text-destructive">*</span>
            </label>
            <Input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          {type === 'LINK' ? (
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-foreground mb-1">
                URL <span className="text-destructive">*</span>
              </label>
              <Input type="url" id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" required />
            </div>
          ) : (
            <div>
              <label htmlFor="textContent" className="block text-sm font-medium text-foreground mb-1">
                Text <span className="text-destructive">*</span>
              </label>
              <textarea
                id="textContent"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={8}
                required
                className="w-full p-3 text-sm bg-background border border-input rounded-md shadow-sm focus:ring-2 focus:ring-ring focus:border-ring placeholder-muted-foreground"
                placeholder="Share your thoughts... (optional for link posts, required for text posts)"
              />
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? 'Submitting...' : 'Submit Post'}
          </Button>
        </form>
      </div>
    </PageContainer>
  )
}
