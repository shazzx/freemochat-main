import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SnsService } from './sns.service';

@Controller('sns')
export class SnsController {
  constructor(private readonly snsService: SnsService) { }
}
