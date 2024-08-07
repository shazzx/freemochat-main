import { Request } from 'express';
import multer from 'multer';

const storage = multer.diskStorage({
  destination: './uploads', // Adjust the destination path as needed
});

const fileFilter = (req: Request, file: any, cb: Function) => {
  // Define allowed file types (e.g., images only)
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

export const upload = multer({ storage, fileFilter });
