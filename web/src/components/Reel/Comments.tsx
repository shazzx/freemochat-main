import { useAppDispatch, useAppSelector } from '@/app/hooks'
import AudioRecorder from '@/components/MediaRecorder'
import Post from '@/components/Post'
import Comment from '@/components/Post/Comment'
import Reply from '@/components/Post/Reply'
import ScreenLoader from '@/components/ScreenLoader'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useComments, useCreateComment, useReplies, useReplyOnComment, useUpdateComment, useUpdateReply } from '@/hooks/Post/useComments'
import { ChevronLeft, Loader } from 'lucide-react'
import React, { FormEvent, useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { v4 as uuidv4 } from 'uuid'
import { MdSend } from 'react-icons/md'
import { toast } from 'react-toastify'
import { setClose } from '@/app/features/user/postModelSlice'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MentionsInput, { MentionReference } from '@/components/MentionsInput'
import { fetchUserMentionSuggestions } from '@/models/CPostModal'

function CommetsSection({ params, pageIndex, postId, postData, isReel }) {
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
    const stopRecordingRef = useRef(null)

    
    const [commentText, setCommentText] = useState("")
    const [commentMentionUserIds, setCommentMentionUserIds] = useState<string[]>([])
    const [commentMentionReferences, setCommentMentionReferences] = useState<MentionReference[]>([])

    
    const [replyText, setReplyText] = useState("")
    const [replyMentionUserIds, setReplyMentionUserIds] = useState<string[]>([])
    const [replyMentionReferences, setReplyMentionReferences] = useState<MentionReference[]>([])

    
    const [editText, setEditText] = useState("")
    const [editMentionUserIds, setEditMentionUserIds] = useState<string[]>([])
    const [editMentionReferences, setEditMentionReferences] = useState<MentionReference[]>([])

    const replies = useReplies(replyId)

    useEffect(() => {
        if (isLoading) {
            return
        }
        scrollRef.current.scrollTop = postData?.media ? 600 : 200
        console.log(mutation.data)
    }, [mutation.isSuccess, mutation.data, replyState, isLoading])

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
            
            setReplyText("")
            setReplyMentionUserIds([])
            setReplyMentionReferences([])
        }
    }, [replyState])

    
    const handleCommentMentionsChange = (internalText: string, userIds: string[], references: MentionReference[]) => {
        setCommentText(internalText)
        setCommentMentionUserIds(userIds)
        setCommentMentionReferences(references)
    }

    
    const handleReplyMentionsChange = (internalText: string, userIds: string[], references: MentionReference[]) => {
        setReplyText(internalText)
        setReplyMentionUserIds(userIds)
        setReplyMentionReferences(references)
    }

    
    const handleEditMentionsChange = (internalText: string, userIds: string[], references: MentionReference[]) => {
        setEditText(internalText)
        setEditMentionUserIds(userIds)
        setEditMentionReferences(references)
    }

    const commentOnPost = async (recordingUrl?, recordingTime?) => {
        if (!recordingUrl && !recordingTime && commentText.trim().length == 0) {
            toast.info("Comment can't be empty")
            return
        }

        let formData = new FormData()
        let commentDetails = {
            targetType: 'user',
            type: 'post',
            authorId: postData?.user?._id || postData?.user,
            postId,
            postType: postData?.postType || 'post',
            commentDetails: {
                postId,
                content: recordingUrl ? null : commentText,
                username: user?.username,
                mentions: commentMentionUserIds
            },
            mentions: commentMentionUserIds,
            uuid: uuidv4()
        }

        if (recordingUrl) {
            let url = URL.createObjectURL(recordingUrl)
            formData.append("file", recordingUrl)
            commentDetails["audio"] = { src: url }
            console.log(recordingTime, 'here we are')
            commentDetails.commentDetails["duration"] = recordingTime
        }
        formData.append("commentDetails", JSON.stringify(commentDetails))

        mutation.mutateAsync({ ...commentDetails, formData, mentionReferences: commentMentionReferences })
        console.log(mutation.data)

        
        setCommentText("")
        setCommentMentionUserIds([])
        setCommentMentionReferences([])
    }

    const reply = async (recordingUrl?, recordingTime?) => {
        if (!recordingUrl && !recordingTime && replyText.trim().length == 0) {
            toast.info("Reply can't be empty")
            return
        }

        let formData = new FormData()
        let replyData = {
            postId,
            targetType: 'user',
            type: 'post',
            commentAuthorId: replyState.user?._id || replyState.user,
            postType: postData?.postType || 'post',
            authorId: postData?.user?._id || postData?.user,
            replyDetails: {
                postId,
                content: replyText,
                mentions: replyMentionUserIds
            },
            mentions: replyMentionUserIds,
            commentId: replyState._id
        }

        if (recordingUrl && recordingTime) {
            let url = URL.createObjectURL(recordingUrl)
            formData.append("file", recordingUrl)
            replyData["audio"] = { src: url, duration: recordingTime }
            replyData.replyDetails["duration"] = recordingTime
        }
        formData.append("replyData", JSON.stringify(replyData))

        replyMutation.mutateAsync({ ...replyData, formData, mentionReferences: replyMentionReferences })

        
        setReplyText("")
        setReplyMentionUserIds([])
        setReplyMentionReferences([])
    }

    const [editCommentModelState, setEditCommentModelState] = useState(false)
    const [commentDetails, setCommentDetails] = useState(null)
    const updateComment = useUpdateComment(postId)
    const updateReply = useUpdateReply()

    
    useEffect(() => {
        if (editCommentModelState && commentDetails) {
            
            setEditText(commentDetails.content || "")

            
            const existingMentions = commentDetails.mentions || []
            const mentionUserIds = existingMentions.map(mention => {
                if (typeof mention === 'object' && mention !== null) {
                    return mention._id || mention.id || mention.userId || mention
                }
                return mention
            }).filter(Boolean)

            setEditMentionUserIds(mentionUserIds)
            setEditMentionReferences(commentDetails.mentions || [])
        }
    }, [editCommentModelState, commentDetails])

    
    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault()

        if (editText.trim().length < 1) {
            toast.info("Content can't be empty")
            return
        }

        if (commentDetails?.commentId && !commentDetails?.replyId) {
            
            const commentData = {
                ...commentDetails,
                commentDetails: {
                    postId,
                    content: editText,
                    mentions: editMentionUserIds
                },
                mentions: editMentionUserIds,
                mentionReferences: editMentionReferences
            }
            
            
            updateComment.mutate(commentData)

        } else {
            
            let replyDetails = {
                ...commentDetails,
                replyDetails: {
                    postId,
                    replyId: commentDetails.replyId,
                    content: editText,
                    mentions: editMentionUserIds
                },
                mentions: editMentionUserIds,
                mentionReferences: editMentionReferences
            }
            
            

            updateReply.mutate(replyDetails)
        }

        setEditCommentModelState(false)

        
        setEditText("")
        setEditMentionUserIds([])
        setEditMentionReferences([])
    }

    return (
        <div ref={scrollRef} className='z-10 sm:max-w-[30%] md:max-w-[35%] lg:max-w-[42%] h-screen w-full flex flex-col bg-background relative rounded-lg  scroll-smooth overflow-auto border-2 border-accent shadow-md'>
            {editCommentModelState &&
                <div className='absolute w-full h-full top-0 left-0 flex items-center justify-center backdrop-blur-[1.5px] z-50 '>
                    <div className='absolute w-full h-full top-0 left-0 z-10' onClick={() => {
                        setEditCommentModelState(false)
                        
                        setEditText("")
                        setEditMentionUserIds([])
                        setEditMentionReferences([])
                    }}>

                    </div>
                    <div className='flex flex-col gap-2 bg-card border-2 border-accent p-2 z-20 max-w-md w-full mx-4'>
                        <div>
                            <span>Update {commentDetails?.commentId ? 'Comment' : 'Reply'}</span>
                        </div>

                        <form className='flex flex-col gap-2' onSubmit={handleEditSubmit}>
                            <MentionsInput
                                value={editText}
                                onChangeText={handleEditMentionsChange}
                                placeholder={`Edit your ${commentDetails?.commentId ? 'comment' : 'reply'}... Type @ to mention users`}
                                className="border border-primary rounded-md p-2 min-h-[100px] max-h-[200px] bg-background"
                                onSuggestionsFetch={fetchUserMentionSuggestions}
                                initialReferences={commentDetails?.mentions ?
                                    commentDetails.mentions.map((user: any) => ({
                                        _id: user._id,
                                        username: user.username,
                                        firstname: user.firstname,
                                        lastname: user.lastname,
                                        profile: user.profile
                                    })) : []}
                                textLimit={500}
                            />
                            <div className="flex gap-2">
                                <Button type='submit' className="flex-1">Update</Button>
                                <Button
                                    type='button'
                                    variant="outline"
                                    onClick={() => {
                                        setEditCommentModelState(false)
                                        
                                        setEditText("")
                                        setEditMentionUserIds([])
                                        setEditMentionReferences([])
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            }

            <div className='relative bg-card w-full flex p-2'>
                <span className='w-full text-center text-lg relative right-[5%]'>Comments</span>
            </div>

            {!isLoading && <>
                <div className='relative p-4 flex h-full overflow-y-auto  flex-col gap-2'>
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
                                <div className='flex gap-2'>
                                    <ChevronLeft className='cursor-pointer' onClick={() => {
                                        setReplyState(null)
                                        setReplyTo(null)
                                    }} />
                                    <span>Replies</span>
                                </div>
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

                            <div className="flex gap-2 items-end justify-center p-2 sticky bottom-0 bg-card w-full">
                                {!isRecording &&
                                    <div className="flex-1">
                                        <MentionsInput
                                            value={replyText}
                                            onChangeText={handleReplyMentionsChange}
                                            placeholder="Start writing your reply... Type @ to mention users"
                                            className="border border-primary rounded-md p-2 min-h-[44px] max-h-[120px]"
                                            onSuggestionsFetch={fetchUserMentionSuggestions}
                                            textLimit={500}
                                        />
                                    </div>
                                }
                                <AudioRecorder stopRecordingRef={stopRecordingRef} setIsRecordingMain={setIsRecording} onRecordingComplete={(audioBlob, uploadState, recordingTime) => {
                                    console.log(audioBlob, uploadState, 'audiorecorder')
                                    if (uploadState && replyState) {
                                        const url = URL.createObjectURL(audioBlob)
                                        setRecordingUrl(url)
                                        reply(audioBlob, recordingTime)
                                    }
                                }} />
                                {!isRecording && <Button className="m-0 bg-transparent py-5 px-2 border-[2px] border-primary" onClick={() => {
                                    reply()
                                }} >
                                    <MdSend size={24} className="text-foreground"></MdSend>
                                </Button>}
                            </div>
                        </div>
                    }

                </div>

                {!replyState && !replyState?.content &&
                    <div className="flex gap-2 items-end justify-center p-2 sticky bottom-0 bg-card w-full">
                        {!isRecording &&
                            <div className="flex-1">
                                <MentionsInput
                                    value={commentText}
                                    onChangeText={handleCommentMentionsChange}
                                    placeholder="Write your comment... Type @ to mention users"
                                    className="border border-primary rounded-md p-2 min-h-[44px] max-h-[120px]"
                                    onSuggestionsFetch={fetchUserMentionSuggestions}
                                    textLimit={500}
                                />
                            </div>
                        }
                        <AudioRecorder stopRecordingRef={stopRecordingRef} setIsRecordingMain={setIsRecording} onRecordingComplete={(audioBlob, uploadState, recordingTime) => {
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
                            <Button className="m-0 bg-transparent py-5 px-2 border-[2px] border-primary" onClick={() => {
                                commentOnPost()
                            }} >
                                <MdSend size={24} className="text-foreground"></MdSend>
                            </Button>
                        }
                    </div>}
            </>
            }
            {isLoading &&
                <div className='flex flex-col items-center justify-center m-auto'>
                    <Loader />
                    <p>Loading...</p>
                </div>

            }
        </div>
    )
}

export default React.memo(CommetsSection)