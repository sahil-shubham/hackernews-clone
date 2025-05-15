import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ postId: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { postId } = await params;
    
    // Get userId from header if available
    const userId = request.headers.get('x-user-id');
    
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
        votes: userId ? {
          where: {
            userId,
          },
          select: {
            voteType: true,
          },
        } : false,
      },
    });
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Transform post to include the calculated fields
    const userVote = post.votes && post.votes.length > 0 ? post.votes[0] : null;
    
    const transformedPost = {
      id: post.id,
      title: post.title,
      url: post.url,
      textContent: post.textContent,
      type: post.type,
      author: post.author,
      points: post._count.votes,
      commentCount: post._count.comments,
      createdAt: post.createdAt,
      voteType: userVote?.voteType || null,
      hasVoted: Boolean(userVote),
    };
    
    return NextResponse.json(transformedPost);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
} 