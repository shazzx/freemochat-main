import { useEffect, useState } from 'react'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css';
import './imageCrop.css'

function ImageCrop({ imageBase64, imageSrc, uploadImage, setImageView, imageType, SetImageSrc, SetImageBase64 }) {
  let [crop, SetCrop] = useState()
  let [croppedImage, SetCroppedImage] = useState(undefined)
  let [croppedImageSrc, SetCroppedImageSrc] = useState(undefined)
  let [imageSizeState, SetImageSizeState] = useState(undefined)



  let [targetImage, SetTargetImage] = useState(undefined)

  let cropImage = (cropConfig) => {
    if (targetImage && cropConfig.width && cropConfig.height) {

      let canvas = document.createElement('canvas')
      let scaleX = targetImage.naturalWidth / targetImage.width
      let scaleY = targetImage.naturalHeight / targetImage.height

      canvas.width = cropConfig.width
      canvas.height = cropConfig.height

      let ctx = canvas.getContext('2d')

      ctx.drawImage(
        targetImage,
        cropConfig.x * scaleX,
        cropConfig.y * scaleY,
        cropConfig.width * scaleX,
        cropConfig.height * scaleY,
        0,
        0,
        cropConfig.width,
        cropConfig.height
      )

      canvas.toBlob((blob: any) => {
        blob.filename = imageSrc.name
        SetCroppedImageSrc(blob)
        SetCroppedImage(URL.createObjectURL(blob))
        setImageView(URL.createObjectURL(blob))

      }, 'image/jpeg')
    }
  }

  return (
    <div className='image_crop-main bg-card'>
      {/* Select Image and Convert it to readable URL */}
      {/* <input type="file" accept="image/*" name='image' onChange={(e) => {
        // SetImageSrc(e.target.files[0])
        const reader = new FileReader()
        reader.addEventListener('load', () => {
          const image = reader.result
          // SetImageBase64(image)
        })

        reader.readAsDataURL(e.target.files[0])
      }} /> */}

      <div className='image_crop-container'>
        <div>Edit Image</div>
        {
          imageType == "profile" &&

          <ReactCrop

            crop={crop && crop}
            aspect={16 / 16}
            keepSelection={false}
            minHeight={imageSizeState == "image-height" ? 80 : 150}
            onComplete={(cropConfig) => cropImage(cropConfig)}
            onChange={(c: any) => SetCrop(c)}
          >

            <div className={`image-crop ${imageSizeState && imageSizeState + "-plus"}`}>
              <img className={imageSizeState && imageSizeState} src={imageBase64 && imageBase64} alt="" onLoad={(image: any) => {
                image.target.naturalHeight > image.target.naturalWidth && SetImageSizeState('image-height')
                image.target.naturalWidth > image.target.naturalHeight && SetImageSizeState('image-width')
                let cropper = image.target.naturalHeight / image.target.naturalWidth


                SetTargetImage(image.target)

                let _target: any = {
                  unit: 'px',
                  width: image.target.height * 0.2,
                  height: image.target.height * 0.2,
                }
                image.target.naturalWidth > image.target.naturalHeight &&
                  SetCrop(_target)
                  let target: any = {
                    unit: 'px',
                    width: image.target.width * 0.3,
                    height: image.target.width * 0.3,
                  }
                image.target.naturalHeight > image.target.naturalWidth &&
                  SetCrop(target)


              }} />
            </div>
          </ReactCrop>
        }

        {imageType == "cover" &&

          <ReactCrop

            crop={crop && crop}
            aspect={16 / 6}
            keepSelection={true}
            minHeight={imageSizeState == "image-height" ? 50 : 100}
            onComplete={(cropConfig) => cropImage(cropConfig)}
            onChange={(c: any) => SetCrop(c)}
          >

            <div className={`image-crop ${imageSizeState && imageSizeState + "-plus"}`}>
              <img className={imageSizeState && imageSizeState} src={imageBase64 && imageBase64} alt="" onLoad={(image: any) => {

                image.target.naturalHeight > image.target.naturalWidth && SetImageSizeState('image-height')
                image.target.naturalWidth > image.target.naturalHeight && SetImageSizeState('image-width')

                let _target: any = {
                  unit: 'px',
                  width: image.target.height * 0.4,
                  height: image.target.height * 0.15,
                }
                SetTargetImage(image.target)
                image.target.naturalWidth > image.target.naturalHeight &&
                  SetCrop(_target)

                  let target: any = {
                    unit: 'px',
                    width: image.target.width * 0.25,
                    height: image.target.width * 0.090,
                  }
                image.target.naturalHeight > image.target.naturalWidth &&
                  SetCrop(target)
              }} />
            </div>
          </ReactCrop>}
        {
          croppedImage &&
          <div className='flex flex-col items-center justify-center'>
            <div>Preview</div>
            {imageType == "profile" && <div className='w-28 h-28 rounded-xl border-primary border-2 overflow-hidden'>
              <img src={crop && croppedImage && croppedImage} alt="" />
            </div>
            }
            {imageType == "cover" &&
              <div className='cropped-image-cover'>
                <img src={crop && croppedImage && croppedImage} alt="" />
              </div>
            }

          </div>
        }
        <div className='image-upload-btns'>

          <button className='image-upload-cancel' onClick={() => {
            SetImageSrc("")
            SetImageBase64("")
          }}>cancel</button>

          <button className='image-upload-upload' onClick={() => {
            croppedImageSrc && imageType && uploadImage(croppedImageSrc, imageType)
          }}>Update</button>
        </div>
      </div>

    </div>
  )
}

export default ImageCrop