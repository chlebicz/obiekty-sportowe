import ProviderAggregator from './provider-aggregator';
import { CreateFacilityParams } from '../facilities/facilities.service';
import Embedding from './embedding';

// Mock the SemanticMatcher class for Unit Tests
const mockGenerateEmbedding = jest.fn();
const mockCosineSimilarity = jest.fn();

jest.mock('./semantic-matcher', () => ({
  SemanticMatcher: {
    getInstance: () => ({
      init: jest.fn().mockResolvedValue(undefined),
      generateEmbedding: mockGenerateEmbedding,
    }),
  },
}));

jest.mock('./embedding', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((data) => {
    return { similarity: mockCosineSimilarity };
  }),
}));

const mockFacility = (
  overrides: Partial<CreateFacilityParams>,
): CreateFacilityParams => ({
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

describe(ProviderAggregator, () => {
  let aggregator: ProviderAggregator;

  beforeEach(() => {
    aggregator = new ProviderAggregator();
    jest.clearAllMocks();
    mockGenerateEmbedding.mockResolvedValue(new Embedding([0.1, 0.2]));
    mockCosineSimilarity.mockReturnValue(0.1);
  });

  it('should merge facilities when similarity is high (>0.90) and location is close', async () => {
    const f1 = mockFacility({
      name: 'Gym A',
      location: { lat: 50.0, lng: 20.0 },
    });
    const f2 = mockFacility({
      name: 'Gym A',
      location: { lat: 50.0001, lng: 20.0001 },
    });

    mockCosineSimilarity.mockReturnValue(0.95);

    const result = await aggregator.combineTwoSets([f1], [f2]);

    expect(result).toHaveLength(1);
    expect(mockCosineSimilarity).toHaveBeenCalled();
  });
});
