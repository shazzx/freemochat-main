import { domain } from '@/config/domain';
import { Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WhatsappIcon, WhatsappShareButton } from 'react-share';
import { toast } from 'react-toastify';

function ShareModel({ postId, postType, setModelTrigger }) {

    const navigate = useNavigate()

    return (
        <div className='fixed inset-0 z-50  w-screen sm:p-8 overflow-hidden h-screen flex items-center justify-center'>
            <div className='absolute top-0 right-0 backdrop-blur-[1.5px] w-full h-full' onClick={() => {
                setModelTrigger(false)
                if (location.pathname == '/') {
                    navigate("/", { replace: true })
                    return
                }
                navigate("", { replace: true })
            }}></div>
            <div className='rounded-md flex flex-col justify-center items-center z-10 max-w-80 sm:max-w-96 w-full h-40 bg-card border border-accent shadow-lg'>
            <div className='p-4'>
                <span className='text-2xl text-center'>Share</span>
            </div>
            <div className='flex justify-center items-center p-2 gap-4 z-10 max-w-80 sm:max-w-96 w-full h-40 bg-card border border-accent'>

            <WhatsappShareButton url={`${domain}/post/${postId}?type=${postType}`} >
                <div className='flex flex-col gap-1 items-center justify-center p-4 '>
                    <WhatsappIcon borderRadius={60} size={24} /> <span>Whatsapp</span>
                </div>
            </WhatsappShareButton>
            <div className='flex flex-col gap-1 items-center justify-center' onClick={() => {
                navigator.clipboard.writeText(`${domain}/post/${postId}?type=${postType}`);
                toast.info("URL Copied")
            }}>
                <Copy size={24} /> <span>Copy URL</span>
            </div>
            </div>
            </div>
        </div>
    )
}

export default ShareModel