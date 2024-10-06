import { axiosClient } from "../axiosClient"

export const fetchUser = async (username) => {
    if (username.length > 0) {
        const { data } = await axiosClient.get(`/user?username=${username}`)
        // console.log(data, 'fetched user')
        if (data == null) {
            throw new Error('not found')
        }
        return data
    }
}

export const fetchUserStories = async () => {
    const { data } = await axiosClient.get("stories")
    return data
}


export const uploadStory = async (formData: FormData) => {
    const { data } = await axiosClient.post("/stories/create", formData, { headers: { "Content-Type": 'multipart/form-data' } })
    return data
}


export const removeStory = async (_data: { storyId: string, url: string }) => {
    const { data } = await axiosClient.post("/stories/delete", _data)
    return data
}

export const updateUser = async (formData: FormData) => {
    const { data } = await axiosClient.post("/user/update", formData, { headers: { "Content-Type": 'multipart/form-data' }, timeout: 20000 })
    // console.log(data)
    return data
}


export const sendFriendRequest = async (recepientId) => {
    // console.log(recepientId)
    const { data } = await axiosClient.post("/user/request", { recepientId })
    // console.log(data)
    return data
}


export const acceptFriendRequest = async (recepientId) => {
    const { data } = await axiosClient.post("/user/request/accept", { recepientId })
    console.log(data)
    return data
}

export const rejectFriendRequest = async (recepientId) => {
    const { data } = await axiosClient.post("/user/request/reject", { recepientId })
    console.log(data)
    return data
}

export const removeFriend = async (recepientId) => {
    const { data } = await axiosClient.post("/user/friend/remove", { recepientId })
    console.log(data)
    return data
}

export const followUserToggle = async (recepientId) => {
    const { data } = await axiosClient.post("/user/follow", { recepientId })
    // console.log(data)
    return data
}



export const userFollowers = async (pageParam, userId?: string) => {
    const { data } = await axiosClient.get("/followers", { params: { cursor: pageParam, targetId: userId, type: 'user' } })
    // console.log(data)
    return data
}


export const userFriends = async (pageParam, userId?: string, groupId?: string) => {
    const { data } = await axiosClient.get("/user/friends", { params: { cursor: pageParam, userId, groupId } })
    // console.log(data)
    return data
}

export const userFriendRequests = async (pageParam) => {
    const { data } = await axiosClient.get("/user/requests", { params: { cursor: pageParam } })
    // console.log(data)
    return data
}

export const userNotifications = async (pageParam) => {
    const { data } = await axiosClient.get("/notifications", { params: { cursor: pageParam } })
    // console.log(data)
    return data
}



export const fetchUserMetrics = async () => {
    const { data } = await axiosClient.get("metrics-aggregator/user/metrics")
    return data
}


export const defaultMetric = async (name) => {
    // console.log(name)
    const { data } = await axiosClient.post("metrics-aggregator/user/metrics/default", { name })
    return data
}