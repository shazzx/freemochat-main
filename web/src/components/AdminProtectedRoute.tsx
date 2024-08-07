import {useSelector, useDispatch} from 'react-redux'
import { useEffect,  useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { setAdmin } from '../app/features/admin/adminSlice'
import { setAccessToken } from '../app/features/admin/authSlice'
import { axiosClient } from '../api/Admin/axiosClient'

function AdminProtectedRoute({ children }) {
    const dispatch = useDispatch()
    const [isFetched, setIsFetched] = useState(false)
    const { admin } = useSelector((state: any) => state.admin)
    const navigate = useNavigate()

    useEffect(() => {
        const getAdmin = async () => {
            try {
                const { data } = await axiosClient.post("/admin/refresh-token")
                dispatch(setAccessToken(data?.accessToken))

                let response = await axiosClient.get("admin")
                console.log(response.data, admin)
                if (response.status == 200) {
                    dispatch(setAdmin(response.data))
                    setIsFetched(true)
                } else {
                    setIsFetched(true)
                }


            } catch (error) {
                console.log(error)
                return navigate('/admin/login')
            }
        }

        getAdmin()
    }, [])

    if (!isFetched) {
        return null
    }

    if (isFetched && !admin) {
        return <Navigate to="/login" replace />
    }

    return children
}

export default AdminProtectedRoute