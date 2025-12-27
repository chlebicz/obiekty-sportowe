import { FacilitiesService, CreateFacilityParams } from 'src/facilities/facilities.service';
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
import { existsSync, rmdirSync } from 'fs';
import { Facility } from 'src/facilities/facility.entity';
import { FacilityMatcher, FacilityWithEmbedding } from './facility-matcher';

export default class UpdateHandler {
  private facilityMatcher = FacilityMatcher.getInstance();

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
    const aggregatedObjs = await aggregator.combineTwoSets(
      multisportObjects, medicoverObjects
    );

    console.log('reconciling with db...');
    await this.reconcile(aggregatedObjs);

    console.log('removing cache');
    try {
      rmdirSync('scrapers-output');
    } catch {}

    console.log('done');
  }

  async reconcile(scrapedFacilities: CreateFacilityParams[]) {
    await this.facilityMatcher.init();
    const existingFacilities = await this.facilitiesService.getAll();

    // Group existing facilities by city
    const existingByCity = new Map<string, FacilityWithEmbedding<Facility>[]>();

    console.log('generating embeddings for existing facilities...');
    for (const facility of existingFacilities) {
      const key = facility.postalCode;
      if (!existingByCity.has(key)) {
        existingByCity.set(key, []);
      }

      const embedding = await this.facilityMatcher.generateEmbedding(
        this.facilityMatcher.getTextForEmbedding(facility)
      );
      existingByCity.get(key)!.push({ facility, embedding });
    }

    const toInsert: CreateFacilityParams[] = [];
    const matchedIds = new Set<number>();

    console.log('matching scraped facilities with db...');
    for (const scraped of scrapedFacilities) {
      const key = scraped.postalCode;
      const candidates = existingByCity.get(key) || [];

      if (candidates.length === 0) {
        toInsert.push(scraped);
        continue;
      }

      const { match } = await this.facilityMatcher.findBestMatch(scraped, candidates);

      if (match) {
        matchedIds.add(match.id);
        await this.facilitiesService.updateFacility(match.id, scraped);
      } else {
        toInsert.push(scraped);
      }
    }

    const toDeleteIds = existingFacilities
      .map(f => f.id)
      .filter(id => !matchedIds.has(id));

    console.log(`stats: insert: ${toInsert.length}, update: ${matchedIds.size}, delete: ${toDeleteIds.length}`);

    if (toInsert.length > 0) {
      console.log('inserting new facilities...');
      await this.facilitiesService.createMany(toInsert);
    }

    if (toDeleteIds.length > 0) {
      console.log('deleting obsolete facilities...');
      await this.facilitiesService.removeMany(toDeleteIds);
    }
  }
}
