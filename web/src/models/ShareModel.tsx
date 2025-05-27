import { domain } from '@/config/domain';
import { Copy, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WhatsappIcon, WhatsappShareButton } from 'react-share';
import { toast } from 'react-toastify';
import CPostModal from './CPostModal';
import { useCreateSharedPost } from '@/hooks/Post/usePost';
import { MdCancel } from 'react-icons/md';
import { PostType } from '@/utils/types/Post';
import { Button } from '@/components/ui/button';
import { Dispatch, SetStateAction } from 'react';

function ShareModel({
    isReel,
    key,
    sharedPost,
    postId,
    postType,
    setModelTrigger,
    handleDownload
}: {
    isReel: boolean,
    key: string,
    sharedPost: PostType,
    postId: string,
    postType: string,
    setModelTrigger: Dispatch<SetStateAction<"comments" | "share" | "options" | boolean>>
    handleDownload: () => void
}) {

    const navigate = useNavigate()
    const createSharedPost = useCreateSharedPost(key, sharedPost?.targetId)

    const _createSharedPost = async ({ content, selectedMedia, formData, visibility }) => {
        let sharedPostDetails: { sharedPostId: string, content: string, type: string, visibility: string, sharedPost: any, target: any } = { sharedPostId: sharedPost?._id, content, type: "user", visibility: "public", sharedPost, target: sharedPost.target }
        createSharedPost.mutate(sharedPostDetails)
        toast.success('shared successfully')
        setModelTrigger(null)
    }

    return (
        <div className='fixed inset-0 z-50  w-screen sm:p-8 overflow-hidden h-screen flex items-center justify-center'>
            {/* <div className='absolute top-0 right-0 backdrop-blur-[1.5px] w-full h-full' onClick={() => {
                setModelTrigger(false)
                if (location.pathname == '/') {
                    navigate("/", { replace: true })
                    return
                }
                navigate("", { replace: true })
            }}></div> */}

            <div className='relative rounded-md flex flex-col justify-center items-center z-10 max-w-80 sm:max-w-96 w-full bg-card border border-accent shadow-lg'>
                <div className='absolute top-4 right-4 z-50  text-2xl'>
                    <MdCancel onClick={() => {
                        console.log('yesyes')
                        setModelTrigger(null)
                    }} />
                </div>
                <div className='p-4'>
                    <span className='text-2xl text-center'>Share</span>
                </div>
                {sharedPost &&
                    <CPostModal createPost={_createSharedPost} isShared={sharedPost?.sharedPost ? false : true} />

                }
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
                {isReel && (
                    <Button
                        variant="outline"
                        className="w-full mt-6 flex items-center p-2 gap-2"
                        onClick={handleDownload}
                    >
                        <Download className="h-5 w-5" />
                        <span>Download Video</span>
                    </Button>
                )}
            </div>
        </div>
    )
}

export default ShareModel