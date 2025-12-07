import ApiClient, { RequestOptions } from '@/app/lib/api-client';
import {
  FacilitiesService, isSingleton, LatLngBounds, FacilitySingleton
} from '@/app/lib/services/facilities';

describe(FacilitiesService, () => {
  it('findInBounds fetches objects correctly', async () => {
    const mapBounds: LatLngBounds = {
      northEast: { lat: 0, lng: 1 },
      southWest: { lat: 2, lng: 3 },
    };

    const mockGet = jest.fn(async (endpoint: string, { query }: RequestOptions = {}) => {
      if (endpoint !== '/facilities/map')
        return;

      const ne = mapBounds.northEast;
      const sw = mapBounds.southWest;

      if (query!.nelat !== ne.lat || query!.nelng !== ne.lng)
        return;
      if (query!.swlat !== sw.lat || query!.swlng !== sw.lng)
        return;

      return {
        objects: [
          { type: 'singleton', value: { id: '1234' } }
        ]
      };
    });

    const mockApiClient = { get: mockGet } as unknown as ApiClient;
    const facilitiesService = new FacilitiesService(mockApiClient);

    const objects = await facilitiesService.findOnMap({
      mapBounds
    });
    
    expect(objects).toHaveLength(1);
    expect(isSingleton(objects[0])).toBe(true);
    expect((objects[0].value as FacilitySingleton).id).toBe('1234');
  });
});