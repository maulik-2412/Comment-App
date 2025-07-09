import React, { useState, useEffect } from 'react';
import { Comment as CommentType } from '../types';
import { apiService } from '../services/api';

interface CommentProps {
  comment: CommentType;
  onReply: (parentId: string) => void;
  onUpdate: () => void;
}

export const Comment: React.FC<CommentProps> = ({ comment, onReply, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [editTimeLeft, setEditTimeLeft] = useState<number | null>(null);

  

  // Calculate time left for restoration
  useEffect(() => {
    if (comment.isDeleted && comment.deletedAt && comment.canRestore) {
      const updateTimeLeft = () => {
        const deletedAt = new Date(comment.deletedAt);
        const fifteenMinutesLater = new Date(deletedAt.getTime() + 15 * 60 * 1000);
        const now = new Date();
        const remaining = fifteenMinutesLater.getTime() - now.getTime();
        
        if (remaining > 0) {
          setTimeLeft(Math.floor(remaining / 1000));
        } else {
          setTimeLeft(null);
          onUpdate(); // Refresh to remove restore option
        }
      };

      updateTimeLeft();
      const interval = setInterval(updateTimeLeft, 1000);
      return () => clearInterval(interval);
    }
  }, [comment.isDeleted, comment.deletedAt, comment.canRestore, onUpdate]);

  // Calculate time left for editing (15 minutes from creation)
  useEffect(() => {
    if (!comment.isDeleted && comment.canEdit) {
      const updateEditTimeLeft = () => {
        const createdAt = new Date(comment.createdAt);
        const fifteenMinutesLater = new Date(createdAt.getTime() + 15 * 60 * 1000);
        const now = new Date();
        const remaining = fifteenMinutesLater.getTime() - now.getTime();
        
        if (remaining > 0) {
          setEditTimeLeft(Math.floor(remaining / 1000));
        } else {
          setEditTimeLeft(null);
          // If currently editing, exit edit mode
          if (isEditing) {
            setIsEditing(false);
            setEditContent(comment.content);
          }
          onUpdate(); // Refresh to remove edit option
        }
      };

      updateEditTimeLeft();
      const interval = setInterval(updateEditTimeLeft, 1000);
      return () => clearInterval(interval);
    }
  }, [comment.isDeleted, comment.canEdit, comment.createdAt, onUpdate, isEditing,comment.content]);

  const formatTimeLeft = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const canCurrentlyEdit = () => {
    
    if (comment.isDeleted || !comment.canEdit) return false;
    
    const createdAt = new Date(comment.createdAt);
    const now = new Date();
    const fifteenMinutesInMs = 15 * 60 * 1000;
    
    

    return (now.getTime() - createdAt.getTime()) < fifteenMinutesInMs;
  };

  const handleEdit = async () => {
    // Double-check edit window before saving
    if (!canCurrentlyEdit()) {
      alert('Edit window has expired. Comments can only be edited within 15 minutes of posting.');
      setIsEditing(false);
      setEditContent(comment.content);
      return;
    }

    setIsLoading(true);
    try {
      await apiService.updateComment(comment.id, editContent);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = () => {
    if (!canCurrentlyEdit()) {
      alert('Edit window has expired. Comments can only be edited within 15 minutes of posting.');
      return;
    }
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment? You can restore it within 15 minutes.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await apiService.softDeleteComment(comment.id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    } finally {
      setIsLoading(false);
    }
    
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      await apiService.restoreComment(comment.id);
      onUpdate();
    } catch (error) {
      console.error('Error restoring comment:', error);
      alert('Failed to restore comment');
    } finally {
      setIsLoading(false);
    }
    
  try {
    const response = await apiService.getComments();
    console.log("Loaded comments:", response);
    
  } catch (error) {
    console.error("Error loading comments:", error);
  }


  };

  const handlePermanentDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this comment? This action cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await apiService.deleteComment(comment.id);
      onUpdate();
    } catch (error) {
      console.error('Error permanently deleting comment:', error);
      alert('Failed to permanently delete comment');
    } finally {
      setIsLoading(false);
    }
  };

  const isEditWindowActive = canCurrentlyEdit();

  return (
    <div className="border-l-2 border-gray-200 pl-4 mb-4">
      <div className={`bg-white p-4 rounded-lg shadow-sm ${comment.isDeleted ? 'bg-red-50 border border-red-200' : ''}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="font-medium text-gray-900">{comment.author.username}</div>
          <div className="text-sm text-gray-500">
            {new Date(comment.createdAt).toLocaleString()}
            {comment.isEdited && <span className="ml-2 text-xs">(edited)</span>}
            {comment.isDeleted && (
              <span className="ml-2 text-xs text-red-500">
                (deleted {new Date(comment.deletedAt).toLocaleString()})
              </span>
            )}
          </div>
        </div>
        
        {/* Edit Window Timer - Show only when edit is available and time is running out */}
        {isEditWindowActive && editTimeLeft !== null && editTimeLeft < 300 && !comment.isDeleted && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-yellow-700">
                Edit window expires in {formatTimeLeft(editTimeLeft)}
              </span>
            </div>
          </div>
        )}
        
        {/* Deleted Comment Warning */}
        {comment.isDeleted && (
          <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-md">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm text-red-700">
                This comment has been deleted
                {timeLeft && comment.canRestore && (
                  <span className="ml-2 font-medium">
                    (Restore available for {formatTimeLeft(timeLeft)})
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
        
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              disabled={isLoading}
            />
            {editTimeLeft !== null && (
              <div className="text-xs text-gray-500 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Edit expires in {formatTimeLeft(editTimeLeft)}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                disabled={isLoading || !editContent.trim() || !isEditWindowActive}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                disabled={isLoading}
                className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className={`text-gray-700 mb-3 ${comment.isDeleted ? 'line-through opacity-60' : ''}`}>
              {comment.isDeleted ? '[This comment has been deleted]' : comment.content}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {/* Reply Button - Available for all non-deleted comments */}
              {!comment.isDeleted && (
                <button
                  onClick={() => onReply(comment.id)}
                  className="text-sm text-blue-500 hover:text-blue-700 transition-colors"
                >
                  Reply
                </button>
              )}
              
              {/* Edit Button - Available for non-deleted comments within 15-minute window */}
              
              { canCurrentlyEdit()  && (
                <button
                  onClick={handleStartEdit}
                  className="text-sm text-green-500 hover:text-green-700 transition-colors"
                >
                  Edit
                  {editTimeLeft !== null && editTimeLeft < 300 && (
                    <span className="ml-1 text-xs text-gray-500">
                      ({formatTimeLeft(editTimeLeft)})
                    </span>
                  )}
                </button>
              )}
              
              {/* Edit Expired Message */}
              {comment.canEdit && !comment.isDeleted && !isEditWindowActive && (
                <span className="text-sm text-gray-400 cursor-not-allowed">
                  Edit (expired)
                </span>
              )}
              
              {/* Delete Button - Available for non-deleted comments */}
              {comment.canEdit && !comment.isDeleted && (
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              )}
              
              {/* Restore Button - Available for deleted comments within 15 minutes */}
              {comment.canRestore && comment.isDeleted && timeLeft && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRestore}
                    disabled={isLoading}
                    className="text-sm text-yellow-600 hover:text-yellow-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {isLoading ? 'Restoring...' : 'Restore'}
                  </button>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {formatTimeLeft(timeLeft)} left
                  </span>
                </div>
              )}
              
              {/* Permanent Delete Button - Available for deleted comments */}
              {!comment.canRestore && comment.isDeleted && (
                <button
                  onClick={handlePermanentDelete}
                  disabled={isLoading}
                  className="text-sm text-red-700 hover:text-red-800 disabled:opacity-50 transition-colors font-medium"
                >
                  {isLoading ? 'Deleting...' : 'Delete Permanently'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Replies - Only show for non-deleted comments or if user can see deleted content */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 mt-2">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};