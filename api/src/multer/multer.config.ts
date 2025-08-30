import { Request } from 'express';
import multer from 'multer';

const storage = multer.diskStorage({
  destination: './uploads',
});

const fileFilter = (req: Request, file: any, cb: Function) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

export const upload = multer({ storage, fileFilter });
