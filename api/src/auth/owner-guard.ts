// import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { Model } from 'mongoose';
// import { InjectModel } from '@nestjs/mongoose';
// import { Comment } from 'src/schema/comment';
// import { Post } from 'src/schema/post';

// export const OWNER_KEY = 'owner';
// export const SetOwnerCheck = (modelName: string) => Reflect.metadata(OWNER_KEY, modelName);

// @Injectable()
// export class OwnerGuard implements CanActivate {
//   constructor(
//     private reflector: Reflector,
//     @InjectModel(Comment.name) private commentModel: Model<Comment>,
//     @InjectModel(Post.name) private postModel: Model<Post>,
//     // Add other models as needed
//   ) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const modelName = this.reflector.get<string>(OWNER_KEY, context.getHandler());
//     if (!modelName) {
//       return true; // No ownership check required
//     }

//     const request = context.switchToHttp().getRequest();
//     const user = request.user;
//     const itemId = request.params.id || request.params.commentId || request.params.postId; // Adjust based on your route parameter naming

//     let model: Model<any>;
//     switch (modelName) {
//       case 'Comment':
//         model = this.commentModel;
//         break;
//       case 'Post':
//         model = this.postModel;
//         break;
//       // Add cases for other models
//       default:
//         throw new ForbiddenException('Invalid model type');
//     }

//     const item = await model.findById(itemId).exec();
    
//     if (!item) {
//       throw new ForbiddenException('Item not found');
//     }

//     if (item.userId.toString() !== user.id) {
//       throw new ForbiddenException('You are not the owner of this item');
//     }

//     return true;
//   }
// }