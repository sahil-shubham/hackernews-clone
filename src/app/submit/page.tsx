'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import * as Styled from '@/styles/components'

export default function SubmitPage() {
  const router = useRouter()
  const { user, token } = useAuth()

  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [textContent, setTextContent] = useState('')
  const [type, setType] = useState<'LINK' | 'TEXT'>('LINK')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect to login if not authenticated
  if (!user && !isSubmitting) {
    router.push('/login?next=/submit')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title) {
      setError('Title is required')
      return
    }

    if (type === 'LINK' && !url) {
      setError('URL is required for link posts')
      return
    }

    if (type === 'TEXT' && !textContent) {
      setError('Text content is required for text posts')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          url: type === 'LINK' ? url : null,
          textContent: type === 'TEXT' ? textContent : null,
          type
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create post')
      }

      const data = await response.json()

      // Redirect to the post or homepage
      router.push(`/post/${data.id}`)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An error occurred while creating the post')
      }
      setIsSubmitting(false)
    }
  }

  return (
    <Styled.PageContainer>
      <Styled.Heading $level={1}>Submit</Styled.Heading>

      {error && <Styled.ErrorAlert>{error}</Styled.ErrorAlert>}

      <Styled.TypeSelectorContainer>
        <Styled.TypeSelectorGroup role="group">
          <Styled.TypeButton type="button" active={type === 'LINK'} onClick={() => setType('LINK')}>
            Link
          </Styled.TypeButton>
          <Styled.TypeButton type="button" active={type === 'TEXT'} onClick={() => setType('TEXT')}>
            Text
          </Styled.TypeButton>
        </Styled.TypeSelectorGroup>
      </Styled.TypeSelectorContainer>

      <Styled.Card>
        <form onSubmit={handleSubmit}>
          <Styled.FormGroup>
            <Styled.Label htmlFor="title">
              Title <Styled.RequiredMark>*</Styled.RequiredMark>
            </Styled.Label>
            <Styled.Input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Styled.FormGroup>

          {type === 'LINK' ? (
            <Styled.FormGroup>
              <Styled.Label htmlFor="url">
                URL <Styled.RequiredMark>*</Styled.RequiredMark>
              </Styled.Label>
              <Styled.Input type="url" id="url" value={url} onChange={(e) => setUrl(e.target.value)} required />
            </Styled.FormGroup>
          ) : (
            <Styled.FormGroup>
              <Styled.Label htmlFor="textContent">
                Text <Styled.RequiredMark>*</Styled.RequiredMark>
              </Styled.Label>
              <Styled.TextArea
                id="textContent"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={6}
                required
              />
            </Styled.FormGroup>
          )}

          <Styled.Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Styled.Button>
        </form>
      </Styled.Card>
    </Styled.PageContainer>
  )
}
