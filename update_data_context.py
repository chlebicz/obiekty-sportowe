import re

with open('client/app/map/data-context.ts', 'r') as f:
    content = f.read()

content = content.replace('''export const DataContext = createContext<{
  selectedFacility: number | undefined,
  setSelectedFacility: SetState<number | undefined>,
  searchParams: SearchParams & {
    setMapBounds: SetState<LatLngBounds | undefined>,
    setSearchValue: SetState<string>,
    setSelectedFilters: SetState<string[]>,
    setSelectedServiceTypes: SetState<string[]>,
    setSelectedCards: SetState<string[]>,
    setSortingOption: SetState<SortingOption>,
  },''', '''export const DataContext = createContext<{
  selectedFacility: number | undefined,
  setSelectedFacility: SetState<number | undefined>,
  searchParams: SearchParams & {
    setMapBounds: SetState<LatLngBounds | undefined>,
    setZoom: SetState<number | undefined>,
    setSearchValue: SetState<string>,
    setSelectedFilters: SetState<string[]>,
    setSelectedServiceTypes: SetState<string[]>,
    setSelectedCards: SetState<string[]>,
    setSortingOption: SetState<SortingOption>,
  },''')

with open('client/app/map/data-context.ts', 'w') as f:
    f.write(content)
