import { Test, TestingModule } from '@nestjs/testing';
import { FacilitiesService } from './facilities.service';
import { FacilityRepository } from './facility.repository';

describe('FacilitiesService', () => {
  let service: FacilitiesService;
  let repo: Partial<FacilityRepository>;

  const mockDistinctValues = ['val1', 'val2'];

  beforeEach(async () => {
    repo = {
      getDistinctValues: jest.fn().mockResolvedValue(mockDistinctValues),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacilitiesService,
        {
          provide: FacilityRepository,
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<FacilitiesService>(FacilitiesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDistinctValues', () => {
    it('should fetch from repo if cache is empty', async () => {
      const result = await service.getDistinctValues('serviceTypes');
      expect(repo.getDistinctValues).toHaveBeenCalledWith('serviceTypes');
      expect(result).toEqual(mockDistinctValues);
    });

    it('should return cached value if cache is valid', async () => {
      // First call populates cache
      await service.getDistinctValues('serviceTypes');
      expect(repo.getDistinctValues).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result = await service.getDistinctValues('serviceTypes');
      expect(repo.getDistinctValues).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDistinctValues);
    });

    it('should re-fetch if cache is expired', async () => {
      // Mock Date.now
      const now = 1000000;
      jest.spyOn(Date, 'now').mockReturnValue(now);

      // Populate cache
      await service.getDistinctValues('serviceTypes');
      expect(repo.getDistinctValues).toHaveBeenCalledTimes(1);

      // Advance time beyond TTL (1 hour + 1ms)
      jest.spyOn(Date, 'now').mockReturnValue(now + 3600 * 1000 + 1);

      // Should fetch again
      const result = await service.getDistinctValues('serviceTypes');
      expect(repo.getDistinctValues).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockDistinctValues);
    });
  });
});
