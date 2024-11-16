import React, { useEffect, useState } from 'react'
import './imageupload.css'
import profile from '../assets/profile.gif'
import upload from '../assets/icons/upload.svg'
import axiosClient from '../api/axiosClient';

const ImageUpload = ({user, imageEditModelState}) => {
  let [imageUploadURL, SetImageUploadURL] = useState(null);
  let [newProfileURL, SetNewProfileURL] = useState(null);
  let [imageUploadError, SetImageUploadError] = useState();
  let profile = "http://localhost:5050/user/media/image/" + user.images.profile.name

  let uploadImage = async(e) => {
    e.preventDefault();
    let formData = new FormData()
    if(!imageUploadURL){
      SetImageUploadError("please select image")
      return
    }
    SetImageUploadError("")

    formData.append("image", imageUploadURL);
    formData.append("imageDetails", JSON.stringify({
      imageType : "profile",
      userId : user._id,
    }))
    
    let {data} = await axiosClient.post("/user/upload/image", formData, {headers : {'Content-Type': 'multipart/form-data'}})
    
    SetImageUploadURL(null)
    imageEditModelState(data.path.name, false)
    SetNewProfileURL(data.path.name)
  }

  useEffect(() => {
    if(newProfileURL){
      profile = newProfileURL
    }
  }, [newProfileURL])
  
  return (
    <div className='image-upload_container'>
        <div className='cropper-container'>
          <img src={imageUploadURL ? URL.createObjectURL(imageUploadURL) : profile} />
        </div>

          <form onSubmit={uploadImage} className='image-upload_form'>
            <label htmlFor="image">
              <img src={upload} alt="" />
            </label>
            <input className='hidden' type="file" id='image' accept='image/*' name='image' onChange={
              (e) => {
                SetImageUploadURL(e.target.files[0])
                SetImageUploadError("")
              }
            } />
            <div>{imageUploadError}</div>
            <div>

            <button type="button" onClick={() => {
              SetImageUploadURL(null)
              imageEditModelState(false)
            }}>Cancel</button>
            <button type='submit'>Save</button>
            </div>
          </form>
    </div>
  )
}

export default ImageUpload
