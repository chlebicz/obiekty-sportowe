import ApiClient, { RequestOptions } from '@/app/lib/api-client';
import { FacilitiesService, LatLngBounds } from '@/app/lib/services/facilities';

describe(FacilitiesService, () => {
  it('findInBounds fetches objects correctly', async () => {
    const bounds = {
      getNorthEast: () => ({ lat: () => 52.25, lng: () => 21.10 }),
      getSouthWest: () => ({ lat: () => 52.20, lng: () => 21.00 }),
    } as unknown as LatLngBounds;

    const mockGet = jest.fn(async (endpoint: string, { query }: RequestOptions = {}) => {
      if (endpoint !== '/facilities')
        return;

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      if (query!.nelat !== ne.lat() || query!.nelng !== ne.lng())
        return;
      if (query!.swlat !== sw.lat() || query!.swlng !== sw.lng())
        return;

      return {
        objects: [
          { name: 'Test object' }
        ]
      };
    });

    const mockApiClient = { get: mockGet } as unknown as ApiClient;
    const facilitiesService = new FacilitiesService(mockApiClient);

    const objects = await facilitiesService.findInBounds(bounds);
    
    expect(objects).toHaveLength(1);
    expect(objects[0]).toHaveProperty('name');
    expect(objects[0].name).toBe('Test object');
  });
});