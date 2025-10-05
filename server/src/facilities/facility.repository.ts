import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Facility } from './facility.entity';

export interface Location {
  lat: number;
  lng: number;
}

class FacilityQueryBuilder extends SelectQueryBuilder<any> {
  whereInBounds(
    swLat: number, swLng: number, neLat: number, neLng: number
  ): FacilityQueryBuilder {
    return this
      .andWhere(`
        ST_Within(
          location,
          ST_MakeEnvelope(:swLng, :swLat, :neLng, :neLat, 4326)
        )
      `, { swLng, swLat, neLng, neLat });
  }

  selectClustered(
    k: number,
    from: string
  ) {
    return this
      .addCommonTableExpression(
        this.createQueryBuilder()
          .select('LEAST(:k, COUNT(f.*))::int AS k')
          .setParameters({ k })
          .from(from, 'f'),
        'params'
      )
      .addCommonTableExpression(
        this.createQueryBuilder()
          .select('f.location, f.id')
          .addSelect(`
            ST_ClusterKMeans(
              f.location, (SELECT k FROM params)
            ) OVER () AS cluster_id  
          `)
          .setParameters({ k })
          .from(from, 'f'),
        'clustered'
      )
      .select(`
        CASE
          WHEN COUNT(*) = 1 THEN jsonb_agg(
            jsonb_build_object(
              'type', 'singleton',
              'value', to_jsonb(c.*) - 'cluster_id'
            )
          ) -> 0
          ELSE jsonb_build_object(
            'type', 'cluster',
            'value', jsonb_build_object(
              'count', COUNT(*),
              'location', ST_AsGeoJSON(
                ST_Centroid(ST_Collect(c.location))
              )::jsonb
            )
          )
        END AS result  
      `)
      .from('clustered', 'c')
      .groupBy('cluster_id');
  }
}

export class FacilityRepository extends Repository<Facility> {
  constructor(private dataSource: DataSource) {
    super(Facility, dataSource.createEntityManager());
  }

  createRawQueryBuilder(): FacilityQueryBuilder {
    return new FacilityQueryBuilder(this.dataSource.createQueryBuilder());
  }

  createQueryBuilder(): FacilityQueryBuilder {
    return new FacilityQueryBuilder(
      super.createQueryBuilder()
    );
  }

  async findOnMap({
    bounds: { swLat, swLng, neLat, neLng },
    serviceTypes, filters, cards, name
  }: {
    bounds: {
      swLat: number,
      swLng: number,
      neLat: number,
      neLng: number
    },
    serviceTypes: string[],
    filters: string[],
    cards: string[],
    name?: string
  }) {
    let inBounds = this.createRawQueryBuilder()
      .select('*').from('facilities', 'f') as FacilityQueryBuilder;
    
    inBounds = inBounds
      .whereInBounds(swLat, swLng, neLat, neLng)
      .andWhere('"serviceTypes" @> :serviceTypes::text[]', { serviceTypes })
      .andWhere('filters @> :filters::text[]', { filters })
      .andWhere('cards @> :cards::text[]', { cards });
    
    if (name)
      inBounds = inBounds
        .andWhere('similarity(name, :name) > 0.3', { name });

    const qb = this.createRawQueryBuilder()
      .addCommonTableExpression(inBounds, 'in_bounds')
      .selectClustered(20, 'in_bounds');

    return (await qb.execute()).map((o: any) => o.result);
  }

  async fullSearch({
    bounds: { swLat, swLng, neLat, neLng },
    serviceTypes, filters, cards, name,
    orderBy, page
  }: {
    bounds: {
      swLat: number,
      swLng: number,
      neLat: number,
      neLng: number
    },
    serviceTypes: string[],
    filters: string[],
    cards: string[],
    name?: string,
    orderBy: 'name',
    page: number
  }): Promise<Facility[]> {
    const objectsPerPage = 10;

    let qb = this.createQueryBuilder()
      .whereInBounds(swLat, swLng, neLat, neLng)
      .andWhere('"serviceTypes" @> :serviceTypes::text[]', { serviceTypes })
      .andWhere('filters @> :filters::text[]', { filters })
      .andWhere('cards @> :cards::text[]', { cards })
      .orderBy(orderBy)
      .offset(objectsPerPage * page)
      .limit(objectsPerPage);

    if (name)
      qb = qb
        .andWhere('similarity(name, :name) > 0.3', { name });

    return await qb.getMany();
  }

  async fuzzySearch(input: string) {
    return this.createRawQueryBuilder()
      .select('id, name, city')
      .from('facilities', 'f')
      .where('similarity(name, :input) > 0.3')
      .orderBy('similarity(name, :input)', 'DESC')
      .setParameters({ input })
      .take(10)
      .execute();
  }

  async getDistinctValues(arrayField: 'serviceTypes' | 'filters' | 'cards') {
    const raw = await this.createRawQueryBuilder()
      .select(`DISTINCT(unnest("${arrayField}"))`)
      .from('facilities', 'f')
      .execute();

    return raw.map((el: any) => el.unnest);
  }
}