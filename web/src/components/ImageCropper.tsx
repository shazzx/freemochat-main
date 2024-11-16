import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from './ui/button';

const ImageCropper = ({image, setCropperModel, aspect, _onCropComplete}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<  null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const showCroppedImage = useCallback(async () => {
    if (croppedAreaPixels && image) {
      try {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels);
        
        _onCropComplete(croppedImage)

        // Example of sending to server (replace with your actual API endpoint)
      } catch (e) {
        console.error('Error creating or uploading cropped image:', e);
      }
    }
  }, [croppedAreaPixels, image]);
console.log(image)
  return (
    <div className='z-50 w-full absolute h-full'>
      {image && (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
      )}
      <div className='absolute bottom-6 w-full gap-2 flex items-center justify-center'>
      <Button className='bg-background text-foreground' onClick={() => {
        setCropperModel(false)
      }} disabled={!image}>Cancel</Button>
      <Button onClick={() => {
        showCroppedImage()
        setCropperModel(false)
      }} disabled={!image}>Upload</Button>
      </div>
    </div>
  );
};

export default ImageCropper;