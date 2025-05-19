import PostItem from './PostItem';
import type { Post as PostType } from '@/types/post';

interface PostListProps {
  posts: PostType[];
  onVote: (postId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => Promise<void>;
}

const PostList: React.FC<PostListProps> = ({ posts, onVote }) => {

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
        />
      ))}
    </div>
  );
};

export default PostList; 