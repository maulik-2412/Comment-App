import React, { useState, useEffect } from 'react';
import { Comment } from '../components/Comment';
import { apiService } from '../services/api';
import { Comment as CommentType, User } from '../types';
import { NotificationSystem } from '../components/NotificationSystem';

export default function Home() {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      loadComments();
    } else {
      setShowLogin(true);
    }
  }, []);

  const loadComments = async () => {
    try {
      const response = await apiService.getComments();
      console.log('Loaded comments:', response);
      setComments(response.comments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = isRegister
        ? await apiService.register(email, username, password)
        : await apiService.login(email, password);
      
      setUser(response.user);
      setShowLogin(false);
      loadComments();
    } catch (error) {
      console.error('Auth error:', error);
      alert('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      await apiService.createComment(newComment, replyTo??undefined);
      setNewComment('');
      setReplyTo(null);
      loadComments();
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = (parentId: string) => {
    setReplyTo(parentId);
  };

  const handleLogout = () => {
    apiService.logout();
    setUser(null);
    setComments([]);
    setShowLogin(true);
  };

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {isRegister ? 'Create Account' : 'Sign In'}
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleAuth}>
            <div className="rounded-md shadow-sm -space-y-px">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />
              {isRegister && (
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                />
              )}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : (isRegister ? 'Sign Up' : 'Sign In')}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-indigo-600 hover:text-indigo-500"
              >
                {isRegister ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
  <h1 className="text-2xl font-bold text-gray-900">Comments</h1>
  <div className="flex items-center gap-4">
    <NotificationSystem user={user} />
    <span className="text-gray-700">Welcome, {user?.username}</span>
    <button
      onClick={handleLogout}
      className="text-red-500 hover:text-red-700"
    >
      Logout
    </button>
  </div>
</div>

          <form onSubmit={handleSubmitComment} className="mb-6">
            {replyTo && (
              <div className="mb-2 p-2 bg-gray-100 rounded-md">
                <span className="text-sm text-gray-600">Replying to comment</span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  Cancel
                </button>
              </div>
            )}
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-3 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              required
            />
            <button
              type="submit"
              disabled={isLoading || !newComment.trim()}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                onUpdate={loadComments}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}