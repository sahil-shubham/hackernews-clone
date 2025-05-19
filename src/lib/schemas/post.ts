import { z } from 'zod';
import { authorSchema } from './comment'; // Re-use authorSchema
import { voteSchema } from './vote'; // Import for voteType in Post schema

// Schema for creating a new post
export const createPostSchema = z.object({
  title: z.string().min(1).max(300),
  url: z.string().url().optional().nullable(), // .optional().nullable() allows undefined or null
  textContent: z.string().optional().nullable(),
  type: z.enum(['LINK', 'TEXT']),
}).refine(data => {
  if (data.type === 'LINK' && (!data.url || data.url.trim() === '')) {
    return false;
  }
  if (data.type === 'TEXT' && (!data.textContent || data.textContent.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Link posts must include a URL, and text posts must include text content. Both cannot be empty if provided.",
  // You can specify path for more granular errors, e.g., path: ["url"] or ["textContent"]
});

// Schema for a fetched post (potentially with user-specific voting info)
export const postSchema = z.object({
  id: z.string(), // Assuming posts have an ID, common practice
  title: z.string(),
  url: z.string().url().optional().nullable(),
  textContent: z.string().optional().nullable(),
  points: z.number(),
  author: authorSchema,
  createdAt: z.union([z.string().datetime(), z.date()]),
  commentCount: z.number(),
  type: z.enum(['LINK', 'TEXT']), // Added from API response
  voteType: voteSchema.shape.voteType.optional().nullable(), // Added from API response
  hasVoted: z.boolean().optional(), // Added from API response, make it optional as it depends on user context
  // Potentially other fields like `slug`, `tags` etc.
});

// We don't export PostType from here anymore, it will be generated in src/types/post.ts 