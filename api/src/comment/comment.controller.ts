import { BadRequestException, Body, Controller, Delete, Get, Post, Put, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CommentService } from './comment.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { HashtagService } from 'src/hashtag/hashtagservice';
import { PostsService } from 'src/posts/posts.service';

@Controller('comments')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly hashtagService: HashtagService,
    private readonly postService: PostsService
  ) { }

  @UseInterceptors(FileInterceptor('file'))
  @Post("comment")
  async comment(@Req() req: Request, @Res() res: Response, @UploadedFile() file: Express.Multer.File,
    @Body("commentDetails") _commentDetails: string,
    @Res() response: Response) {
    const { commentDetails, postId, postType, targetType, authorId, mentions } = JSON.parse(_commentDetails)
    const { sub } = req.user as { sub: string, username: string }

    const post = await this.postService._getPost(postId)
    if (!post) {
      throw new BadRequestException('post not found')
    }

    const hashtags = this.hashtagService.extractHashtags(commentDetails.content);
    this.hashtagService.processPostHashtags(postId, hashtags)

    const comment = await this.commentService.commentOnPost({
      commentDetails,
      postId,
      mentions,
      hashtags,
      userId: sub,
      targetId: postId,
      targetType,
      postType,
      authorId,
      file
    })

    const postHashtags = [...post.hashtags, ...hashtags]
    this.postService.updatePost(postId, { hashtags: postHashtags })

    response.json(comment)
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post("comment/reply")
  async reply(@Req() req: Request, @Res() res: Response, @UploadedFile() file: Express.Multer.File,
    @Body("replyData") replyData: string,
    @Res() response: Response) {
    const {
      replyDetails,
      postId,
      mentions,
      commentId,
      postType,
      targetType,
      authorId,
      commentAuthorId
    } = JSON.parse(replyData)
    const { sub } = req.user as { sub: string, username: string }

    const post = await this.postService._getPost(postId)
    if (!post) {
      throw new BadRequestException('post not found')
    }

    const hashtags = this.hashtagService.extractHashtags(replyDetails.content);
    this.hashtagService.processPostHashtags(postId, hashtags)

    const reply = await this.commentService.replyOnComment(
      {
        replyDetails,
        postId,
        mentions,
        hashtags,
        commentId,
        userId: sub,
        postType,
        targetType,
        targetId: postId,
        authorId,
        commentAuthorId,
        file
      })

    const postHashtags = [...post.hashtags, ...hashtags]
    this.postService.updatePost(postId, { hashtags: postHashtags })

    response.json(reply)
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
    @Body() body: { commentId: string; content: string, mentions: string[] }
  ) {
    const { commentId, content, mentions } = body;
    const { sub } = req.user as { sub: string };

    const result = await this.commentService.updateComment(
      { content },
      mentions,
      commentId,
      sub
    );

    return res.json(result);
  }

  @Put("comment/reply")
  async updateReply(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: { replyId: string; content: string, mentions: string[] }
  ) {
    const { replyId, content, mentions } = body;
    const { sub } = req.user as { sub: string };

    const result = await this.commentService.updateReply(
      { content },
      mentions,
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
