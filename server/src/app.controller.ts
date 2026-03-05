import { Controller, Get, HttpCode } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return 'hell world';
  }

  @Get('/teapot')
  @HttpCode(418)
  getTeapot() {
    return 'jestem czajnikiem!!!';
  }
}
