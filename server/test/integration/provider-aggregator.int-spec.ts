import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import ProviderAggregator from '../../src/scrapers/provider-aggregator';
import { CreateFacilityParams } from '../../src/facilities/facilities.service';
import { SemanticMatcher } from '../../src/scrapers/semantic-matcher';

// Helper to create dummy facilities
const mockFacility = (overrides: Partial<CreateFacilityParams>): CreateFacilityParams => ({
  name: 'Default Gym',
  streetName: 'Default St',
  streetNumber: '1',
  city: 'Test City',
  location: { lat: 50.0, lng: 20.0 },
  cards: [],
  description: '',
  district: '',
  email: '',
  fanpage: '',
  flatNumber: '',
  images: [],
  open24h: false,
  openHours: [],
  phone: '',
  postalCode: '',
  seasonal: false,
  serviceTypes: [],
  sources: [],
  website: '',
  filters: [],
  ...overrides,
});

describe('ProviderAggregator Integration (Real Model)', () => {
  let aggregator: ProviderAggregator;

  before(async () => {
    // Initialize model once
    console.log('Initializing SemanticMatcher model...');
    await SemanticMatcher.getInstance().init();
    console.log('Model initialized.');
    aggregator = new ProviderAggregator();
  });

  it('should merge "Test Gym Warsaw" with "Test Gym" (city name in facility name)', async () => {
    const city = 'Warsaw';
    const f1 = mockFacility({
      name: 'Test Gym Warsaw',
      city: city,
      streetName: 'St',
      streetNumber: '1',
      location: { lat: 52.0, lng: 21.0 }
    });
    const f2 = mockFacility({
      name: 'Test Gym',
      city: city,
      streetName: 'St',
      streetNumber: '1',
      location: { lat: 52.0001, lng: 21.0001 }
    });

    const result = await aggregator.combineTwoSets([f1], [f2]);

    assert.strictEqual(result.length, 1, 'Should have merged into 1 facility');
    assert.strictEqual(result[0].city, 'Warsaw');
    console.log('✅ Merged "Test Gym Warsaw" and "Test Gym" successfully.');
  });

  it('should merge messy address "Street 10" vs "Street" #10', async () => {
    const f1 = mockFacility({
      name: 'Super Gym',
      streetName: 'Main St',
      streetNumber: '10',
      city: 'Krakow',
      location: { lat: 50.0, lng: 20.0 }
    });
    const f2 = mockFacility({
      name: 'Super Gym',
      streetName: 'Main St 10',
      streetNumber: '',
      city: 'Krakow',
      location: { lat: 50.0001, lng: 20.0001 }
    });

    const result = await aggregator.combineTwoSets([f1], [f2]);

    assert.strictEqual(result.length, 1, 'Should have merged messy addresses');
    console.log('✅ Merged messy addresses successfully.');
  });

  it('should NOT merge distinct facilities "Fitness Platinium" vs "CityFit"', async () => {
    // Two different brands at similar location (e.g. same mall)
    const f1 = mockFacility({
      name: 'Fitness Platinium',
      city: 'Warsaw',
      streetName: 'Mall Street',
      location: { lat: 52.0, lng: 21.0 }
    });
    const f2 = mockFacility({
      name: 'CityFit',
      city: 'Warsaw',
      streetName: 'Mall Street',
      location: { lat: 52.0001, lng: 21.0001 }
    });

    const result = await aggregator.combineTwoSets([f1], [f2]);

    assert.strictEqual(result.length, 2, 'Should NOT have merged distinct gyms');
    console.log('✅ Correctly kept distinct gyms separate.');
  });
});
