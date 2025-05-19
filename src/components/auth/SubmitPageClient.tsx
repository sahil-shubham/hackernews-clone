'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/ui/layout'
import { Heading, ErrorText } from '@/components/ui/typography'
import { Input } from '@/components/ui/Input' // Assuming Input is a Tailwind component
import { Button } from '@/components/ui/Button'
import { createPost } from '@/app/actions/postActions' // Import the server action

export default function SubmitPageClient() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [textContent, setTextContent] = useState('')
  const [type, setType] = useState<'LINK' | 'TEXT'>('LINK') // Default to LINK, or make it selectable
  const [isPending, startTransition] = useTransition()
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

    startTransition(async () => {
      const result = await createPost({
        title: title.trim(),
        url: type === 'LINK' ? url.trim() : null,
        textContent: type === 'TEXT' ? textContent.trim() : null,
        type,
      })

      if (result.success && result.postId) {
        router.push(`/post/${result.postId}`)
      } else {
        setError(result.message || 'An error occurred while creating the post')
      }
    })
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
          disabled={isPending}
        >
          Link Post
        </Button>
        <Button 
          variant={type === 'TEXT' ? 'default' : 'outline'} 
          onClick={() => setType('TEXT')} 
          size="sm"
          disabled={isPending}
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
            <Input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isPending} />
          </div>

          {type === 'LINK' ? (
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-foreground mb-1">
                URL <span className="text-destructive">*</span>
              </label>
              <Input type="url" id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" required disabled={isPending} />
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
                disabled={isPending}
              />
            </div>
          )}

          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? 'Submitting...' : 'Submit Post'}
          </Button>
        </form>
      </div>
    </PageContainer>
  )
} 