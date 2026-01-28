import { DataSource } from 'typeorm';
import { Facility } from '../../src/facilities/facility.entity';
import { FacilityRepository } from '../../src/facilities/facility.repository';
import * as config from '../../config.json';

interface Config {
  postgresql: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
}

const postgresql = (config as unknown as Config).postgresql;

async function runBenchmark() {
  console.log('Starting benchmark...');

  const dataSource = new DataSource({
    type: 'postgres',
    host: postgresql.host,
    port: postgresql.port,
    database: postgresql.database,
    username: postgresql.username,
    password: postgresql.password,
    entities: [Facility],
    synchronize: true, // Auto-create schema
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connected.');

    // FacilityRepository has a custom constructor that takes DataSource
    const repository = new FacilityRepository(dataSource);

    // 1. Seed Data
    const FACILITY_COUNT = 10000;
    console.log(`Seeding ${FACILITY_COUNT} facilities...`);

    // Check current count
    const currentCount = await repository.count();
    if (currentCount < FACILITY_COUNT) {
      const facilitiesToCreate = [];
      for (let i = 0; i < FACILITY_COUNT; i++) {
        // Random location in Poland approx (lat 49-54, lng 14-24)
        const lat = 49 + Math.random() * 5;
        const lng = 14 + Math.random() * 10;

        facilitiesToCreate.push(
          repository.create({
            name: `Benchmark Gym ${i}`,
            streetName: 'Test St',
            streetNumber: `${i}`,
            postalCode: '00-000',
            city: 'Test City',
            phone: '123456789',
            location: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            serviceTypes: [],
            filters: [],
            cards: [],
            images: [],
            openHours: [],
            seasonal: false,
            open24h: false,
          }),
        );
      }
      await repository.save(facilitiesToCreate, { chunk: 1000 });
      console.log('Seeding complete.');
    } else {
      console.log('Data already seeded.');
    }

    // 2. Measure Query Performance
    console.log('Running spatial queries...');

    // Define a bounding box that covers a chunk of the map
    const bounds = {
      swLat: 50.0,
      swLng: 19.0,
      neLat: 51.0,
      neLng: 21.0,
    };

    const iterations = 20;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      await repository.findOnMap({
        bounds,
        serviceTypes: [],
        filters: [],
        cards: [],
      });
    }

    const end = performance.now();
    const duration = end - start;
    const avgTime = duration / iterations;

    console.log(`\nBenchmark Results:`);
    console.log(`Total Time (${iterations} queries): ${duration.toFixed(2)}ms`);
    console.log(`Average Time per Query: ${avgTime.toFixed(2)}ms`);
  } catch (error) {
    console.error('Benchmark failed:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Check if running directly
if (require.main === module) {
  void runBenchmark();
}
