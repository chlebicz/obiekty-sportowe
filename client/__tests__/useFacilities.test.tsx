import useFacilities, { MapObj } from '@/app/hooks/useFacilities';
import { ServicesContext } from '@/app/lib/context';
import { FacilitiesService, LatLngBounds } from '@/app/lib/services/facilities';
import { renderHook } from '@testing-library/react';

const mockFindInBounds = jest.fn();

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ServicesContext.Provider value={
    {
      facilitiesService: { findInBounds: mockFindInBounds }
    } as unknown as { facilitiesService: FacilitiesService }
  }>
    {children}
  </ServicesContext.Provider>
);

describe(useFacilities, () => {
  it('fetches objects when bounds change', async () => {
    const bounds = {
      getNorthEast: () => ({ lat: () => 52.25, lng: () => 21.10 }),
      getSouthWest: () => ({ lat: () => 52.20, lng: () => 21.00 }),
    } as unknown as LatLngBounds;

    const mockObjects: MapObj[] = [
      { id: 1, label: 'Test object', pos: { lat: 52.22, lng: 21.05 } }
    ];

    mockFindInBounds.mockResolvedValueOnce(mockObjects);

    const { result, rerender } = renderHook(() => useFacilities(bounds), { wrapper });

    rerender();

    expect(result.current).toEqual(mockObjects);
    expect(mockFindInBounds).toHaveBeenCalledWith(bounds);
  });

  it('returns empty array if bounds is undefined', () => {
    const { result } = renderHook(() => useFacilities(undefined), { wrapper });
    expect(result.current).toEqual([]);
    expect(mockFindInBounds).not.toHaveBeenCalled();
  });
});