import { SetMetadata } from '@nestjs/common';

export const IsAdminRoute = () => SetMetadata('isAdminRoute', true);