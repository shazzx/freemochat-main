import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { PostService } from './post.service';
import { IsAdminRoute } from '../utils/isAdminRoute.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
export class PostController {
  constructor(private readonly postService: PostService) { }

  @UseGuards(JwtAuthGuard)
  @IsAdminRoute()
  @Get("posts")
  async getPosts(@Req() req: Request, @Res() response: Response) {
    const { cursor, search } = req.query as { cursor: string, search: string }
    response.json(await this.postService.getPosts(cursor, search))
  }

  @UseGuards(JwtAuthGuard)
  @IsAdminRoute()
  @Post("post/remove")
  async deletePost(@Req() req) {
    const { postDetails } = req.body
    return await this.postService.deletePost(postDetails)
}
}
