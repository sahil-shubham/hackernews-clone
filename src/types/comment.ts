// Auto-generated by zod-to-ts. Do not edit.
// This file is generated from src/lib/schemas/comment.ts

export type Author = {
    id: string;
    username: string;
};

export type Comment = {
    id: string;
    textContent: string;
    author: {
        id: string;
        username: string;
    };
    createdAt: string | Date;
    points: number;
    voteType?: (("UPVOTE" | "DOWNVOTE") | undefined) | null;
    hasVoted?: (boolean | undefined) | null;
    replies?: Comment[] | undefined;
};
