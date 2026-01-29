import ApiClient from '@/app/lib/api-client';
import { FacilitiesService } from '@/app/lib/services/facilities';
import { Facility, FacilityProps } from '@/app/lib/model/facility';

// Mock ApiClient
const mockApiClient = {
  get: jest.fn()
} as unknown as ApiClient;

const createMockFacility = (id: number): Facility => {
  const props: FacilityProps = {
    id,
    name: `Facility ${id}`,
    location: { lat: 0, lng: 0 },
    streetName: 'Main St',
    streetNumber: '1',
    postalCode: '00-000',
    city: 'City',
    district: 'District',
    serviceTypes: [],
    filters: [],
    cards: [],
    phone: '123456789',
    images: [],
    openHours: [],
    seasonal: false,
    open24h: false
  };
  return new Facility(props);
};

describe('FacilitiesService Cache', () => {
  let service: FacilitiesService;

  beforeEach(() => {
    service = new FacilitiesService(mockApiClient);
    jest.clearAllMocks();
  });

  it('should respect the cache limit of 100', async () => {
    // Add 105 items
    for (let i = 1; i <= 105; i++) {
        (service as any).updateCache(createMockFacility(i));
    }

    const cache = (service as any).facilityCache as Map<number, Facility>;
    expect(cache.size).toBe(100);
  });

  it('should evict the oldest item (LRU)', async () => {
    // Add 100 items: 1 to 100
    for (let i = 1; i <= 100; i++) {
      (service as any).updateCache(createMockFacility(i));
    }

    const cache = (service as any).facilityCache as Map<number, Facility>;
    expect(cache.has(1)).toBe(true);
    expect(cache.has(100)).toBe(true);

    // Add 101st item
    (service as any).updateCache(createMockFacility(101));

    // Size should be 100
    expect(cache.size).toBe(100);
    // 1 should be gone (oldest)
    expect(cache.has(1)).toBe(false);
    // 2 should be there
    expect(cache.has(2)).toBe(true);
    // 101 should be there
    expect(cache.has(101)).toBe(true);
  });

  it('should refresh an item when accessed/updated', async () => {
    // Add 100 items: 1 to 100
    for (let i = 1; i <= 100; i++) {
      (service as any).updateCache(createMockFacility(i));
    }

    // Access item 1 again (refresh it)
    (service as any).updateCache(createMockFacility(1));

    // Now add 101st item
    (service as any).updateCache(createMockFacility(101));

    // Item 1 should STILL be there because it was refreshed
    const cache = (service as any).facilityCache as Map<number, Facility>;
    expect(cache.has(1)).toBe(true);

    // Item 2 should be gone (it became the oldest after 1 was refreshed)
    expect(cache.has(2)).toBe(false);
  });

  it('should refresh an item when accessed via getFacilityData', async () => {
      // Setup cache with item 1
      const f1 = createMockFacility(1);
      (service as any).updateCache(f1);

      // Fill up to 100 (items 2 to 100)
      for(let i=2; i<=100; i++) {
          (service as any).updateCache(createMockFacility(i));
      }

      // Call getFacilityData(1) - should hit cache and refresh it.
      await service.getFacilityData(1);

      // Add 101
      (service as any).updateCache(createMockFacility(101));

      const cache = (service as any).facilityCache as Map<number, Facility>;
      // 1 should be present
      expect(cache.has(1)).toBe(true);
      // 2 should be evicted
      expect(cache.has(2)).toBe(false);
  });
});
