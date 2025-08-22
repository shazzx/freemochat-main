import { HTTP_CONTENT_TYPES } from '@/utils/enums/global.c';
import { axiosClient } from '../axiosClient';
import { COMMENT_ROUTES } from '@/utils/enums/routes/comment.routes.e';

export interface CommentsResponse {
  comments: [Comment];
  nextCursor: string,
}

interface CreateCommentResponse {
  comment: string
}

export async function fetchComments(postId: string, pageParam: unknown): Promise<CommentsResponse> {
  const response = await axiosClient.get<CommentsResponse>(COMMENT_ROUTES.GET_COMMENTS, {
    params: { cursor: pageParam, postId }
  });
  return response.data;
}

export async function fetchReplies(commentId: string, pageParam: unknown): Promise<CommentsResponse> {
  console.log(commentId)
  const response = await axiosClient.get<CommentsResponse>(COMMENT_ROUTES.GET_REPLIES, {
    params: { cursor: pageParam, commentId }
  });
  return response.data;
}


export async function createComment(formData: FormData): Promise<CreateCommentResponse> {
  const response = await axiosClient.post<CreateCommentResponse>(COMMENT_ROUTES.COMMENT, formData, { headers: { 'Content-Type': HTTP_CONTENT_TYPES.MULTIPART_FORM_DATA } });
  return response.data;
}

export async function updateComment(data) {
  const response = await axiosClient.put(COMMENT_ROUTES.COMMENT,  data);
  return response.data;
}

export async function deleteComment(commentDetails) {
  const response = await axiosClient.delete(COMMENT_ROUTES.COMMENT, { params: { commentDetails } });
  return response.data;
}

export async function replyOnComment(formData): Promise<CreateCommentResponse> {
  const response = await axiosClient.post<CreateCommentResponse>(COMMENT_ROUTES.REPLY, formData, { headers: { 'Content-Type': HTTP_CONTENT_TYPES.MULTIPART_FORM_DATA } });
  return response.data;
}

export async function updateReply(data): Promise<CreateCommentResponse> {
  const response = await axiosClient.put<CreateCommentResponse>(COMMENT_ROUTES.REPLY, data);
  return response.data;
}

export async function deleteReply(replyDetails) {
  const response = await axiosClient.delete(COMMENT_ROUTES.REPLY, { params: { replyDetails } });
  return response.data;
}



export async function likeComment(commentDetails) {
  const { data } = await axiosClient.post("/posts/likeComment", commentDetails)
  return data
}

export async function likeReply(replyDetails) {
  const { data } = await axiosClient.post("/posts/likeReply", replyDetails)
  return data
}

