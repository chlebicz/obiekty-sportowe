import re

with open('server/src/facilities/facility.repository.ts', 'r') as f:
    content = f.read()

content = content.replace('''  async findOnMap({
    bounds: { swLat, swLng, neLat, neLng },
    serviceTypes,
    filters,
    cards,
    name,
  }: {
    bounds: {
      swLat: number;
      swLng: number;
      neLat: number;
      neLng: number;
    };
    serviceTypes: string[];
    filters: string[];
    cards: string[];
    name?: string;
  }) {
    let inBounds = this.createRawQueryBuilder()
      .select('*')
      .from('facilities', 'f') as FacilityQueryBuilder;

    inBounds = inBounds
      .whereInBounds(swLat, swLng, neLat, neLng)
      .andWhere('"serviceTypes" @> :serviceTypes::text[]', { serviceTypes })
      .andWhere('filters @> :filters::text[]', { filters })
      .andWhere('cards @> :cards::text[]', { cards });

    if (name)
      inBounds = inBounds.andWhere('similarity(name, :name) > 0.3', { name });

    const qb = this.createRawQueryBuilder()
      .addCommonTableExpression(inBounds, 'in_bounds')
      .selectClustered(20, 'in_bounds');

    return (await qb.execute()).map((o: any) => o.result);
  }''', '''  async findOnMap({
    bounds: { swLat, swLng, neLat, neLng },
    serviceTypes,
    filters,
    cards,
    name,
  }: {
    bounds: {
      swLat: number;
      swLng: number;
      neLat: number;
      neLng: number;
    };
    serviceTypes: string[];
    filters: string[];
    cards: string[];
    name?: string;
  }) {
    let inBounds = this.createRawQueryBuilder()
      .select('id, location')
      .from('facilities', 'f') as FacilityQueryBuilder;

    inBounds = inBounds
      .whereInBounds(swLat, swLng, neLat, neLng)
      .andWhere('"serviceTypes" @> :serviceTypes::text[]', { serviceTypes })
      .andWhere('filters @> :filters::text[]', { filters })
      .andWhere('cards @> :cards::text[]', { cards });

    if (name)
      inBounds = inBounds.andWhere('similarity(name, :name) > 0.3', { name });

    return await inBounds.execute();
  }''')

with open('server/src/facilities/facility.repository.ts', 'w') as f:
    f.write(content)
