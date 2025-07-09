import { AuthResponse, Comment, Notification } from '../types';

class ApiService {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken');
    }
  }

  private getToken(): string | null {
    // Always get fresh token from localStorage for consistency
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const token = this.getToken();
    
    
    // Debug: decode token to check its structure
    
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    

    const response = await fetch(url, config);
    
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`, {
        url,
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Set token immediately and synchronously
    this.token = response.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    
    
    
    return response;
  }

  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
    
    // Set token immediately and synchronously
    this.token = response.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    
    
    
    return response;
  }

  logout() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  // Helper method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Comments
  async getComments(page: number = 1): Promise<{ comments: Comment[]; total: number; page: number; totalPages: number }> {
    
    return this.request<{ comments: Comment[]; total: number; page: number; totalPages: number }>(`/comments?page=${page}`);
  }

  async createComment(content: string, parentId?: string): Promise<Comment> {
    return this.request<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
  }

  async updateComment(id: string, content: string): Promise<Comment> {
    return this.request<Comment>(`/comments/${id}`, {
      method: 'PATCH', // Changed from PUT to PATCH to match your controller
      body: JSON.stringify({ content }),
    });
  }

  async softDeleteComment(id: string): Promise<Comment> {
  return this.request<Comment>(`/comments/${id}/soft-delete`, {
    method: 'POST',
  });
}

async getDeletedComments(): Promise<Comment[]> {
  return this.request<Comment[]>('/comments/deleted');
}
  async deleteComment(id: string): Promise<Comment> {
    return this.request<Comment>(`/comments/${id}`, {
      method: 'DELETE',
    });
  }

  async restoreComment(id: string): Promise<Comment> {
    return this.request<Comment>(`/comments/${id}/restore`, {
      method: 'POST',
    });
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return this.request<Notification[]>('/notifications');
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }
}

export const apiService = new ApiService();