import { TUser } from './TUser';

export type postMedia =  { url: string, type: string }[];


export type PostType = {
    _id: string,
    targetId: string,
    username: string,
    isUploaded: boolean,
    user: TUser,
    sharedPost: PostType,
    target?: User,
    type: string,
    postType: string,
    media: postMedia,
    content: string,
    visibility: string,
    createdAt: string
    updatedAt: string
}