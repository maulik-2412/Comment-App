import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('comments')
@Index(['parentId'])
@Index(['authorId'])
@Index(['createdAt'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ name: 'author_id' })
  authorId: string;

  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  // Helper method to check if comment can be edited
  canEdit(): boolean {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return this.createdAt > fifteenMinutesAgo;
  }

  // Helper method to check if comment can be restored
  canRestore(): boolean {
    if (!this.isDeleted || !this.deletedAt) return false;
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return this.deletedAt > fifteenMinutesAgo;
  }
}
