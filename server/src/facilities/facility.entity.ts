import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { Point } from 'typeorm';

export type FacilityProvider = 'multisport' | 'medicover' | 'fitprofit';

export type ExportedFacility = Partial<Facility> | {
  location?: { lng: number, lat: number }
};

@Entity('facilities')
export class Facility {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'jsonb',
    nullable: true
  })
  sources: { provider: FacilityProvider; externalId: string }[];

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326
  })
  location: Point;

  @Column()
  streetName: string;

  @Column()
  streetNumber: string;

  @Column()
  postalCode: string;

  @Column()
  city: string;

  @Column()
  flatNumber?: string;

  @Column()
  district?: string;

  @Column({
    type: 'text',
    array: true
  })
  serviceTypes: string[];

  @Column({
    type: 'text',
    array: true
  })
  filters: string[];

  @Column({
    type: 'text',
    array: true
  })
  cards: string[];

  @Column()
  phone: string;

  @Column()
  email?: string;

  @Column()
  website?: string;

  @Column()
  fanpage?: string;

  @Column()
  description?: string;

  @Column({
    type: 'text',
    array: true,
    default: []
  })
  images: string[];

  @Column({
    type: 'text',
    array: true,
    default: []
  })
  openHours: string[];

  @Column()
  seasonal: boolean;

  @Column()
  open24h: boolean;

  export(
    includeFields: (keyof Facility)[] = [
      'id', 'name', 'streetName', 'streetNumber', 'postalCode',
      'city', 'flatNumber', 'district', 'serviceTypes',
      'cards', 'phone', 'email', 'website', 'fanpage', 'description',
      'images', 'openHours', 'seasonal', 'open24h', 'filters',
      'location'
    ]
  ) {
    const result: ExportedFacility = {};

    for (const field of includeFields)
      result[field] = this[field] as any;

    if (includeFields.includes('location')) {
      const [lng, lat] = this.location.coordinates;
      result.location = { lng, lat };
    }

    return result;
  }
}