import { Body, Controller, Delete, Get, Post, Put, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) { }

  @UseInterceptors(FileInterceptor('file'))
  @Post("comment")
  async comment(@Req() req: Request, @Res() res: Response, @UploadedFile() file: Express.Multer.File,
    @Body("commentDetails") _commentDetails: string,
    @Res() response: Response) {
    const { commentDetails, postId, postType, targetType, authorId } = JSON.parse(_commentDetails)
    const { sub } = req.user as { sub: string, username: string }
    console.log(JSON.parse(_commentDetails), 'commentDetails')
    response.json(await this.commentService.commentOnPost({
      commentDetails,
      postId,
      userId: sub,
      targetId: postId,
      targetType,
      postType,
      authorId,
      file
    }))
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post("comment/reply")
  async reply(@Req() req: Request, @Res() res: Response, @UploadedFile() file: Express.Multer.File,
    @Body("replyData") replyData: string,
    @Res() response: Response) {
    const {
      replyDetails,
      postId,
      commentId,
      postType,
      targetType,
      authorId,
      commentAuthorId
    } = JSON.parse(replyData)
    const { sub } = req.user as { sub: string, username: string }
    console.log(JSON.parse(replyData), 'replyData')
    response.json(await this.commentService.replyOnComment(
      {
        replyDetails,
        postId,
        commentId,
        userId: sub,
        postType,
        targetType,
        targetId: postId,
        authorId,
        commentAuthorId,
        file
      }))
  }

  @Get()
  async comments(@Req() req) {
    return await this.commentService.getComments(req.query.postId, req.query.cursor, req.user.sub)
  }

  @Get("comment/replies")
  async replies(@Req() req) {
    return await this.commentService.getReplies(req.query.commentId, req.query.cursor, req.user.sub)
  }

  @Put("comment")
  async updateComment(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: { commentId: string; content: string }
  ) {
    const { commentId, content } = body;
    const { sub } = req.user as { sub: string };

    const result = await this.commentService.updateComment(
      { content },
      commentId,
      sub
    );

    return res.json(result);
  }

  @Put("comment/reply")
  async updateReply(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: { replyId: string; content: string }
  ) {
    const { replyId, content } = body;
    const { sub } = req.user as { sub: string };

    const result = await this.commentService.updateReply(
      { content },
      replyId,
      sub
    );

    return res.json(result);
  }

  @Delete("comment")
  async deleteComment(@Req() req: Request) {
    const { sub } = req.user as { sub: string }
    const { commentDetails } = req.query

    return await this.commentService.removeComment(commentDetails, sub)
  }

  @Delete("comment/reply")
  async deleteReply(@Req() req: Request) {
    const { sub } = req.user as { sub: string }
    const { replyDetails } = req.query
    return await this.commentService.removeReply(replyDetails, sub)
  }

}
