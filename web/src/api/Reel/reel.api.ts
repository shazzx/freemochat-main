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

export async function fetchReels(pageParam: string, targetId: string) {
  const response = await axiosClient.get('/posts/reels', {
    params: {
      cursor: pageParam,
      targetId
    }
  });
  return response.data;
}