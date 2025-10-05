import { DummyMedicoverFetcher } from './medicover';

describe(DummyMedicoverFetcher, () => {
  it('retrieves provided data', async () => {
    const fetcher = new DummyMedicoverFetcher(
      { 'test-card': 1 },
      {
        cards: {
          'test-card': [{} as any]
        }
      }
    );

    await expect(fetcher.fetchWithCard('test-card')).resolves.toHaveLength(1);
    await expect(fetcher.fetchWithCard('nonexistent-card')).rejects.toThrow();
  });
});