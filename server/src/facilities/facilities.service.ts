import { Injectable } from '@nestjs/common';
import { FacilityRepository, Location } from './facility.repository';
import {
  ExportedFacility, Facility, FacilityProvider
} from './facility.entity';

export type CreateFacilityParams = {
  name: string;
  sources: { provider: FacilityProvider, externalId: string }[];
  location: Location;
  streetName: string;
  streetNumber: string;
  postalCode: string;
  city: string;
  flatNumber: string;
  district: string;
  serviceTypes: string[];
  filters: string[];
  phone: string;
  email: string;
  website: string;
  fanpage: string;
  description: string;
  images: string[];
  openHours: string[];
  open24h: boolean;
  seasonal: boolean;
  cards: string[];
}

@Injectable()
export class FacilitiesService {
  constructor(
    private readonly facilitiesRepo: FacilityRepository
  ) {}

  async findOnMap({
    name, filters, serviceTypes, cards,
    bounds: {
      northEast,
      southWest
    }
  }: {
    bounds: {
      northEast: Location,
      southWest: Location
    },
    serviceTypes?: string[],
    filters?: string[],
    cards?: string[],
    name?: string
  }) {
    const raw = await this.facilitiesRepo.findOnMap({
      bounds: {
        neLat: northEast.lat,
        neLng: northEast.lng,
        swLat: southWest.lat,
        swLng: southWest.lng
      },
      serviceTypes: serviceTypes || [],
      filters: filters || [],
      cards: cards || [],
      name
    });

    return raw.map(rawObj => {
      const [lng, lat] = rawObj.value.location.coordinates;
      const { count, id } = rawObj.value;

      if (rawObj.type === 'cluster')
        return {
          type: 'cluster',
          value: { count, location: { lng, lat } }
        };

      return {
        type: 'singleton',
        value: { id, location: { lng, lat } }
      };
    });
  }

  async getFacilityData(id: number) {
    const facility = await this.facilitiesRepo.findOneBy({ id });
    if (!facility)
      throw new Error('unknown facility id');

    return facility.export();
  }

  remove(id: number) {
    return this.facilitiesRepo.delete({ id });
  }

  removeMany(ids: number[]) {
    return this.facilitiesRepo.delete(ids);
  }

  removeAll() {
    return this.facilitiesRepo.deleteAll();
  }

  getAll() {
    return this.facilitiesRepo.find();
  }

  async createFacility(params: CreateFacilityParams): Promise<Facility> {
    const facility = this.toFacility(params);
    await this.facilitiesRepo.insert(facility);
    return facility;
  }

  async createMany(params: CreateFacilityParams[]) {
    const facilities = params.map(p => this.toFacility(p));
    await this.facilitiesRepo.save(facilities, { chunk: 100 });
    return facilities;
  }

  toFacility({
    name,
    sources,
    location,
    streetName,
    streetNumber,
    postalCode,
    city,
    flatNumber,
    district,
    serviceTypes,
    phone,
    email,
    website,
    fanpage,
    description,
    images,
    open24h = false,
    openHours,
    seasonal = false,
    cards = [],
    filters
  }: CreateFacilityParams): Facility {
    return this.facilitiesRepo.create({
      name,
      sources,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat]
      },
      streetName,
      streetNumber,
      postalCode,
      city,
      flatNumber,
      district,
      serviceTypes,
      phone,
      email,
      website,
      fanpage,
      description,
      images,
      openHours,
      open24h,
      seasonal,
      cards,
      filters
    });
  }

  updateFacility(id: number, updated: Partial<CreateFacilityParams>) {
    const facility: Partial<Facility> = {};
    const copyFields: (keyof Facility & keyof CreateFacilityParams)[] = [
      'cards', 'city', 'description', 'district', 'email', 'fanpage',
      'filters', 'flatNumber', 'images', 'name', 'open24h', 'openHours',
      'phone', 'postalCode', 'seasonal', 'serviceTypes', 'streetName',
      'streetNumber', 'website'
    ];
    for (const field of copyFields) {
      if (updated[field])
        facility[field] = updated[field] as any;
    }

    if (updated.location) {
      const { lng, lat } = updated.location;
      facility.location = { type: 'Point', coordinates: [lng, lat] };
    }
  
    return this.facilitiesRepo.update({ id }, facility);
  }

  countFacilities() {
    return this.facilitiesRepo.count();
  }

  async search({
    name, filters, serviceTypes, cards, orderBy, page,
    bounds: {
      northEast,
      southWest
    }
  }: {
    name?: string,
    filters?: string[],
    serviceTypes?: string[],
    cards?: string[],
    orderBy?: 'name',
    bounds: {
      northEast: Location,
      southWest: Location
    },
    page?: number
  }): Promise<ExportedFacility[]> {
    const raw = await this.facilitiesRepo.fullSearch({
      bounds: {
        neLat: northEast.lat,
        neLng: northEast.lng,
        swLat: southWest.lat,
        swLng: southWest.lng
      },
      serviceTypes: serviceTypes || [],
      filters: filters || [],
      cards: cards || [],
      orderBy: orderBy || 'name',
      page: page || 0,
      name
    });

    return raw.map(
      el => el.export()
    );
  }

  fuzzySearch(input: string) {
    return this.facilitiesRepo.fuzzySearch(input);
  }

  distinctValuesCache: {
    [k in 'serviceTypes' | 'filters' | 'cards']?: string[]
  } = {};
  async getDistinctValues(arrayField: 'serviceTypes' | 'filters' | 'cards') {
    const cached = this.distinctValuesCache[arrayField];
    if (cached) return cached;

    const fetched = await this.facilitiesRepo.getDistinctValues(arrayField);
    this.distinctValuesCache[arrayField] = fetched;
    return fetched;
  }
}
