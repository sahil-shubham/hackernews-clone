import { z } from 'zod';
import { voteSchema } from './vote';

// authorSchema is used by both Comment and Post, and is exported here.
// The generator script should create an Author type in src/types/comment.ts from this.
export const authorSchema = z.object({
  id: z.string(),
  username: z.string(),
});

// Pre-define the TS Comment type. This helps TypeScript understand the recursive structure.
export type Comment = {
  id: string;
  textContent: string;
  author: z.infer<typeof authorSchema>;
  createdAt: string | Date;
  points: number;
  voteType?: z.infer<typeof voteSchema>['voteType'] | null;
  hasVoted?: boolean | null;
  replies?: Comment[]; // Array of self - this is what we want
};

// Define the base properties for the comment as a plain object first
const baseCommentProperties = {
  id: z.string(),
  textContent: z.string(),
  author: authorSchema,
  createdAt: z.union([z.string().datetime(), z.date()]),
  points: z.number(),
  voteType: voteSchema.shape.voteType.optional().nullable(),
  hasVoted: z.boolean().optional().nullable(),
};

// Remove the pre-defined 'export type Comment' as it might interfere with zod-to-ts inference
// for the recursive type name.

// Use z.lazy for the entire schema definition to handle recursion,
// and type with z.ZodTypeAny initially.
export const commentSchema: z.ZodSchema<Comment> = z.object(baseCommentProperties)
  .extend({
    replies: z.lazy(() => z.array(commentSchema)).optional(),
  });

// For local use, you would infer the type:
// export type Comment = z.infer<typeof commentSchema>;
// The generator script will create `type Comment = ...` in `src/types` from `commentSchema` export name.

// If using the type within this module, you would use z.infer:
// type InferredCommentType = z.infer<typeof commentSchema>;

// Note: We are no longer exporting `CommentType = z.infer<typeof commentSchema>` from this file,
// as the definitive `Comment` type will be generated into `src/types/comment.ts`. 