import { axiosClient } from '../axiosClient';

export interface CommentsResponse {
  comments: [Comment];
  nextCursor: string,
}

interface CreateCommentResponse {
  comment: string
}


export async function fetchFeed(pageParam) {
  const response = await axiosClient.get("posts/feed", {
    params: { cursor: pageParam }
  });
  return response.data;
}

export async function fetchPosts(pageParam, type, targetId?) {
  console.log(type, targetId)
  const response = await axiosClient.get("posts", {
    params: { cursor: pageParam, type, targetId }
  });
  return response.data;
}


export async function createPost(formData: FormData) {
  const response = await axiosClient.post("/posts/create", formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 20000000 })
  return response.data;
}


export async function updatePost(formData: FormData) {
  const response = await axiosClient.post("/posts/update", formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 200000000 })
  return response.data;
}


export async function removePost(postDetails) {
  const { data } = await axiosClient.post("/posts/delete", { postDetails })
  return data;
}

export async function createComment(commentDetails): Promise<CreateCommentResponse> {
  const response = await axiosClient.post<CreateCommentResponse>("comments/comment", commentDetails);
  return response.data;
}


export interface CommentData {
  content: string;
}


export async function likePost(postDetails) {
  const { data } = await axiosClient.post("/posts/like", postDetails)
  return data
}

export async function bookmarkPost(postDetails) {
  console.log(postDetails)
  const { data } = await axiosClient.post("/posts/bookmark", postDetails)
  return data
}