export interface User {
  id: string;
  email: string;
  username: string;
}

export interface Comment {
  id: string;
  content: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: string | Date;
  author: User;
  replies: Comment[];
  canEdit: boolean;
  canRestore: boolean;
}

export interface Notification {
  id: string;
  type: 'comment_reply';
  message: string;
  isRead: boolean;
  createdAt: Date;
  comment: Comment;
  userId: string;         // ✅ Add this
  commentId: string;  
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}