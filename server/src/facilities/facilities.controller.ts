import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseFloatPipe,
  Query
} from '@nestjs/common';
import { FacilitiesService } from './facilities.service';

@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Get('/search')
  async searchFullFacilities(
    @Query('name') name: string,
    @Query('filters') filters: string[],
    @Query('service_types') serviceTypes: string[],
    @Query('cards') cards: string[],
    @Query('orderby') orderBy: string,
    @Query('nelng', ParseFloatPipe) northEastLng: number,
    @Query('nelat', ParseFloatPipe) northEastLat: number,
    @Query('swlng', ParseFloatPipe) southWestLng: number,
    @Query('swlat', ParseFloatPipe) southWestLat: number,
    @Query('page') rawPage: string
  ) {
    // little workaround
    if (typeof cards === 'string')
      cards = [cards];
    if (typeof serviceTypes === 'string')
      serviceTypes = [serviceTypes];
    if (typeof filters === 'string')
      filters = [filters];

    const page = parseInt(rawPage);
    if (rawPage && isNaN(page))
      throw new BadRequestException('invalid page');

    if (orderBy && orderBy !== 'name')
      throw new BadRequestException('invalid sorting option')

    const foundFacilities = await this.facilitiesService.search({
      name, filters, serviceTypes, cards, orderBy: orderBy as any,
      bounds: {
        northEast: { lng: northEastLng, lat: northEastLat },
        southWest: { lng: southWestLng, lat: southWestLat }
      },
      page
    });

    return {
      objects: foundFacilities
    };
  }

  @Get('/map')
  async searchFacilitiesOnMap(
    @Query('name') name: string,
    @Query('filters') filters: string[],
    @Query('service_types') serviceTypes: string[],
    @Query('cards') cards: string[],
    @Query('nelng', ParseFloatPipe) northEastLng: number,
    @Query('nelat', ParseFloatPipe) northEastLat: number,
    @Query('swlng', ParseFloatPipe) southWestLng: number,
    @Query('swlat', ParseFloatPipe) southWestLat: number
  ) {
    // little workaround
    if (typeof cards === 'string')
      cards = [cards];
    if (typeof serviceTypes === 'string')
      serviceTypes = [serviceTypes];
    if (typeof filters === 'string')
      filters = [filters];

    const foundFacilities = await this.facilitiesService.findOnMap({
      bounds: {
        northEast: { lng: northEastLng, lat: northEastLat },
        southWest: { lng: southWestLng, lat: southWestLat }
      },
      name, filters, serviceTypes, cards
    });

    return {
      objects: foundFacilities
    };
  }

  @Get('/fuzzy-search')
  fuzzySearch(@Query('input') input: string) {
    // TODO: address search

    return this.facilitiesService.fuzzySearch(input);
  }

  @Get('/service-types')
  getServiceTypes() {
    return this.facilitiesService.getDistinctValues('serviceTypes');
  }

  @Get('/filters')
  getFilters() {
    return this.facilitiesService.getDistinctValues('filters');
  }

  @Get('/cards')
  getCards() {
    return this.facilitiesService.getDistinctValues('cards');
  }

  @Get('/:id')
  getFacilityData(@Param('id') rawId: string) {
    const id = parseInt(rawId);
    if (isNaN(id))
      throw new Error('id has to be a number');

    return this.facilitiesService.getFacilityData(id);
  }
}
