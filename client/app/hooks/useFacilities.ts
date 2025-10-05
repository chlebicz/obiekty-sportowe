import { useEffect, useState } from 'react';
import { useServices } from '../lib/context';
import { MapObj, SearchParams } from '../lib/services/facilities';

export default function useMapFacilities(params: Partial<SearchParams>) {
  const { facilitiesService } = useServices();
  const [objects, setObjects] = useState<MapObj[]>([]);

  useEffect(() => {
    if (!params.mapBounds) return;

    const controller = new AbortController();

    facilitiesService.findOnMap(params, { signal: controller.signal })
      .then(setObjects)
      .catch(() => {});

    return () => {
      controller.abort('Search parameters changed');
    };
  }, [
    params.searchValue,
    params.mapBounds,
    params.selectedCards,
    params.selectedFilters,
    params.selectedServiceTypes,
    params.sortingOption
  ]);

  return objects;
}