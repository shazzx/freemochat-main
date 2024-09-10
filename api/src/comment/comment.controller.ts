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
    const { commentDetails, postId } = JSON.parse(_commentDetails)
    const { sub } = req.user as { sub: string, username: string }
    console.log(commentDetails, 'commentDetails', postId, sub, file)
    response.json(await this.commentService.commentOnPost(commentDetails, postId, sub, file))
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post("comment/reply")
  async reply(@Req() req: Request, @Res() res: Response, @UploadedFile() file: Express.Multer.File,
    @Body("replyData") replyData: string,
    @Res() response: Response) {
    const { replyDetails, postId, commentId } = JSON.parse(replyData)
    const { sub } = req.user as { sub: string, username: string }
    response.json(await this.commentService.replyOnComment(replyDetails, postId, commentId, sub, file))
  }

  @Get()
  async comments(@Req() req) {
    console.log(req.query)
    return await this.commentService.getComments(req.query.postId, req.query.cursor, req.user.sub)
  }

  @Get("comment/replies")
  async replies(@Req() req) {
    console.log(req.query, 'query')
    return await this.commentService.getReplies(req.query.commentId, req.query.cursor, req.user.sub)
  }

  @UseInterceptors(FileInterceptor('file'))
  @Put("comment/reply")
  async updateReply(@Req() req: Request, @Res() res: Response, @UploadedFile() file: Express.Multer.File,
    @Body("replyData") replyData: string,
    @Res() response: Response) {
    const { replyDetails, replyId } = JSON.parse(replyData)
    console.log(replyDetails, replyId)
    response.json(await this.commentService.updateReply(replyDetails, replyId))
  }

  @UseInterceptors(FileInterceptor('file'))
  @Put("comment")
  async updateComment(@Req() req: Request, @Res() res: Response, @UploadedFile() file: Express.Multer.File,
    @Body("commentData") commentData: string,
    @Res() response: Response) {
    const { commentDetails, commentId } = JSON.parse(commentData)
    const { sub } = req.user as { sub: string }
    response.json(await this.commentService.updateComment(commentDetails, commentId))
  }

  @Delete("comment")
  async deleteComment(@Req() req) {
    const { commentDetails } = req.query
    
    return await this.commentService.removeComment(commentDetails)
  }

  @Delete("comment/reply")
  async deleteReply(@Req() req) {
    const { replyDetails } = req.query
    return await this.commentService.removeReply(replyDetails)
  }

}
