import useFacilities from '@/app/hooks/useFacilities';
import { ServicesContext } from '@/app/lib/context';
import {
  FacilitiesService, FacilitySingleton, LatLngBounds, MapObj
} from '@/app/lib/services/facilities';
import { renderHook, RenderHookResult, waitFor } from '@testing-library/react';
import { act } from 'react';

const mockFindInBounds = jest.fn();

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ServicesContext.Provider value={
    {
      facilitiesService: { findOnMap: mockFindInBounds }
    } as unknown as { facilitiesService: FacilitiesService }
  }>
    {children}
  </ServicesContext.Provider>
);

describe(useFacilities, () => {
  it('fetches objects when bounds change', async () => {
    const mapBounds: LatLngBounds = {
      northEast: { lat: 52.25, lng: 21.10 },
      southWest: { lat: 52.20, lng: 21.00 },
    };

    const mockObjects: MapObj[] = [
      {
        type: 'singleton',
        value: { id: 1234, location: { lat: 52.22, lng: 21.05 } } as FacilitySingleton
      }
    ];

    mockFindInBounds.mockResolvedValue(mockObjects);

    const { result } = renderHook(() => useFacilities({ mapBounds }), { wrapper });

    await waitFor(() => {
      expect(result.current).toEqual(mockObjects);
    });
  });

  it('returns empty array if bounds is undefined', () => {
    const { result } = renderHook(() => useFacilities({}), { wrapper });
    expect(result.current).toEqual([]);
    expect(mockFindInBounds).not.toHaveBeenCalled();
  });
});