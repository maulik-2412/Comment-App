import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { Comment } from '../comments/entities/comment.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async createReplyNotification(
    recipient: User,
    comment: Comment,
    message: string,
  ): Promise<Notification> {
    const notification = this.notificationRepo.create({
      type: 'comment_reply',
      message,
      user: recipient,
      userId: recipient.id,
      comment,
      commentId: comment.id,
    });

    return this.notificationRepo.save(notification);
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { userId },
      relations: ['comment'],
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId },
    });

    if (!notification) throw new NotFoundException('Notification not found');

    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async sendNotification(notification: {
    userId: string;
    type: 'comment_reply'; // or your union type
    message: string;
    commentId?: string;
  }): Promise<Notification> {
    // Find the user and comment entities
    const user = await this.notificationRepo.manager.findOne(User, {
      where: { id: notification.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found for notification');
    }

    let comment: Comment | null = null;
    if (notification.commentId) {
      comment = await this.notificationRepo.manager.findOne(Comment, {
        where: { id: notification.commentId },
      });
      if (!comment) {
        throw new NotFoundException('Comment not found for notification');
      }
    }

    // Create and save the notification entity
    const notifEntity = this.notificationRepo.create({
      user, // or userId: user.id if your entity uses userId
      userId: user.id,
      type: 'comment_reply', // use the literal string, not notification.type
      message: notification.message,
      comment: comment ?? undefined,
      commentId: comment ? comment.id : undefined,
    });

    return this.notificationRepo.save(notifEntity);
  }
}
