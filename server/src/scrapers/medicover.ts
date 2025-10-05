import { CreateFacilityParams } from 'src/facilities/facilities.service';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { FacilityProvider } from 'src/facilities/facility.entity';

export interface MedicoverItem {
  vid: string;
  name: string;
  images: string[];
  address: any;
  coordinates: { lon: string; lat: string };
  details: any;
  services: { name: string }[];
  description: string;
  aspects: { id: number }[];
}

export interface AggregatedMedicoverItem extends MedicoverItem {
  cards: string[];
}

export class MedicoverFetcher {
  public constructor(
    private baseUrl: string,
    private cards: Record<string, number>
  ) {}

  private getURLWithCard(baseUrl: string, card: string) {
    const cardNumber = this.cards[card];
    if (cardNumber === undefined)
      throw new Error('unknown card type');

    return baseUrl + '&category_vid=' + cardNumber;
  }

  async fetchWithCard(card: string): Promise<any[]> {
    const url = this.getURLWithCard(this.baseUrl, card);
    const res = await fetch(url);
    const json = await res.json();
    return json.items;
  }
}

export class WritingMedicoverFetcher extends MedicoverFetcher {
  async fetchWithCard(card: string): Promise<any[]> {
    const result = await super.fetchWithCard(card);
    try { await mkdir('scrapers-output'); } catch {}
    await writeFile(
      `scrapers-output/medicover-card-${card}.json`,
      JSON.stringify(result)
    );
    return result;
  }
}

export class ReadingMedicoverFetcher extends MedicoverFetcher {
  async fetchWithCard(card: string): Promise<any[]> {
    try { await mkdir('scrapers-output'); } catch {}
    const fileContents = await readFile(
      `scrapers-output/medicover-card-${card}.json`
    );
    return JSON.parse(fileContents.toString());
  }
}

export class DummyMedicoverFetcher extends MedicoverFetcher {
  constructor(
    cards: Record<string, number>,
    private data: {
      cards: { [k: string]: any[] }
    }
  ) {
    super('', cards);
  }

  async fetchWithCard(card: string): Promise<any[]> {
    if (!this.data.cards[card])
      throw new Error('unknown card type');

    return this.data.cards[card];
  }
}

export class MedicoverTransformer {
  private currentItems = new Map<string, AggregatedMedicoverItem>();

  constructor(
    private filters: Record<number, string>
  ) {}

  /**
   * Aggregates the provided items fetched for a given card/filter with the
   * previously fetched items, joining cards and filters between fetches.
   * @param fetchedItems Items fetched from provider given the card/filter
   * @param card Card type that concerns the request
   */
  aggregateItems(
    fetchedItems: MedicoverItem[],
    card: string
  ) {
    for (const item of fetchedItems) {
      const aggregatedItem = this.currentItems.get(item.vid!);
      if (aggregatedItem)
        aggregatedItem.cards.push(card);
      else
        this.currentItems.set(
          item.vid,
          { ...item, cards: [card] }
        );
    }
  }

  getAggregatedItems(): AggregatedMedicoverItem[] {
    return Array.from(this.currentItems.values());
  }

  private getName(item: AggregatedMedicoverItem): string {
    return item.name;
  }

  private getSources(item: AggregatedMedicoverItem): {
    provider: FacilityProvider, externalId: string
  }[] {
    return [{ provider: 'medicover', externalId: item.vid }];
  }

  private getLocation(item: AggregatedMedicoverItem) {
    return {
      lng: parseFloat(item.coordinates.lon),
      lat: parseFloat(item.coordinates.lat),
    };
  }

  private getStreetName(item: AggregatedMedicoverItem): string {
    return item.address.street || '';
  }

  private getStreetNumber(item: AggregatedMedicoverItem): string {
    return item.address.street_number || '';
  }

  private getPostalCode(item: AggregatedMedicoverItem): string {
    return item.address.postalcode || '';
  }

  private getCity(item: AggregatedMedicoverItem): string {
    return item.address.city || '';
  }

  private getFlatNumber(item: AggregatedMedicoverItem): string {
    return item.address.flat_number || '';
  }

  private getDistrict(item: AggregatedMedicoverItem): string {
    return item.address.district || '';
  }

  private getServiceTypes(item: AggregatedMedicoverItem): string[] {
    return item.services ? item.services.map(s => s.name) : [];
  }

  private getCards(item: AggregatedMedicoverItem) {
    return item.cards;
  }

  private getPhone(item: AggregatedMedicoverItem): string {
    return item.details?.phone || '';
  }

  private getEmail(item: AggregatedMedicoverItem): string {
    return item.details?.mail || '';
  }

  private getLink(input: string) {
    return input.startsWith('http') ? input : ('https://' + input);
  }

