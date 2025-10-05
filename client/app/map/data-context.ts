import { createContext } from 'react';
import { SearchParams, SortingOption } from '../lib/services/facilities';

export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export const DataContext = createContext<{
  selectedFacility: number | undefined,
  setSelectedFacility: SetState<number | undefined>,
  searchParams: SearchParams & {
    setMapBounds: SetState<google.maps.LatLngBounds | undefined>,
    setSearchValue: SetState<string>,
    setSelectedFilters: SetState<string[]>,
    setSelectedServiceTypes: SetState<string[]>,
    setSelectedCards: SetState<string[]>,
    setSortingOption: SetState<SortingOption>,
  }
}>({} as any);