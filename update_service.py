import re

with open('server/src/facilities/facilities.service.ts', 'r') as f:
    content = f.read()

content = content.replace('''import { Injectable } from '@nestjs/common';
import { FacilityRepository, Location } from './facility.repository';
import {
  ExportedFacility,
  Facility,
  FacilityProvider,
} from './facility.entity';''', '''import { Injectable } from '@nestjs/common';
import { FacilityRepository, Location } from './facility.repository';
import {
  ExportedFacility,
  Facility,
  FacilityProvider,
} from './facility.entity';
import Supercluster from 'supercluster';''')

content = content.replace('''  async findOnMap({
    name,
    filters,
    serviceTypes,
    cards,
    bounds: { northEast, southWest },
  }: {
    bounds: {
      northEast: Location;
      southWest: Location;
    };
    serviceTypes?: string[];
    filters?: string[];
    cards?: string[];
    name?: string;
  }) {
    const raw = await this.facilitiesRepo.findOnMap({
      bounds: {
        neLat: northEast.lat,
        neLng: northEast.lng,
        swLat: southWest.lat,
        swLng: southWest.lng,
      },
      serviceTypes: serviceTypes || [],
      filters: filters || [],
      cards: cards || [],
      name,
    });

    return raw.map((rawObj) => {
      const [lng, lat] = rawObj.value.location.coordinates;
      const { count, id } = rawObj.value;

      if (rawObj.type === 'cluster')
        return {
          type: 'cluster',
          value: { count, location: { lng, lat } },
        };

      return {
        type: 'singleton',
        value: { id, location: { lng, lat } },
      };
    });
  }''', '''  async findOnMap({
    name,
    filters,
    serviceTypes,
    cards,
    bounds: { northEast, southWest },
    zoom
  }: {
    bounds: {
      northEast: Location;
      southWest: Location;
    };
    serviceTypes?: string[];
    filters?: string[];
    cards?: string[];
    name?: string;
    zoom: number;
  }) {
    const raw = await this.facilitiesRepo.findOnMap({
      bounds: {
        neLat: northEast.lat,
        neLng: northEast.lng,
        swLat: southWest.lat,
        swLng: southWest.lng,
      },
      serviceTypes: serviceTypes || [],
      filters: filters || [],
      cards: cards || [],
      name,
    });

    const index = new Supercluster({
      radius: 40,
      maxZoom: 16
    });

    const points = raw.map(obj => ({
      type: 'Feature',
      properties: { id: obj.id },
      geometry: {
        type: 'Point',
        coordinates: obj.location.coordinates
      }
    })) as any;

    index.load(points);

    const clusters = index.getClusters(
      [southWest.lng, southWest.lat, northEast.lng, northEast.lat],
      zoom
    );

    return clusters.map((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates;
      const props = cluster.properties;

      if (props.cluster)
        return {
          type: 'cluster',
          value: { count: props.point_count, location: { lng, lat } },
        };

      return {
        type: 'singleton',
        value: { id: props.id, location: { lng, lat } },
      };
    });
  }''')

with open('server/src/facilities/facilities.service.ts', 'w') as f:
    f.write(content)