  private getWebsite(item: AggregatedMedicoverItem): string {
    return item.details?.www ? this.getLink(item.details.www) : '';
  }

  private getFanpage(): string {
    return '';
  }

  private getDescription(item: AggregatedMedicoverItem): string {
    return item.description || '';
  }

  private getImages(item: AggregatedMedicoverItem) {
    return item.images || [];
  }

  private getOpenHours(item: AggregatedMedicoverItem): string[] {
    if (!item.details.opening_hours)
      return [];

    const result = ['', '', '', '', '', '', ''];

    for (const timeInterval of item.details.opening_hours) {
      const dayNum = parseInt(timeInterval.day) - 1;
      const interval = timeInterval.start_hour.slice(0, -3)
        + ' - ' + timeInterval.end_hour.slice(0, -3);

      if (result[dayNum] !== '')
        result[dayNum] += ', ' + interval;
      else
        result[dayNum] = interval;
    }

    return result;
  }

  private isOpen24h(item: AggregatedMedicoverItem): boolean {
    return (item.details?.opening_hours || []).some(
      (oh: any) => oh.start_hour === '00:00:00' && oh.end_hour === '23:59:00'
    );
  }

  private isSeasonal(item: AggregatedMedicoverItem): boolean {
    return false;
  }

  private getFilters(item: AggregatedMedicoverItem): string[] {
    return item.aspects
      .map(a => this.filters[a.id])
      .filter(Boolean);
  }

  constructDbObject(item: AggregatedMedicoverItem): CreateFacilityParams {
    return {
      name: this.getName(item),
      sources: this.getSources(item),
      location: this.getLocation(item),
      streetName: this.getStreetName(item),
      streetNumber: this.getStreetNumber(item),
      postalCode: this.getPostalCode(item),
      city: this.getCity(item),
      flatNumber: this.getFlatNumber(item),
      district: this.getDistrict(item),
      serviceTypes: this.getServiceTypes(item),
      cards: this.getCards(item),
      phone: this.getPhone(item),
      email: this.getEmail(item),
      website: this.getWebsite(item),
      fanpage: this.getFanpage(),
      description: this.getDescription(item),
      images: this.getImages(item),
      openHours: this.getOpenHours(item),
      open24h: this.isOpen24h(item),
      seasonal: this.isSeasonal(item),
      filters: this.getFilters(item)
    };
  }
}

export class MedicoverValidator {
  validateItem(data: any): data is MedicoverItem {
    if (!data)
      return false;
    if (typeof data.vid !== 'string')
      return false;
    if (!Array.isArray(data.images))
      return false;
    if (!data.address || typeof data.address.city !== 'string')
      return false;
    if (!data.coordinates || !data.coordinates.lat || !data.coordinates.lon)
      return false;
    if (typeof data.name !== 'string')
      return false;
    if (data.services && !Array.isArray(data.services))
      return false;
    if (data.aspects && !Array.isArray(data.aspects))
      return false;

    return true;
  }

  /**
   * Validated given items using known Medicover criteria
   * @param items Fetched items to validate
   * @returns Array with two elements, where the first element is the items
   *          that are valid, and the second is the items that are not.
   */
  validateAll(items: any[]): [MedicoverItem[], any[]] {
    const valid: MedicoverItem[] = [];
    const invalid: MedicoverItem[] = [];

    for (const item of items) {
      if (this.validateItem(item))
        valid.push(item);
      else
        invalid.push(item);
    }

    return [valid, invalid];
  }
}

export default class MedicoverScraper {
  private fetcher: MedicoverFetcher;
  setFetcher(value: MedicoverFetcher) {
    this.fetcher = value;
  }

  private validator = new MedicoverValidator();
  private transformer: MedicoverTransformer;

  constructor(
    baseUrl: string,
    filters: Record<number, string>,
    private cards: Record<string, number>,
    private requestDelay: number
  ) {
    this.fetcher = new MedicoverFetcher(baseUrl, cards);
    this.transformer = new MedicoverTransformer(filters);
  }

  private sleep(interval: number) {
    return new Promise<void>(res => {
      setTimeout(() => {
        res();
      }, interval);
    });
  }

  async scrape() {
    const cardsToFetch = Object.keys(this.cards);

    for (const card of cardsToFetch) {
      const items = await this.fetcher.fetchWithCard(card);

      const [valid, invalid] = this.validator.validateAll(items);
      if (invalid.length > 0)
        console.error(
          `Medicover scraper (card ${card}): ${invalid.length} invalid objects`
        );

      await this.sleep(this.requestDelay);

      this.transformer.aggregateItems(valid, card);
    }
  
    const all = this.transformer.getAggregatedItems();

    return all.map(item => this.transformer.constructDbObject(item));
  }
}