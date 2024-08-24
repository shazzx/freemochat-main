import { PipeTransform, Injectable, BadRequestException, UnprocessableEntityException } from '@nestjs/common';

const supportedVideoFormats = [
  'video/mp4',
  'video/quicktime',
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

@Injectable()
export class FileValidatorPipe implements PipeTransform {
  transform(value: Express.Multer.File) {
    if (!supportedFormats.includes(value.mimetype)) {
      throw new UnprocessableEntityException('Unsupported file format. Please upload a JPEG, PNG, MP4, MOV, or PDF file.');
    }
    return value;
  }
}