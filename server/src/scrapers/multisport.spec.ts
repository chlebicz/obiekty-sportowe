import { DummyMultisportFetcher } from './multisport';

describe(DummyMultisportFetcher, () => {
  it('retrieves provided data', async () => {
    const fetcher = new DummyMultisportFetcher([
      {} as any, {} as any, {} as any
    ]);

    await expect(fetcher.fetchAll()).resolves.toHaveLength(3);
  });
});