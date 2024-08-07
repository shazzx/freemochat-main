import { axiosClient } from '@/api/axiosClient'
import {  logout, setAccessToken } from '@/app/features/user/authSlice'
import { setUser } from '@/app/features/user/userSlice'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import React, { useEffect,  useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'

function ProtectedRoute({ children }) {
    const dispatch = useAppDispatch()
    const [isFetched, setIsFetched] = useState(false)
    const { user } = useAppSelector((state) => state.user)
    const navigate = useNavigate()
    const location = useLocation()
    // console.log(location.pathname == '/login')

    

    useEffect(() => {
        const getUser = async () => {
            console.log('callme')
            try {
                const { data } = await axiosClient.post("/user/refresh-token")
                dispatch(setAccessToken(data?.accessToken)) 

                let response = await axiosClient.get("user")
                console.log(response.data, user)
                if (response.status == 200) {
                    dispatch(setUser(response.data))
                    setIsFetched(true)
                    if(location.pathname == "/login"){
                        return navigate("/")
                    }
                } else {
                    setIsFetched(true)
                    dispatch(logout())
                return navigate('/login')

                }


            } catch (error) {
                console.log(error)
                setIsFetched(true)
                return navigate('/login')
            }
        }
    getUser()
    }, [])

    if(!isFetched && !user){
        return null
    }

    return children

}

export default React.memo(ProtectedRoute)