import { Expose, Type, Transform } from 'class-transformer';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

export class CommentResponseDto {
  @Expose() id: string;
  @Expose() content: string;
  @Expose() isEdited: boolean;
  @Expose() isDeleted: boolean;
  @Expose()
  @Transform(({ value }) => (value ? new Date(value) : null), {
    toClassOnly: true,
  })
  deletedAt: Date;
  @Expose()
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  createdAt: Date;
  @Expose()
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  updatedAt: Date;
  @Expose() authorId: string;
  @Expose() parentId: string;

  @Expose()
  @Type(() => UserResponseDto)
  author: UserResponseDto;

  @Expose()
  @Transform(({ obj }) => {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return new Date(obj.createdAt) > fifteenMinutesAgo;
  })
  canEdit: boolean;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.isDeleted || !obj.deletedAt) return false;
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return new Date(obj.deletedAt) > fifteenMinutesAgo;
  })
  canRestore: boolean;

  @Expose()
  @Type(() => CommentResponseDto)
  replies: CommentResponseDto[];
}
