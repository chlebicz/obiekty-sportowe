import re

with open('client/app/lib/services/facilities.ts', 'r') as f:
    content = f.read()

content = content.replace('''export interface SearchParams {
  mapBounds?: LatLngBounds;
  searchValue?: string;
  selectedFilters: string[];
  selectedServiceTypes: string[];
  selectedCards: string[];
  sortingOption?: SortingOption;
}''', '''export interface SearchParams {
  mapBounds?: LatLngBounds;
  zoom?: number;
  searchValue?: string;
  selectedFilters: string[];
  selectedServiceTypes: string[];
  selectedCards: string[];
  sortingOption?: SortingOption;
}''')

content = content.replace('''  async findOnMap(
    {
      searchValue,

      mapBounds,

      selectedCards,
      selectedFilters,
      selectedServiceTypes
    }: Partial<SearchParams>, options?: { signal?: AbortSignal }
  ) : Promise<MapObj[]> {
    const { signal } = options || {};

    const ne = mapBounds!.northEast;
    const sw = mapBounds!.southWest;

    return this.apiClient.get('/facilities/map', {
      query: {
        nelat: ne.lat,
        nelng: ne.lng,
        swlat: sw.lat,
        swlng: sw.lng,
        name: searchValue,
        cards: selectedCards,
        service_types: selectedServiceTypes,
        filters: selectedFilters
      },
      signal
    })''', '''  async findOnMap(
    {
      searchValue,

      mapBounds,
      zoom,

      selectedCards,
      selectedFilters,
      selectedServiceTypes
    }: Partial<SearchParams>, options?: { signal?: AbortSignal }
  ) : Promise<MapObj[]> {
    const { signal } = options || {};

    const ne = mapBounds!.northEast;
    const sw = mapBounds!.southWest;

    return this.apiClient.get('/facilities/map', {
      query: {
        nelat: ne.lat,
        nelng: ne.lng,
        swlat: sw.lat,
        swlng: sw.lng,
        zoom: zoom ?? 9,
        name: searchValue,
        cards: selectedCards,
        service_types: selectedServiceTypes,
        filters: selectedFilters
      },
      signal
    })''')

with open('client/app/lib/services/facilities.ts', 'w') as f:
    f.write(content)
