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

describe('ProviderAggregator Integration with real SemanticMatcher', () => {
  let aggregator: ProviderAggregator;

  before(async () => {
    // Initialize model once
    console.log('Initializing SemanticMatcher model...');
    await SemanticMatcher.getInstance().init();
    console.log('Model initialized.');
    aggregator = new ProviderAggregator();
  });

  it('should merge when city appears in facility name', async () => {
    const city = 'Warszawa';
    const f1 = mockFacility({
      name: `Test Gym ${city}`,
      city: city,
      streetName: 'Zielona',
      streetNumber: '26',
      location: { lat: 52.0, lng: 21.0 }
    });
    const f2 = mockFacility({
      name: 'Test Gym',
      city: city,
      streetName: 'Zielona',
      streetNumber: '26',
      location: { lat: 52.0001, lng: 21.0001 }
    });

    const result = await aggregator.combineTwoSets([f1], [f2]);

    assert.strictEqual(result.length, 1, 'Should have merged into 1 facility');
  });

  it('should merge when street number appears in street name', async () => {
    const f1 = mockFacility({
      name: 'Super Gym',
      streetName: 'Zielona',
      streetNumber: '10',
      city: 'Krakow',
      location: { lat: 50.0, lng: 20.0 }
    });
    const f2 = mockFacility({
      name: 'Super Gym',
      streetName: 'Zielona 10',
      streetNumber: '10',
      city: 'Krakow',
      location: { lat: 50.0001, lng: 20.0001 }
    });

    const result = await aggregator.combineTwoSets([f1], [f2]);

    assert.strictEqual(result.length, 1, 'Should have merged messy addresses');
  });

  it('should not merge facilities at similar location when names dont match', async () => {
    // Two different brands at similar location (e.g. same mall)
    const f1 = mockFacility({
      name: 'Fitness Platinum',
      city: 'Warszawa',
      streetName: 'Targowa',
      location: { lat: 52.0, lng: 21.0 }
    });
    const f2 = mockFacility({
      name: 'CityFit',
      city: 'Warszawa',
      streetName: 'Targowa',
      location: { lat: 52.0001, lng: 21.0001 }
    });

    const result = await aggregator.combineTwoSets([f1], [f2]);

    assert.strictEqual(result.length, 2, 'Should not have merged distinct gyms');
  });

  it('should not merge names of similar meaning but different wording', async () => {
    const f1 = mockFacility({
      name: 'Blue Gym',
      city: 'London',
      streetName: 'High St',
      location: { lat: 51.5, lng: -0.1 }
    });
    const f2 = mockFacility({
      name: 'Blue Fitness',
      city: 'London',
      streetName: 'High St',
      location: { lat: 51.5001, lng: -0.1001 }
    });

    const result = await aggregator.combineTwoSets([f1], [f2]);

    assert.strictEqual(result.length, 2, 'Should not have merged Blue Gym and Blue Fitness');
  });

  it('should merge "salsafit" vs "salsa fit" (space variation)', async () => {
    const f1 = mockFacility({
      name: 'salsafit',
      streetName: 'Dance St',
      city: 'Warsaw',
      location: { lat: 52.0, lng: 21.0 }
    });
    const f2 = mockFacility({
      name: 'salsa fit',
      streetName: 'Dance St',
      city: 'Warsaw',
      location: { lat: 52.0001, lng: 21.0001 }
    });

    const result = await aggregator.combineTwoSets([f1], [f2]);

    assert.strictEqual(result.length, 1, 'Should have merged space variation');
  });
});
