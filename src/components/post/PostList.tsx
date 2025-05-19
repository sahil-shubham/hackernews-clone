import PostItem from './PostItem';
import type { Post as PostType } from '@/types/post';
import { User } from '@/lib/authUtils';

interface PostListProps {
  posts: PostType[];
  user: User | null;
}

const PostList: React.FC<PostListProps> = ({ posts, user }) => {

  if (!posts || posts.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No posts to display.</p>;
  }

  return (
    <div>
      {posts.map((post, index) => (
        <PostItem
          key={post.id}
          post={post}
          user={user}
        />
      ))}
    </div>
  );
};

export default PostList; 