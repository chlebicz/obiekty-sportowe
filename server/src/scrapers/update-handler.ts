import { FacilitiesService } from 'src/facilities/facilities.service';
import MultisportScraper, {
  ReadingMultisportFetcher, WritingMultisportFetcher
} from './multisport';
import {
  baseUrl as multisportBaseUrl,
  multisportActivites, multisportCards, multisportFilters
} from './multisport.config';
import MedicoverScraper, {
  ReadingMedicoverFetcher, WritingMedicoverFetcher
} from './medicover';
import ProviderAggregator from './provider-aggregator';
import {
  baseUrl as medicoverBaseUrl,
  medicoverCards, medicoverFilters,
  requestDelay as medicoverRequestDelay
} from './medicover.config';
import { existsSync } from 'fs';

export default class UpdateHandler {
  constructor(
    private facilitiesService: FacilitiesService
  ) {}

  async insertAll() {
    const hasCache = existsSync('scrapers-output/multisport.json');

    const multisportScraper = new MultisportScraper(
      multisportBaseUrl,
      multisportCards,
      multisportActivites,
      multisportFilters
    );
    if (hasCache)
      multisportScraper.setFetcher(
        new ReadingMultisportFetcher(multisportBaseUrl)
      );
    else
      multisportScraper.setFetcher(
        new WritingMultisportFetcher(multisportBaseUrl)
      );

    const medicoverScraper = new MedicoverScraper(
      medicoverBaseUrl,
      medicoverFilters,
      medicoverCards,
      medicoverRequestDelay
    );
    if (hasCache)
      medicoverScraper.setFetcher(
        new ReadingMedicoverFetcher(medicoverBaseUrl, medicoverCards)
      );
    else
      medicoverScraper.setFetcher(
        new WritingMedicoverFetcher(medicoverBaseUrl, medicoverCards)
      );

    console.log('scraping multisport...');
    const multisportObjects = await multisportScraper.scrape();

    console.log('scraping medicover...');
    const medicoverObjects = await medicoverScraper.scrape();

    const aggregator = new ProviderAggregator();

    console.log('combining gathered objects...');
    const aggregatedObjs = aggregator.combineTwoSets(
      multisportObjects, medicoverObjects
    );

    console.log('emptying current db table...');
    await this.facilitiesService.removeAll();

    console.log('updating to db...');
    await this.facilitiesService.createMany(aggregatedObjs);

    console.log('done');
  }
}