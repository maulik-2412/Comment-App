/* import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,BadRequestException
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { Comment } from '../comments/entities/comment.entity';
import { plainToInstance } from 'class-transformer';



@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request, // 👈 Get full request object
  ) {
    const authorId = (req.user as { id: string }).id; // 👈 Extract user ID from JWT
    return this.commentsService.create(createCommentDto, authorId);
  }

  @Get()
  async findAll() {
    const comments = await this.commentsService.findAll();
    return plainToInstance(CommentResponseDto, comments, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Body('userId') userId: string,
  ) {
    return this.commentsService.update(id, updateCommentDto, userId);
  }

  @Post(':id/soft-delete')
  @UseGuards(JwtAuthGuard)
  async softDeleteComment(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<Comment> {
    const comment = await this.commentsService.findOne(id);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user can delete (author or admin)
    if (comment.authorId !== req.user.id && !req.user.isAdmin) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    return this.commentsService.softDelete(id);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard)
  async restoreComment(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<Comment> {
    const comment = await this.commentsService.findOne(id);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user can restore (author or admin)
    if (comment.authorId !== req.user.id && !req.user.isAdmin) {
      throw new ForbiddenException('You can only restore your own comments');
    }

    if (!comment.canRestore()) {
      throw new BadRequestException(
        'Comment cannot be restored (15-minute window has passed)',
      );
    }

    return this.commentsService.restore(id);
  }

  @Get('deleted')
  @UseGuards(JwtAuthGuard)
  async getDeletedComments(@Req() req: any): Promise<Comment[]> {
    return this.commentsService.findDeleted(req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.commentsService.remove(id, req.user.id);
  }
}
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { plainToInstance } from 'class-transformer';

import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Comment } from './entities/comment.entity';
import { CommentResponseDto } from './dto/trans-comment.dto';

@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async create(@Body() dto: CreateCommentDto, @Req() req: Request) {
    const authorId = (req.user as { id: string }).id;
    const comment = await this.commentsService.create(dto, authorId);
    return plainToInstance(CommentResponseDto, comment, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  async findAll(@Req() req: Request) {
    const result = await this.commentsService.findAll(); // { comments, total, ... }

    const transformed = {
      ...result,
      comments: result.comments.map((comment) =>
        plainToInstance(CommentResponseDto, comment, {
          excludeExtraneousValues: true,
          enableImplicitConversion: true,
        }),
      ),
    };

    return transformed;
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const comment = await this.commentsService.findOne(id);
    return plainToInstance(CommentResponseDto, comment, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: string }).id;
    const updated = await this.commentsService.update(id, dto, userId);
    return plainToInstance(CommentResponseDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':id/soft-delete')
  async softDelete(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    const comment = await this.commentsService.findOne(id);

    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('Not allowed to delete this comment');
    }

    const deleted = await this.commentsService.softDelete(id);
    return plainToInstance(CommentResponseDto, deleted, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string, @Req() req: Request) {
    console.log('this is called');
    const user = req.user as any;
    const comment = await this.commentsService.findOne(id);
    console.log('== RESTORE DEBUG ==');
    console.log('user.id:', user.id);
    console.log('user.isAdmin:', user.isAdmin);
    console.log('comment.authorId:', comment.authorId);
    console.log('comment.canRestore():', comment.canRestore());
    console.log('comment.isDeleted:', comment.isDeleted);
    console.log('comment.deletedAt:', comment.deletedAt);

    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== user.id) {
      throw new ForbiddenException('Not allowed to restore this comment');
    }

    if (!comment.canRestore()) {
      throw new BadRequestException('Restore window expired (15 minutes max)');
    }

    const restored = await this.commentsService.restore(id, user.id);
    return plainToInstance(CommentResponseDto, restored, {
      excludeExtraneousValues: true,
    });
  }

  @Get('deleted')
  async getDeleted(@Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    const deleted = await this.commentsService.findDeleted(userId);
    return plainToInstance(CommentResponseDto, deleted, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    const result = await this.commentsService.remove(id, userId);
    return plainToInstance(CommentResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }
}
