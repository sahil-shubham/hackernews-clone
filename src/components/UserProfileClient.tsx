/// <reference lib="dom" />
'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PostList from '@/components/post/PostList'; 
import type { Post as PostType } from '@/types/post';
import type { User } from '@/lib/authUtils';
import { Button } from '@/components/ui/Button';

interface ProfileDisplayUser {
  id: string;
  username: string;
}

interface UserProfileClientProps {
  profileUser: ProfileDisplayUser;
  initialPosts: PostType[];
  initialPagination: any;
  currentUser: User | null;
}

const UserProfileClient: React.FC<UserProfileClientProps> = ({
  profileUser,
  initialPosts,
  initialPagination,
  currentUser,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<PostType[]>(initialPosts);
  const [pagination, setPagination] = useState(initialPagination);

  const currentPage = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  useEffect(() => {
    setPagination(initialPagination);
  }, [initialPagination]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/user/${profileUser.username}?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">{profileUser.username}</h1>
      <p className="text-muted-foreground mb-6">Posts by {profileUser.username}:</p>

      <PostList 
        posts={posts} 
        user={currentUser} 
      />

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center space-x-2">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            variant="outline"
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {pagination.totalPages}
          </span>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= pagination.totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserProfileClient; 