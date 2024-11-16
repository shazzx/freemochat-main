import { Module } from '@nestjs/common';
import { IsAdminRoute } from './isAdminRoute.decorator';

export function AdminModule(metadata: any) {
  return (target: any) => {
    Module(metadata)(target);
    Reflect.defineMetadata('isAdminRoute', true, target);
  };
}