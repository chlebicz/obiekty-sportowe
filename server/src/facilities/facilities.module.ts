import { Module } from '@nestjs/common';
import { FacilitiesController } from './facilities.controller';
import { FacilitiesService } from './facilities.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Facility } from './facility.entity';
import { FacilityRepository } from './facility.repository';
import { DataSource } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Facility])],
  controllers: [FacilitiesController],
  providers: [
    FacilitiesService,
    {
      provide: FacilityRepository,
      useFactory: (dataSource) => new FacilityRepository(dataSource),
      inject: [DataSource],
    },
  ],
  exports: [FacilityRepository],
})
export class FacilitiesModule {}
