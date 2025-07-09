import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { Cron } from '@nestjs/schedule';
import { CommentResponseDto } from './dto/trans-comment.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  async create(createCommentDto: CreateCommentDto, authorId: string) {
    const comment = this.commentRepository.create({
      ...createCommentDto,
      authorId,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Send notification if it's a reply
    if (createCommentDto.parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: createCommentDto.parentId },
        relations: ['author'],
      });

      if (parentComment && parentComment.authorId !== authorId) {
        await this.notificationsService.sendNotification({
          userId: parentComment.authorId,
          type: 'comment_reply',
          message: `Someone replied to your comment`,
          commentId: savedComment.id,
        });
      }
    }

    return this.findOne(savedComment.id);
  }

  async findAll(page: number = 1, limit: number = 20) {
    const [comments, total] = await this.commentRepository.findAndCount({
      where: { parentId: null },
      relations: ['author', 'replies', 'replies.author'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const commentTree = this.buildCommentTree(comments);

    const transformed = plainToInstance(CommentResponseDto, commentTree, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      comments: transformed,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author', 'replies', 'replies.author'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: string) {
    const comment = await this.findOne(id);

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    if (!comment.canEdit()) {
      throw new BadRequestException(
        'Comments can only be edited within 15 minutes of posting',
      );
    }

    comment.content = updateCommentDto.content;
    comment.isEdited = true;

    return this.commentRepository.save(comment);
  }

  async softDelete(id: string): Promise<Comment> {
    const comment = await this.findOne(id);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();

    return this.commentRepository.save(comment);
  }
  async remove(id: string, userId: string): Promise<{ deleted: boolean }> {
    const comment = await this.findOne(id);

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();

    await this.commentRepository.save(comment);

    return { deleted: true };
  }

  async restore(commentId: string, userId: string): Promise<Comment> {
    const comment = await this.findOne(commentId);

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only restore your own comments');
    }

    if (!comment.canRestore()) {
      throw new BadRequestException(
        'Comments can only be restored within 15 minutes of deletion',
      );
    }

    comment.isDeleted = false;
    comment.deletedAt = null;

    return this.commentRepository.save(comment);
  }

  async findDeleted(userId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: {
        authorId: userId,
        isDeleted: true,
      },
      relations: ['author'],
      order: { deletedAt: 'DESC' },
    });
  }

  @Cron('*/5 * * * *') // Run every 5 mins
  async cleanupDeletedComments() {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const expiredComments = await this.commentRepository.find({
      where: {
        isDeleted: true,
        deletedAt: LessThan(fifteenMinutesAgo),
      },
    });

    for (const comment of expiredComments) {
      await this.commentRepository.remove(comment);
    }

    console.log(
      `Permanently deleted ${expiredComments.length} expired comments`,
    );
  }

  private buildCommentTree(comments: Comment[]): Comment[] {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create map of all comments
    comments.forEach((comment) => {
      
      comment.replies = [];

      commentMap.set(comment.id, comment);
    });

    // Second pass: build tree structure
    comments.forEach((comment) => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  }
}
