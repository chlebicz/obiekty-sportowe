import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import UpdateHandler from './update-handler';
import { FacilitiesService } from 'src/facilities/facilities.service';

async function run() {
  const context = await NestFactory.createApplicationContext(AppModule);
  const facilitiesService = context.get(FacilitiesService);

  const updateHandler = new UpdateHandler(facilitiesService);

  const keepCache = process.argv.includes('--keep-cache');
  await updateHandler.update(keepCache);
}

run();