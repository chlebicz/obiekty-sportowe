import re

with open('server/src/facilities/facilities.controller.ts', 'r') as f:
    content = f.read()

content = content.replace('''  @Get('/map')
  async searchFacilitiesOnMap(
    @Query('name') name: string,
    @Query('filters') filters: string[],
    @Query('service_types') serviceTypes: string[],
    @Query('cards') cards: string[],
    @Query('nelng', ParseFloatPipe) northEastLng: number,
    @Query('nelat', ParseFloatPipe) northEastLat: number,
    @Query('swlng', ParseFloatPipe) southWestLng: number,
    @Query('swlat', ParseFloatPipe) southWestLat: number,
  ) {
    // little workaround
    if (typeof cards === 'string') cards = [cards];
    if (typeof serviceTypes === 'string') serviceTypes = [serviceTypes];
    if (typeof filters === 'string') filters = [filters];

    const foundFacilities = await this.facilitiesService.findOnMap({
      bounds: {
        northEast: { lng: northEastLng, lat: northEastLat },
        southWest: { lng: southWestLng, lat: southWestLat },
      },
      name,
      filters,
      serviceTypes,
      cards,
    });''', '''  @Get('/map')
  async searchFacilitiesOnMap(
    @Query('name') name: string,
    @Query('filters') filters: string[],
    @Query('service_types') serviceTypes: string[],
    @Query('cards') cards: string[],
    @Query('nelng', ParseFloatPipe) northEastLng: number,
    @Query('nelat', ParseFloatPipe) northEastLat: number,
    @Query('swlng', ParseFloatPipe) southWestLng: number,
    @Query('swlat', ParseFloatPipe) southWestLat: number,
    @Query('zoom', ParseFloatPipe) zoom: number,
  ) {
    // little workaround
    if (typeof cards === 'string') cards = [cards];
    if (typeof serviceTypes === 'string') serviceTypes = [serviceTypes];
    if (typeof filters === 'string') filters = [filters];

    const foundFacilities = await this.facilitiesService.findOnMap({
      bounds: {
        northEast: { lng: northEastLng, lat: northEastLat },
        southWest: { lng: southWestLng, lat: southWestLat },
      },
      name,
      filters,
      serviceTypes,
      cards,
      zoom,
    });''')

with open('server/src/facilities/facilities.controller.ts', 'w') as f:
    f.write(content)
