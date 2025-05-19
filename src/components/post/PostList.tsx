import PostItem from './PostItem';
import type { Post as PostType } from '@/types/post';
import { User } from '@/lib/authUtils';

interface PostListProps {
  posts: PostType[];
  onVote: (postId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => Promise<void>;
  user: User | null;
}

const PostList: React.FC<PostListProps> = ({ posts, onVote, user }) => {

  if (!posts || posts.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No posts to display.</p>;
  }

  return (
    <div>
      {posts.map((post, index) => (
        <PostItem
          key={post.id}
          post={post}
          onVote={onVote}
          user={user}
        />
      ))}
    </div>
  );
};

export default PostList; 