'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/ui/layout'
import { Heading, ErrorText } from '@/components/ui/typography'
import { Input } from '@/components/ui/Input' // Assuming Input is a Tailwind component
import { Button } from '@/components/ui/Button'
import { User } from '@/lib/authUtils'

interface SubmitPageClientProps {
  user: User;
}

export default function SubmitPageClient({ user }: SubmitPageClientProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [textContent, setTextContent] = useState('')
  const [type, setType] = useState<'LINK' | 'TEXT'>('LINK') // Default to LINK, or make it selectable
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Removed useEffect for redirect, as that's handled by the Server Component wrapper
  // Removed !user check before form, also handled by server component

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
          Authorization: `Bearer ${user.token}`,
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

      {/* Added simple type switcher for demo - can be improved UI-wise */}
      <div className="mb-6 flex justify-center space-x-2">
        <Button 
          variant={type === 'LINK' ? 'default' : 'outline'} 
          onClick={() => setType('LINK')} 
          size="sm"
        >
          Link Post
        </Button>
        <Button 
          variant={type === 'TEXT' ? 'default' : 'outline'} 
          onClick={() => setType('TEXT')} 
          size="sm"
        >
          Text Post
        </Button>
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
                placeholder="Share your thoughts..."
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