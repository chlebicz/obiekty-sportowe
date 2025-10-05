import { Test, TestingModule } from '@nestjs/testing';
import UpdateHandler from './update-handler';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FacilityRepository } from '../facilities/facility.repository';

describe(UpdateHandler, () => {
  let repo: FacilityRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(FacilityRepository),
          useValue: {}
        }
      ]
    }).compile();

    repo = module.get<FacilityRepository>(FacilityRepository);
  })
  
  it('yes', () => {
    expect(2 + 2).toEqual(4);
  });
});