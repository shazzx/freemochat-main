import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';
import { MongooseError } from 'mongoose';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown & {stack: unknown}, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus;
    let message: string;
    let errorCode: string;

    // Handle HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      errorCode = `${status}`;
    }
    // Handle MongoDB errors
    else if (exception instanceof MongoError || exception instanceof MongooseError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
      errorCode = 'MONGO_ERROR';
    }
    // Handle custom S3 upload exception
    // else if (exception instanceof S3UploadException) {
    //   status = exception.getStatus();
    //   message = exception.message;
    //   errorCode = 'S3_UPLOAD_ERROR';
    // }
    // Handle unknown exceptions
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      errorCode = 'INTERNAL_SERVER_ERROR';
    }

    Logger.error(`${request.method} ${request.url}`, exception.stack, 'Exception');

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      errorCode,
    });
  }
}