import ApiClient from '../api-client';
import { Facility, FacilityProps } from '../model/facility';

export interface LatLngBounds {
  getNorthEast(): { lat(): number, lng(): number },
  getSouthWest(): { lat(): number, lng(): number }
}

export interface FuzzySearchResult {
  id: number;
  name: string;
  city: string;
}

export type SortingOption = 'name' | 'distance' | 'rating';

export interface SearchParams {
  mapBounds?: google.maps.LatLngBounds;
  searchValue?: string;
  selectedFilters: string[];
  selectedServiceTypes: string[];
  selectedCards: string[];
  sortingOption?: SortingOption;
}

export interface FacilitySingleton {
  id: number;
  name: string;
  location: { lng: number, lat: number };
}

export interface FacilityCluster {
  count: number;
  location: { lng: number, lat: number };
}

export interface MapObj {
  type: 'singleton' | 'cluster';
  value: FacilitySingleton | FacilityCluster;
}

interface SingletonMapObj {
  type: 'singleton';
  value: FacilitySingleton;
}

export function isSingleton(obj: MapObj): obj is SingletonMapObj {
  return obj.type === 'singleton';
}

export class FacilitiesService {
  constructor(private apiClient: ApiClient) {}

  // TODO: limit elements in cache
  private facilityCache = new Map<number, Facility>();

  async findOnMap(
    {
      searchValue,

      mapBounds,

      selectedCards,
      selectedFilters,
      selectedServiceTypes
    }: Partial<SearchParams>, options?: { signal?: AbortSignal }
  ) : Promise<MapObj[]> {
    const { signal } = options || {};

    const ne = mapBounds!.getNorthEast();
    const sw = mapBounds!.getSouthWest();

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
    })
      .then(json => {
        if (!json.objects)
          throw new Error();

        return json.objects;
      })
      .catch(err => {
        console.error(err);

        return [];
      });
  }

  async fullSearch(
    {
      searchValue,

      mapBounds,

      selectedCards,
      selectedFilters,
      selectedServiceTypes,

      sortingOption,

      page
    }:
      Partial<SearchParams> & {
        page?: number
      },
    options?: { signal?: AbortSignal }
  ): Promise<Facility[]> {
    const { signal } = options || {};

    const ne = mapBounds!.getNorthEast();
    const sw = mapBounds!.getSouthWest();

    if (sortingOption && sortingOption !== 'name')
      throw new Error('sorting option not supported yet');

    return this.apiClient.get('/facilities/search', {
      query: {
        nelat: ne.lat,
        nelng: ne.lng,
        swlat: sw.lat,
        swlng: sw.lng,
        name: searchValue,
        cards: selectedCards,
        service_types: selectedServiceTypes,
        filters: selectedFilters,
        orderby: sortingOption,
        page
      },
      signal
    })
      .then(json => {
        if (!json.objects)
          throw new Error();

        const result: Facility[] = json.objects
          .map((props: FacilityProps) => new Facility(props));

        for (const facility of result)
          this.facilityCache.set(facility.id, facility);

        return result;
      })
      .catch(err => {
        console.error(err);

        return [];
      });
  }

  async getFacilityData(id: number) {
    const cachedFacility = this.facilityCache.get(id);
    if (cachedFacility) return cachedFacility;

    let props: FacilityProps;
    try {
      props = await this.apiClient.get('/facilities/' + id);
    } catch {
      return;
    }

    const result = new Facility(props);
    this.facilityCache.set(result.id, result);
    return result;
  }

  fuzzySearch(input: string): Promise<FuzzySearchResult[]> {
    return this.apiClient.get('/facilities/fuzzy-search', {
      query: { input }
    });
  }

  async getStaticSearchParams(): Promise<{
    filters: string[], cards: string[], serviceTypes: string[]
  }> {
    const [filters, cards, serviceTypes] = await Promise.all([
      await this.apiClient.get('/facilities/filters'),
      await this.apiClient.get('/facilities/cards'),
      await this.apiClient.get('/facilities/service-types')
    ]);

    return {
      filters, cards, serviceTypes 
    };
  }
}

const facilitiesService = new FacilitiesService(new ApiClient());

export default facilitiesService;