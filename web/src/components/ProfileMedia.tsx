import React from 'react'
import { Card } from './ui/card'

function ProfileMedia({ media, setMediaModelDetails, setMediaOpenDetails, setMediaOpenModel }) {
    console.log(media, 'media')
    return (
        <Card className='hidden lg:flex sticky top-2 flex-col h-fit gap-1 p-3'>
            <div>Media</div>
            {media.length > 0 && <div className='max-w-80 items-center flex gap-2 flex-wrap '>
                {media && media?.images?.length > 0 && media.images.map((media, i) => {
                    if (i >= 9) {
                        return null
                    }
                    if (!media || media == "https://bucketshazz.s3.amazonaws.com/3794ebd3-ccd4-4032-84a9-f460d1eeb622" || media == "https://bucketshazz.s3.amazonaws.com/34e61189-8fa0-4984-a885-7834c5bd47a0" || media == "https://bucketshazz.s3.amazonaws.com/42f6189f-3629-4797-b6fd-cb937a66eb2a") {
                        return null
                    }
                    return (
                        <div className='relative h-24 w-24 rounded-lg  overflow-hidden' onClick={() => {
                            setMediaModelDetails(media, setMediaOpenDetails, setMediaOpenModel, "image")
                        }}>
                            <img className='absolute inset-0 w-full h-full object-cover' src={media} alt="" />
                        </div>
                    )
                })}
            </div>}
            {media.length == 0 &&
                <div className='flex flex-col w-full items-center justify-center'>
                    <svg width="160" height="100" viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="transparent" d="M0 0h900v600H0z" /><path fill-rule="evenodd" clip-rule="evenodd" d="M249.841 115.734v250.041c0 13.572 10.867 24.563 24.287 24.563h147.186l64.25-91.581c3.063-4.369 10.722-4.369 13.786 0l22.494 32.07.175.25.152-.221 48.243-70.046c3.336-4.85 11.695-4.85 15.031 0l63.892 92.779v12.215-250.07c0-13.572-10.897-24.562-24.288-24.562H274.128c-13.42 0-24.287 10.99-24.287 24.562z" fill="#666AF6" /><path d="M362.501 281.935c-34.737 0-62.896-28.16-62.896-62.897 0-34.736 28.159-62.896 62.896-62.896s62.897 28.16 62.897 62.896c0 34.737-28.16 62.897-62.897 62.897z" fill="#fff" /><path d="M449.176 445.963H259.725c-7.79 0-14.188-6.399-14.188-14.188 0-7.882 6.398-14.281 14.188-14.281h189.451c7.882 0 14.28 6.399 14.28 14.281 0 7.789-6.398 14.188-14.28 14.188zm189.543.002H501.662c-7.882 0-14.281-6.399-14.281-14.281 0-7.882 6.399-14.281 14.281-14.281h137.057c7.883 0 14.281 6.399 14.281 14.281 0 7.882-6.398 14.281-14.281 14.281zm-298.503 62.592h-80.491c-7.79 0-14.188-6.398-14.188-14.188 0-7.882 6.398-14.281 14.188-14.281h80.491c7.882 0 14.281 6.399 14.281 14.281 0 7.79-6.399 14.188-14.281 14.188zm298.503.002H388.065c-7.882 0-14.28-6.398-14.28-14.28s6.398-14.281 14.28-14.281h250.654c7.883 0 14.281 6.399 14.281 14.281 0 7.882-6.398 14.28-14.281 14.28z" fill="#E1E4E5" /></svg>
                    <span>No Media</span>
                </div>}
            {/* <div className='flex flex-col gap-2'>
                {media && media?.videos?.length > 0 && media.videos.map((media) => {
                    return (
                        <div className='flex gap-2'>
                            <div className='max-w-24 max-h-24 rounded-md  overflow-hidden'>
                                <video className='w-full' src={media} controls/>
                            </div>
                        </div>
                    )
                })}
            </div> */}

        </Card>
    )
}

export default ProfileMedia