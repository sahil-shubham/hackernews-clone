'use client'

import PostItem from './PostItem';
import type { Post as PostType } from '@/types/post';
import { User } from '@/lib/authUtils';

interface PostListProps {
  posts: PostType[];
  user: User | null;
  onBookmarkChange?: (postId: string, isBookmarked: boolean) => void;
}

const PostList: React.FC<PostListProps> = ({ posts, user, onBookmarkChange }) => {
  if (!posts || posts.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No posts to display.</p>;
  }

  return (
    <div>
      {posts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          user={user}
          isBookmarked={post.isBookmarked || false}
          onBookmarkChange={onBookmarkChange}
        />
      ))}
    </div>
  );
};

export default PostList; 