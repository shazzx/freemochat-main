import { PartialType } from '@nestjs/mapped-types';
import { CreateSnDto } from './create-sn.dto';

export class UpdateSnDto extends PartialType(CreateSnDto) {}
