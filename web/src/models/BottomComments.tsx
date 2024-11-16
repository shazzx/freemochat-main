import { Sheet } from 'react-modal-sheet';
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import AudioRecorder from '@/components/MediaRecorder'
import Post from '@/components/Post'
import Comment from '@/components/Post/Comment'
import Reply from '@/components/Post/Reply'
import ScreenLoader from '@/components/ScreenLoader'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useComments, useCreateComment, useReplies, useReplyOnComment, useUpdateComment } from '@/hooks/Post/useComments'
import { ChevronLeft } from 'lucide-react'
import React, { FormEvent, useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useUpdateReply } from '../hooks/Post/useComments'
import { v4 as uuidv4 } from 'uuid'
import { MdSend } from 'react-icons/md'
import { toast } from 'react-toastify'
import { setClose } from '@/app/features/user/postModelSlice'
import { useNavigate, useSearchParams } from 'react-router-dom'


function BottomComments({isOpen, setOpen, params, postId, postData, pageIndex}) {
  const { user } = useAppSelector((data) => data.user)
  const [isRecording, setIsRecording] = useState(false)
  const [replyState, setReplyState] = useState<{ _id: string, content: string, user: any, commentIndex: number }>()
  const [recordingUrl, setRecordingUrl] = useState(null)
  const commentRef = useRef<HTMLInputElement>(null)
  const replyRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [replyTo, setReplyTo] = useState(null)
  const [replyId, setReplyId] = useState(null)
  const [ref, inView] = useInView()
  const { data, isSuccess, isLoading, fetchNextPage } = useComments(postId)
  const mutation = useCreateComment(params)
  const replyMutation = useReplyOnComment()

  const replies = useReplies(replyId)

  useEffect(() => {
      scrollRef.current.scrollTop = postData?.media ? 600 : 200
      console.log(mutation.data)
  }, [mutation.isSuccess, mutation.data, replyState])

  useEffect(() => {
      console.log('vew')
      if (inView && !isLoading) {
          console.log('fetching comments')
          fetchNextPage()
      }
  }, [inView])

  useEffect(() => {
      if (replyState?.content) {
          setReplyId(replyState._id)
          // replyRef.current.focus()
          // replyRef.current.value = `@${replyState?.user?.username} `
          // setReplyTo(replyState?.user?.username)
      }
  }, [replyState])

  useEffect(() => {

  })

  const commentOnPost = async (recordingUrl?, recordingTime?) => {

      if (!recordingUrl && !recordingTime && commentRef.current?.value.length == 0) {
          toast.info("Comment can't be empty")
          return
      }

      let formData = new FormData()
      let commentDetails = { postId, commentDetails: { content: recordingUrl ? null : commentRef.current?.value, username: user?.username }, uuid: uuidv4() }

      if (recordingUrl) {
          let url = URL.createObjectURL(recordingUrl)
          formData.append("file", recordingUrl)
          commentDetails["audio"] = { src: url }
          console.log(recordingTime, 'here we are')
          commentDetails.commentDetails["duration"] = recordingTime
      }
      formData.append("commentDetails", JSON.stringify(commentDetails))

      mutation.mutateAsync({ ...commentDetails, formData })
      console.log(mutation.data)
      commentRef.current.value = null
  }

  const replyOnPost = async (recordingUrl?, recordingTime?) => {
      let formData = new FormData()
      let replyData = { postId, replyDetails: { content: replyRef.current.value }, commentId: replyState._id }

      if (recordingUrl && recordingTime) {
          let url = URL.createObjectURL(recordingUrl)
          formData.append("file", recordingUrl)
          replyData["audio"] = { src: url, duration: recordingTime }
          replyData.replyDetails["duration"] = recordingTime
      }
      formData.append("replyData", JSON.stringify(replyData))

      replyMutation.mutateAsync({ ...replyData, formData })
      replyRef.current.value = null

  }

  const [editCommentModelState, setEditCommentModelState] = useState(false)
  const [commentDetails, setCommentDetails] = useState(null)
  const updateCommentRef = useRef<HTMLTextAreaElement>(null)
  const updateComment = useUpdateComment(postId)
  const updateReply = useUpdateReply()
  const [searchParams, setSearchParams] = useSearchParams()

  const dispatch = useAppDispatch()
  const navigate = useNavigate()


  return (
    <>
      <Sheet 
      isOpen={isOpen} 
      onClose={() => setOpen(false)}
      snapPoints={[700, 400, 0]}
      >
        
        <Sheet.Container>
          <Sheet.Header className='bg-background-secondary dark:bg-background' />
          <Sheet.Content >
          <div ref={scrollRef} className='z-10 max-w-xl w-full h-full flex flex-col bg-background relative sm:h-fit max-h-full scroll-smooth overflow-auto'>
                {editCommentModelState &&
                    <div className='absolute w-full h-full top-0 left-0 flex items-center justify-center backdrop-blur-[1.5px] z-50 '>
                        <div className='absolute w-full h-full top-0 left-0 z-10' onClick={() => {
                            setEditCommentModelState(false)
                        }}>

                        </div>
                        <div className='flex flex-col gap-2 bg-card border-2 border-accent p-2 z-20'>
                            <div>
                                <span>Update Comment</span>
                            </div>

                            <form className='flex flex-col gap-2' onSubmit={(e: FormEvent) => {
                                e.preventDefault()

                                if (updateCommentRef.current.value.length > 6 && commentDetails?.commentId) {
                                    const commentData = { ...commentDetails, commentDetails: { content: updateCommentRef.current.value } }
                                    let formData = new FormData()
                                    formData.append('commentData', JSON.stringify(commentData))
                                    updateComment.mutate({ ...commentData, formData })

                                } else {
                                    let replyDetails = { ...commentDetails, replyDetails: { content: updateCommentRef.current.value } }
                                    let formData = new FormData()
                                    formData.append('replyData', JSON.stringify(replyDetails))

                                    updateReply.mutate({ ...replyDetails, formData, commentId: commentDetails.commentId })
                                }

                                setEditCommentModelState(false)

                            }}>
                                <Textarea className='bg-background rounded-sm p-2 w-72' defaultValue={commentDetails.content} ref={updateCommentRef} />
                                <Button type='submit'>Update</Button>
                            </form>
                        </div>
                    </div>
                }

                <div className='relative w-full items-center justify-center flex p-2'>
                    {replyState ?
                    <div className='relative w-full flex justify-center items-center'>
                        <ChevronLeft className='absolute left-2 flex-initial cursor-pointer' onClick={() => {
                        setReplyState(null)
                        setReplyTo(null)
                    }} />
                    <span>Replies</span>
                    </div>
                    :
                    <span>Comments</span>
                    }

                </div>
                <div className='relative p-4 flex h-full flex-col gap-2'>
                    {/* comment section */}
                    {/* {isLoading &&
                        // <ScreenLoader limit={1} />
                        <div className='max-w-xl w-full bg-card flex gap-4 p-3 sm:min-w-[420px]' >
                        <svg className="text-gray-700 animate-spin" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
                            width="24" height="24">
                            <path
                                d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
                                stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"></path>
                            <path
                                d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
                                stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" className="text-white">
                            </path>
                        </svg>
                        Loading comments...
                    </div>
                    } */}
                    {data.length > 0 && data[0]?.comments?.length > 0 ? data.map((page, pageIndex) => {
                        return (page.comments.map((comment: any, i) => {
                            if (i == page.comments.length - 1) {
                                return (
                                    <div ref={ref}>
                                        <Comment reply={setReplyState} comment={comment} pageIndex={pageIndex} commentIndex={i} postId={postData?._id} userId={user._id} commentRef={replyRef} key={comment?._id || comment?.uuid} setCommentDetails={setCommentDetails} setEditCommentModelState={setEditCommentModelState} editCommentModelState={editCommentModelState} />
                                    </div>
                                )
                            }
                            return (
                                <Comment reply={setReplyState} comment={comment} pageIndex={pageIndex} commentIndex={i} postId={postData?._id} userId={user._id} commentRef={replyRef} key={comment._id} setCommentDetails={setCommentDetails} setEditCommentModelState={setEditCommentModelState} editCommentModelState={editCommentModelState} />
                            )
                        }))

                    })
                        :
                        <div className='w-full flex items-center flex-col justify-center'>
                            <svg width="240" height="150" viewBox="0 0 900 500" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="transparent" d="M0 0h900v600H0z" /><rect x="316.777" y="120" width="264.476" height="264.476" rx="61.151" fill="#666AF6" /><path fill="#666AF6" d="m449.642 317.997 53.318 53.318-53.318 53.318-53.318-53.318z" /><rect x="419.998" y="183.472" width="59.981" height="107.109" rx="29.978" fill="#fff" stroke="#fff" stroke-width="12.848" stroke-linecap="round" stroke-linejoin="round" /><path d="M514.247 256.306c0 35.493-28.772 64.266-64.265 64.266v0c-35.493 0-64.266-28.773-64.266-64.266m64.266 89.972v-25.706" stroke="#fff" stroke-width="12.848" stroke-linecap="round" stroke-linejoin="round" /><rect x="41" y="236.289" width="216.845" height="216.845" rx="61.151" transform="rotate(-15 41 236.289)" fill="#666AF6" /><path fill="#666AF6" d="m196.762 396.704 26.093 15.065-15.065 26.093-26.093-15.065z" /><circle cx="114.359" cy="299.621" r="27.748" transform="rotate(-15 114.359 299.621)" fill="#fff" /><rect x="149.882" y="277.335" width="93.521" height="8.222" rx="4.111" transform="rotate(-15 149.882 277.335)" fill="#fff" /><rect x="98.995" y="349.488" width="161.349" height="8.222" rx="4.111" transform="rotate(-15 98.995 349.488)" fill="#fff" /><rect x="155.734" y="299.174" width="93.521" height="8.222" rx="4.111" transform="rotate(-15 155.734 299.174)" fill="#fff" /><rect x="104.846" y="371.327" width="161.349" height="8.222" rx="4.111" transform="rotate(-15 104.846 371.327)" fill="#fff" /><rect x="650.32" y="180.165" width="216.845" height="216.845" rx="61.151" transform="rotate(15 650.32 180.165)" fill="#666AF6" /><path fill="#666AF6" d="m705.007 396.97 15.065 26.093-26.093 15.065-15.065-26.093z" /><circle cx="682.185" cy="271.692" r="27.748" transform="rotate(15 682.185 271.692)" fill="#fff" /><rect x="724.092" y="270.153" width="93.521" height="8.222" rx="4.111" transform="rotate(15 724.092 270.153)" fill="#fff" /><rect x="643.945" y="307.196" width="161.349" height="8.222" rx="4.111" transform="rotate(15 643.945 307.196)" fill="#fff" /><rect x="718.24" y="291.992" width="93.521" height="8.222" rx="4.111" transform="rotate(15 718.24 291.992)" fill="#fff" /><rect x="638.094" y="329.035" width="161.349" height="8.222" rx="4.111" transform="rotate(15 638.094 329.035)" fill="#fff" /><circle r="14.469" transform="matrix(-1 0 0 1 284.469 209.469)" fill="#E1E4E5" /><circle r="10.027" transform="matrix(-1 0 0 1 617.028 180.028)" fill="#E1E4E5" /><circle r="18.496" transform="scale(1 -1) rotate(-75 -165.234 -400.777)" fill="#E1E4E5" /><circle r="12.644" transform="scale(1 -1) rotate(-75 -2.116 -576.705)" fill="#E1E4E5" /><path d="M492.909 425h.145c.859 12.641 9.912 12.836 9.912 12.836s-9.983.202-9.983 14.809c0-14.607-9.983-14.809-9.983-14.809s9.049-.195 9.909-12.836zm-177-19h.145c.859 12.641 9.912 12.836 9.912 12.836s-9.983.202-9.983 14.809c0-14.607-9.983-14.809-9.983-14.809s9.049-.195 9.909-12.836zm-94-264h.145c.859 12.641 9.912 12.836 9.912 12.836s-9.983.202-9.983 14.809c0-14.607-9.983-14.809-9.983-14.809s9.049-.195 9.909-12.836z" fill="#E1E4E5" /></svg>
                            <div>
                                <p>Be the first one to comment</p>
                            </div>
                        </div>
                    }
                    {replyState && replyState?.content &&
                        <div className='absolute bg-background gap-4 w-full h-full flex justify-between flex-col top-0 left-0 z-10'>
                            <div className='p-4 flex flex-col gap-4'>
                                {/* <div className='flex gap-2'>
                                    <ChevronLeft className='cursor-pointer' onClick={() => {
                                        setReplyState(null)
                                        setReplyTo(null)
                                    }} />
                                    <span>Replies</span>
                                </div> */}
                                <Comment reply={setReplyState} commentIndex={replyState.commentIndex} comment={replyState} pageIndex={pageIndex} postId={postData?._id} userId={user._id} commentRef={commentRef} key={replyState._id} isParent={true} />
                                <div className='pl-8 flex flex-col gap-2'>

                                    {!replies.isLoading && replies.data.length > 0 && replies.data.map((page, pageIndex) => {
                                        return page.replies.map((reply, replyIndex) => {
                                            return (
                                                <Reply reply={reply} pageIndex={pageIndex} replyIndex={replyIndex} postId={postData?._id} userId={user._id} replyRef={commentRef} key={replyState._id} setEditCommentModelState={setEditCommentModelState} editCommentModelState={editCommentModelState} setCommentDetails={setCommentDetails} />

                                            )
                                        })
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-2 items-center justify-center p-2 sticky bottom-0  bg-card w-full">
                                {!isRecording && <div className="flex items-center justify-center border border-primary h-11 rounded-md p-2 w-full">
                                    <svg width="25" className="fill-white dark:fill-white" cursor="pointer" height="22" viewBox="0 0 25 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="0.5" width="24" height="22" rx="4" fill="#433FFA" />
                                        <path d="M11.4545 16.3068V5.05682H13.3636V16.3068H11.4545ZM6.78409 11.6364V9.72727H18.0341V11.6364H6.78409Z" />
                                    </svg>
                                    <input
                                        ref={replyRef}
                                        type="search"
                                        placeholder="Start writing your comment..."
                                        className="w-full appearance-none bg-card pl-8 shadow-none border-none focus:outline-none"
                                    />
                                    <svg width="29" className="stroke-foreground dark:stroke-foreground" cursor="pointer" height="28" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11 16.3334C11.2115 16.8844 11.5581 17.3734 12.008 17.7556C13.4387 18.9564 15.5207 18.9716 16.9687 17.7917C17.4247 17.4164 17.7793 16.9326 18 16.3847" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M22.6666 14.0002C22.6666 18.5105 19.0102 22.1668 14.4999 22.1668C9.98959 22.1668 6.33325 18.5105 6.33325 14.0002C6.33325 9.48984 9.98959 5.8335 14.4999 5.8335C16.6659 5.8335 18.7431 6.69391 20.2746 8.22546C21.8062 9.757 22.6666 11.8342 22.6666 14.0002Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M10.9998 12.8337V11.667" stroke-width="1.5" stroke-linecap="round" />
                                        <path d="M17.9998 12.8337V11.667" stroke-width="1.5" stroke-linecap="round" />
                                    </svg>
                                </div>}
                                <AudioRecorder setIsRecordingMain={setIsRecording} onRecordingComplete={(audioBlob, uploadState, recordingTime) => {
                                    console.log(audioBlob, uploadState, 'audiorecorder')
                                    if (uploadState && replyState) {
                                        const url = URL.createObjectURL(audioBlob)
                                        setRecordingUrl(url)
                                        replyOnPost(audioBlob, recordingTime)
                                    }
                                }} />
                                {!isRecording && <Button className="m-0 bg-transparent  py-5 px-2 border-[2px] border-primary" onClick={() => {
                                    replyOnPost()
                                }} >
                                    <MdSend size={24} className="text-foreground"></MdSend>
                                </Button>}
                            </div>
                        </div>
                    }

                </div>
                {!replyState && !replyState?.content &&
                    <div className="flex gap-2 items-center justify-center p-2 sticky bottom-0 bg-card w-full">
                        {!isRecording && <div className="flex items-center justify-center border border-primary h-11 rounded-md p-2 w-full">
                            {/* <svg width="25" className="fill-white dark:fill-white" cursor="pointer" height="22" viewBox="0 0 25 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="0.5" width="24" height="22" rx="4" fill="#433FFA" />
                            <path d="M11.4545 16.3068V5.05682H13.3636V16.3068H11.4545ZM6.78409 11.6364V9.72727H18.0341V11.6364H6.78409Z" />
                        </svg> */}
                            <input
                                ref={commentRef}
                                type="search"
                                placeholder="Write your comment..."
                                className="w-full appearance-none bg-card pl-2 shadow-none border-none focus:outline-none"
                            />
                            <svg width="29" className="stroke-foreground dark:stroke-foreground" cursor="pointer" height="28" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 16.3334C11.2115 16.8844 11.5581 17.3734 12.008 17.7556C13.4387 18.9564 15.5207 18.9716 16.9687 17.7917C17.4247 17.4164 17.7793 16.9326 18 16.3847" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M22.6666 14.0002C22.6666 18.5105 19.0102 22.1668 14.4999 22.1668C9.98959 22.1668 6.33325 18.5105 6.33325 14.0002C6.33325 9.48984 9.98959 5.8335 14.4999 5.8335C16.6659 5.8335 18.7431 6.69391 20.2746 8.22546C21.8062 9.757 22.6666 11.8342 22.6666 14.0002Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M10.9998 12.8337V11.667" stroke-width="1.5" stroke-linecap="round" />
                                <path d="M17.9998 12.8337V11.667" stroke-width="1.5" stroke-linecap="round" />
                            </svg>
                        </div>}
                        <AudioRecorder setIsRecordingMain={setIsRecording} onRecordingComplete={(audioBlob, uploadState, recordingTime) => {
                            if (!replyState) {

                                console.log(audioBlob, uploadState, recordingTime, 'on recording complete')
                                const url = URL.createObjectURL(audioBlob)
                                setRecordingUrl(url)
                                if (uploadState) {
                                    commentOnPost(audioBlob, recordingTime)
                                }
                            }

                        }} />
                        {!isRecording &&
                            <Button className="m-0 bg-transparent  py-5 px-2 border-[2px] border-primary" onClick={() => {
                                commentOnPost()
                            }} >
                                <MdSend size={24} className="text-foreground"></MdSend>
                            </Button>
                        }
                    </div>}
            </div>

          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={() => {
          setOpen(false)
        }} />
      </Sheet>
    </>
  );
}

export default BottomComments