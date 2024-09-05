import { axiosClient } from '../axiosClient';

export interface CommentsResponse {
  comments: [Comment];
  nextCursor: string,
}

interface CreateCommentResponse {
  comment: string
}

export async function fetchComments(postId, pageParam): Promise<CommentsResponse> {
  const response = await axiosClient.get<CommentsResponse>("comments", {
    params: { cursor: pageParam, postId }
  });
  return response.data;
}


export async function fetchReplies(commentId, pageParam): Promise<CommentsResponse> {
  console.log(commentId)
  const response = await axiosClient.get<CommentsResponse>("comments/comment/replies", {
    params: { cursor: pageParam, commentId }
  });
  return response.data;
}


export async function createComment(formData): Promise<CreateCommentResponse> {
  console.log(formData)
  const response = await axiosClient.post<CreateCommentResponse>("comments/comment", formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return response.data;
}

export async function updateComment(formData) {
  const response = await axiosClient.put("comments/comment",  formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return response.data;
}


export async function deleteComment(commentDetails) {
  const response = await axiosClient.delete("comments/comment", { params: { commentDetails } });
  return response.data;
}


export async function replyOnComment(formData): Promise<CreateCommentResponse> {
  const response = await axiosClient.post<CreateCommentResponse>("comments/comment/reply", formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return response.data;
}

export async function updateReply(formData): Promise<CreateCommentResponse> {
  const response = await axiosClient.put<CreateCommentResponse>("comments/comment/reply", formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return response.data;
}

export async function deleteReply(replyDetails) {
  const response = await axiosClient.delete("comments/comment/reply", { params: { replyDetails } });
  return response.data;
}



export async function likeComment(commentDetails) {
  const { data } = await axiosClient.post("/posts/likeComment", commentDetails)
  console.log(data)
  return data
}

export async function likeReply(replyDetails) {
  console.log(replyDetails)
  const { data } = await axiosClient.post("/posts/likeReply", replyDetails)
  console.log(data)
  return data
}

