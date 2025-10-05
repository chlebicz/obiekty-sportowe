import { useEffect, useState } from 'react';
import { useServices } from '../lib/context';
import { SearchParams } from '../lib/services/facilities';
import { Facility } from '../lib/model/facility';

export function getSearchParamDeps(params: Partial<SearchParams>) {
  return [
    params.searchValue,
    JSON.stringify(params.mapBounds),
    JSON.stringify(params.selectedCards),
    JSON.stringify(params.selectedFilters),
    JSON.stringify(params.selectedServiceTypes),
    params.sortingOption
  ];
}

export default function useFullSearch(
  params: Partial<SearchParams>, page?: number
) {
  const { facilitiesService } = useServices();
  const [objects, setObjects] = useState<Facility[]>([]);

  useEffect(() => {
    if (!params.mapBounds) return;

    const controller = new AbortController();

    facilitiesService.fullSearch(
      { ...params },
      { signal: controller.signal }
    )
      .then(setObjects)
      .catch(() => {});

    return () => {
      controller.abort();
    };
  }, getSearchParamDeps(params));

  useEffect(() => {
    if (page === 0)
      return;

    const controller = new AbortController();

    facilitiesService.fullSearch(
      { ...params, page },
      { signal: controller.signal }
    )
      .then(nextPage => setObjects([...objects, ...nextPage]))
      .catch(() => {});

    return () => {
      controller.abort();
    };
  }, [page]);

  return objects;
}