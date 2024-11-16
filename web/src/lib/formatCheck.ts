import { toast } from "react-toastify";

const supportedVideoFormats = [
    'video/mp4',
    'video/quicktime', // .mov files
];

const supportedImageFormats = [
    'image/jpeg',
    'image/png',
];

const supportedDocumentFormats = [
    'application/pdf',
];

const supportedFormats = [
    ...supportedVideoFormats,
    ...supportedImageFormats,
    ...supportedDocumentFormats
];

export const isValidFormat = (file: File): boolean => {
    return supportedFormats.includes(file.type);
};

export const isImage = (file: File): boolean => {
    return supportedImageFormats.includes(file.type);
};

export const isVideo = (file: File): boolean => {
    return supportedVideoFormats.includes(file.type);
};

export const isPDF = (file: File): boolean => {
    return file.type === 'application/pdf';
};

export const validateFile = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (isValidFormat(file)) {
            resolve();
        } else {
            reject(new Error('Unsupported file format. Please upload a JPEG, PNG, MP4, MOV, or PDF file.'));
        }
    });
};

export const handleFile = async (file) => {
    if (file) {
      try {
        await validateFile(file);
        return file
      } catch (err) {
        toast.error('Format not supported')
        return false
      }
    }
  };
