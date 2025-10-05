import { Test, TestingModule } from '@nestjs/testing';
import { FacilitiesService } from './facilities.service';
import { FacilityRepository } from './facility.repository';

describe('FacilitiesService', () => {
  let service: FacilitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacilitiesService,
        {
          provide: FacilityRepository,
          useValue: {}
        }
      ]
    }).compile();

    service = module.get<FacilitiesService>(FacilitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
