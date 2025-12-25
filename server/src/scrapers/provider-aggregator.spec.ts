import ProviderAggregator from './provider-aggregator';
import { CreateFacilityParams } from '../facilities/facilities.service';

// 1. Mock the SemanticMatcher class
// We use a factory function so we can control the instance methods
const mockGenerateEmbedding = jest.fn();
const mockCosineSimilarity = jest.fn();

jest.mock('./semantic-matcher', () => ({
  SemanticMatcher: {
    getInstance: () => ({
      init: jest.fn().mockResolvedValue(undefined),
      generateEmbedding: mockGenerateEmbedding,
      cosineSimilarity: mockCosineSimilarity,
    }),
  },
}));

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

describe('ProviderAggregator', () => {
  let aggregator: ProviderAggregator;

  beforeEach(() => {
    aggregator = new ProviderAggregator();
    jest.clearAllMocks();

    // Default behavior: random embedding, low similarity
    mockGenerateEmbedding.mockResolvedValue([0.1, 0.2]);
    mockCosineSimilarity.mockReturnValue(0.1);
  });

  it('should merge facilities when similarity is high (>0.90) and location is close', async () => {
    const f1 = mockFacility({ name: 'Gym A', location: { lat: 50.0, lng: 20.0 } });
    const f2 = mockFacility({ name: 'Gym A', location: { lat: 50.0001, lng: 20.0001 } });

    // Mock high similarity
    mockCosineSimilarity.mockReturnValue(0.95);

    const result = await aggregator.combineTwoSets([f1], [f2]);

    expect(result).toHaveLength(1);
    expect(mockCosineSimilarity).toHaveBeenCalled();
  });

  it('should NOT merge facilities when similarity is high but location is far', async () => {
    const f1 = mockFacility({ name: 'Gym A', location: { lat: 50.0, lng: 20.0 } });
    const f2 = mockFacility({ name: 'Gym A', location: { lat: 51.0, lng: 21.0 } }); // Far

    mockCosineSimilarity.mockReturnValue(0.95);

    const result = await aggregator.combineTwoSets([f1], [f2]);

    expect(result).toHaveLength(2);
  });

  it('should NOT merge facilities when location is close but similarity is low', async () => {
    const f1 = mockFacility({ name: 'Gym A', location: { lat: 50.0, lng: 20.0 } });
    const f2 = mockFacility({ name: 'Bar B', location: { lat: 50.0001, lng: 20.0001 } });

    mockCosineSimilarity.mockReturnValue(0.5);

    const result = await aggregator.combineTwoSets([f1], [f2]);

    expect(result).toHaveLength(2);
  });

  it('should merge "Test Gym City Name" with "Test Gym" (city name in facility name)', async () => {
    // Specific user scenario
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

    // We manually simulate the finding that these strings are similar
    // We can inspect the calls to generateEmbedding if we want to be strict,
    // but here we just ensure the aggregator respects the score.

    // In a real run, this pair produces ~0.974 similarity.
    mockCosineSimilarity.mockReturnValue(0.974);

    const result = await aggregator.combineTwoSets([f1], [f2]);

    expect(result).toHaveLength(1);
    expect(result[0].city).toBe('Warsaw');
    // It keeps the name of the first one usually, or the combine logic decides.
    // combine() keeps first.name
    expect(result[0].name).toBe('Test Gym Warsaw');
  });

  it('should merge messy address "Street 10" vs "Street" #10', async () => {
    const f1 = mockFacility({
      name: 'Gym',
      streetName: 'Main St',
      streetNumber: '10',
      location: { lat: 50.0, lng: 20.0 }
    });
    const f2 = mockFacility({
      name: 'Gym',
      streetName: 'Main St 10',
      streetNumber: '',
      location: { lat: 50.0001, lng: 20.0001 }
    });

    // In a real run, this produces ~1.0 similarity
    mockCosineSimilarity.mockReturnValue(0.99);

    const result = await aggregator.combineTwoSets([f1], [f2]);

    expect(result).toHaveLength(1);
  });
});
