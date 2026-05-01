import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  createCommunityPost,
  likePost,
  listCommunityPosts,
  unlikePost,
  type CommunityPost,
} from '../lib/community';

function toRelativeTime(value: string): string {
  const now = Date.now();
  const then = new Date(value).getTime();
  const seconds = Math.max(0, Math.floor((now - then) / 1000));

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

const Community: React.FC = () => {
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const user = useSelector((state: RootState) => state.user.currentUser);
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);

  const feedQuery = useQuery({
    queryKey: ['community-posts'],
    queryFn: listCommunityPosts,
  });

  const createPostMutation = useMutation({
    mutationFn: createCommunityPost,
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: likePost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-posts'] }),
  });

  const unlikeMutation = useMutation({
    mutationFn: unlikePost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-posts'] }),
  });

  const posts = useMemo(() => feedQuery.data?.posts ?? [], [feedQuery.data?.posts]);

  const onCreatePost = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated || !body.trim()) return;
    createPostMutation.mutate({ body: body.trim() });
  };

  return (
    <section className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Community Feed</h1>

      <form
        onSubmit={onCreatePost}
        className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 mb-6"
      >
        <div className="text-sm text-gray-500 dark:text-slate-400 mb-3">
          {isAuthenticated ? `Posting as ${user?.name ?? 'Member'}` : 'Log in to create posts'}
        </div>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={500}
          rows={4}
          placeholder="What's happening in your neighborhood today?"
          disabled={!isAuthenticated || createPostMutation.isPending}
          className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-slate-400">{body.length}/500</span>
          <button
            type="submit"
            disabled={!isAuthenticated || createPostMutation.isPending || !body.trim()}
            className="px-4 py-2 rounded-md bg-green-500 text-white text-sm font-semibold disabled:opacity-60"
          >
            {createPostMutation.isPending ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>

      {feedQuery.isLoading && <p className="text-sm text-gray-600 dark:text-slate-300">Loading posts...</p>}
      {feedQuery.isError && <p className="text-sm text-red-600">Failed to load community feed.</p>}

      <div className="space-y-4">
        {posts.map((post: CommunityPost) => (
          <article
            key={post.id}
            className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4"
          >
            <header className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-sm sm:text-base">{post.authorName}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{toRelativeTime(post.createdAt)}</p>
              </div>
            </header>
            <p className="text-sm sm:text-base whitespace-pre-wrap text-gray-800 dark:text-slate-200">{post.body}</p>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => likeMutation.mutate(post.id)}
                disabled={!isAuthenticated || likeMutation.isPending}
                className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 text-sm disabled:opacity-60"
              >
                Like
              </button>
              <button
                type="button"
                onClick={() => unlikeMutation.mutate(post.id)}
                disabled={!isAuthenticated || unlikeMutation.isPending}
                className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 text-sm disabled:opacity-60"
              >
                Unlike
              </button>
              <span className="text-sm text-gray-600 dark:text-slate-300">{post.likes} likes</span>
            </div>
          </article>
        ))}

        {!feedQuery.isLoading && posts.length === 0 && (
          <p className="text-sm text-gray-600 dark:text-slate-300">No posts yet. Be the first one to post.</p>
        )}
      </div>
    </section>
  );
};

export default Community;
