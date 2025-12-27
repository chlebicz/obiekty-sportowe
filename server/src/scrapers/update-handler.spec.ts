// Mock before imports to avoid loading the ESM module that breaks Jest
jest.mock('./semantic-matcher', () => ({
  SemanticMatcher: {
    getInstance: () => ({
      init: jest.fn(),
      generateEmbedding: jest.fn(),
    }),
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import UpdateHandler from './update-handler';
import { FacilitiesService } from '../facilities/facilities.service';
import { FacilityMatcher } from './facility-matcher';

// Mock dependencies
jest.mock('./multisport', () => {
  return jest.fn().mockImplementation(() => ({
    setFetcher: jest.fn(),
    scrape: jest.fn().mockResolvedValue([]),
  }));
});
jest.mock('./medicover', () => {
  return jest.fn().mockImplementation(() => ({
    setFetcher: jest.fn(),
    scrape: jest.fn().mockResolvedValue([]),
  }));
});
jest.mock('./provider-aggregator', () => {
  return jest.fn().mockImplementation(() => ({
    combineTwoSets: jest.fn().mockResolvedValue([]),
  }));
});

describe('UpdateHandler', () => {
  let updateHandler: UpdateHandler;
  let facilitiesService: FacilitiesService;
  let facilityMatcher: FacilityMatcher;

  const mockFacilitiesService = {
    getAll: jest.fn(),
    createMany: jest.fn(),
    updateFacility: jest.fn(),
    removeMany: jest.fn(),
    removeAll: jest.fn(),
  };

  beforeEach(async () => {
    // We can just instantiate the class directly for unit testing since it doesn't use DI heavily in the logic we are testing,
    // but let's stick to the NestJS Test module if possible.
    // However, the error suggests `this.facilitiesService` is undefined.

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: UpdateHandler,
          useFactory: (fs: FacilitiesService) => new UpdateHandler(fs),
          inject: [FacilitiesService]
        },
        {
          provide: FacilitiesService,
          useValue: mockFacilitiesService,
        },
      ],
    }).compile();

    updateHandler = module.get<UpdateHandler>(UpdateHandler);
    facilitiesService = module.get<FacilitiesService>(FacilitiesService);
    facilityMatcher = FacilityMatcher.getInstance();

    // Mock FacilityMatcher methods
    jest.spyOn(facilityMatcher, 'init').mockResolvedValue(undefined);
    jest.spyOn(facilityMatcher, 'generateEmbedding').mockResolvedValue({
      similarity: jest.fn(),
    } as any);
    jest.spyOn(facilityMatcher, 'getTextForEmbedding').mockReturnValue('some text');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('reconcile', () => {
    it('should insert new facilities when no match found', async () => {
      mockFacilitiesService.getAll.mockResolvedValue([]);
      const scrapedFacilities = [{ name: 'New Gym', city: 'Warsaw', location: { lat: 0, lng: 0 } }];

      // Mock findBestMatch to return no match
      jest.spyOn(facilityMatcher, 'findBestMatch').mockResolvedValue({ match: null, score: 0 });

      await updateHandler.reconcile(scrapedFacilities as any);

      expect(mockFacilitiesService.createMany).toHaveBeenCalledWith(scrapedFacilities);
      expect(mockFacilitiesService.updateFacility).not.toHaveBeenCalled();
      expect(mockFacilitiesService.removeMany).not.toHaveBeenCalled();
    });

    it('should update existing facilities when match found', async () => {
      const existingFacility = { id: 1, name: 'Old Gym', city: 'Warsaw', location: { coordinates: [0, 0] } };
      mockFacilitiesService.getAll.mockResolvedValue([existingFacility]);
      const scrapedFacilities = [{ name: 'Old Gym Updated', city: 'Warsaw', location: { lat: 0, lng: 0 } }];

      // Mock findBestMatch to return match
      jest.spyOn(facilityMatcher, 'findBestMatch').mockResolvedValue({ match: existingFacility as any, score: 0.95 });

      await updateHandler.reconcile(scrapedFacilities as any);

      expect(mockFacilitiesService.updateFacility).toHaveBeenCalledWith(1, scrapedFacilities[0]);
      expect(mockFacilitiesService.createMany).not.toHaveBeenCalled();
      expect(mockFacilitiesService.removeMany).not.toHaveBeenCalled();
    });

    it('should delete facilities that exist in DB but not in scraped data', async () => {
      const existingFacility = { id: 1, name: 'Old Gym', city: 'Warsaw', location: { coordinates: [0, 0] } };
      mockFacilitiesService.getAll.mockResolvedValue([existingFacility]);
      const scrapedFacilities = []; // Empty scrape

      await updateHandler.reconcile(scrapedFacilities as any);

      expect(mockFacilitiesService.removeMany).toHaveBeenCalledWith([1]);
      expect(mockFacilitiesService.createMany).not.toHaveBeenCalled();
      expect(mockFacilitiesService.updateFacility).not.toHaveBeenCalled();
    });

    it('should handle mixed operations (insert, update, delete)', async () => {
      const existing1 = { id: 1, name: 'Keep Me', city: 'Warsaw', location: { coordinates: [0, 0] } }; // Will match
      const existing2 = { id: 2, name: 'Delete Me', city: 'Warsaw', location: { coordinates: [0, 0] } }; // Won't match
      mockFacilitiesService.getAll.mockResolvedValue([existing1, existing2]);

      const scraped1 = { name: 'Keep Me Updated', city: 'Warsaw', location: { lat: 0, lng: 0 } }; // Match existing1
      const scraped2 = { name: 'New One', city: 'Warsaw', location: { lat: 0, lng: 0 } }; // New

      // Mock findBestMatch logic
      const findBestMatchSpy = jest.spyOn(facilityMatcher, 'findBestMatch');
      findBestMatchSpy.mockImplementation(async (target, candidates) => {
        if (target.name === 'Keep Me Updated') {
            return { match: existing1 as any, score: 0.95 };
        }
        return { match: null, score: 0 };
      });

      await updateHandler.reconcile([scraped1, scraped2] as any);

      expect(mockFacilitiesService.updateFacility).toHaveBeenCalledWith(1, scraped1);
      expect(mockFacilitiesService.createMany).toHaveBeenCalledWith([scraped2]);
      expect(mockFacilitiesService.removeMany).toHaveBeenCalledWith([2]);
    });
  });
});
