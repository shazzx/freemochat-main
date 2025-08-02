import { axiosClient } from "../axiosClient";

export async function fetchReelsFeed(pageParam, postId) {
  const response = await axiosClient.get("posts/reelsFeed", {
    params: { cursor: pageParam, postId }
  });
  return response.data;
}

export async function fetchVideosFeed(pageParam, postId) {
  const response = await axiosClient.get("posts/videosFeed", {
    params: { cursor: pageParam, postId }
  });
  return response.data;
}

export async function fetchReels(pageParam: string, targetId: string, type: 'user' | 'group' = 'user') {
  const response = await axiosClient.get('/posts/reels', {
    params: {
      cursor: pageParam,
      targetId,
      type
    }
  });
  return response.data;
}

export async function createReel(formData: FormData) {
  const response = await axiosClient.post("/posts/create/reel", formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 2000000 })
  return response.data;
}

export async function updateReelPost({ postId, content }: { postId: string, content: string }) {
  const response = await axiosClient.post('/posts/reel', { content, postId });
  return response.data;
}

export async function deleteReelPost({ postId }: { postId: string }) {
  const response = await axiosClient.post('/posts/reel/remove', { postId });
  return response.data;
}