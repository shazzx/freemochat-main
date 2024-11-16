import { Controller } from '@nestjs/common';
import { BackgroundjobsService } from './backgroundjobs.service';

@Controller('backgroundjobs')
export class BackgroundjobsController {
  constructor(private readonly backgroundjobsService: BackgroundjobsService) {}
}
