import { Test, TestingModule } from '@nestjs/testing';
import { FacilitiesController } from './facilities.controller';
import { FacilitiesService } from './facilities.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FacilityRepository } from './facility.repository';

describe('FacilitiesController', () => {
  let controller: FacilitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FacilitiesController],
      providers: [
        FacilitiesService,
        {
          provide: getRepositoryToken(FacilityRepository),
          useValue: {}
        }
      ]
    }).compile();

    controller = module.get<FacilitiesController>(FacilitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
