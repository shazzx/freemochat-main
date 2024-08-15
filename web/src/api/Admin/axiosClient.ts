import { store } from '../../app/store';
import axios from 'axios'


const baseURL = "http://localhost:3000/api"


export const axiosClient = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

axiosClient.interceptors.request.use(
    (config) => {
        // const access_token =  store.getState().adminAuth.access_token
        const access_token =  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InNoYXp6YWRtaW4iLCJzdWIiOiI2NmJkYjVhM2JlMThkM2UwNmE4ZDBlNzciLCJpYXQiOjE3MjM3MDg4NzB9.av2JJ5kWkFk_6RCgufHFJwu6Z1OKqfBiqgb8qWXb1aU"
        if (access_token) {
            config.headers.Authorization = `Bearer ${access_token}`

        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)