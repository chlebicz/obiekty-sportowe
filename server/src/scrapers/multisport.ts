import { mkdir, readFile, writeFile } from 'fs/promises';
import { CreateFacilityParams } from 'src/facilities/facilities.service';

interface MultisportItem {
  uid: number;
  title?: string;
  name?: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  address_full: string;
  postcode?: string;
  phone?: string;
  email?: string;
  webpage?: string;
  fanpage?: string;
  info?: string;
  technical_break?: boolean;
  technical_break_from?: number;
  technical_break_to?: number;
  info_general?: string;
  cards_ids?: string[];
  parameters_ids?: string[];
  categories_all_ids?: string[];
  logo?: string;
  new?: boolean;
  is_seasonal?: boolean;
  hours?: {
    [k in '1' | '2' | '3' | '4' | '5' | '6' | '7']?: {
      dayOfWeek: number;
      from?: string;
      to?: string;
      fromSecond?: string;
      toSecond?: string;
      closed: boolean
    }
  },
  seasonal_dates?: {
    from_day: number,
    from_month: number,
    to_day: number,
    to_month: number
  } | [];
  seasonal_categories?: {
    from_day: number,
    from_month: number,
    to_day: number,
    to_month: number,
    categories: string[]
  }[];
  not_standard_opening_hours?: 0 | 1;
  open24h?: 0 | 1;
  temporary_closed?: 0 | 1;
  info_kids?: string;
  info_senior?: string;
  phone2?: string;
}

export class MultisportFetcher {
  public constructor(
    private baseUrl: string
  ) {}

  async fetchAll(): Promise<any[]> {
    const res = await fetch(this.baseUrl);
    const json = await res.json();
    return json.response.matching_all.docs;
  }
}

export class WritingMultisportFetcher extends MultisportFetcher {
  async fetchAll(): Promise<any[]> {
    const result = await super.fetchAll();
    try { await mkdir('scrapers-output'); } catch {}
    await writeFile('scrapers-output/multisport.json', JSON.stringify(result));
    return result;
  }
}

export class ReadingMultisportFetcher extends MultisportFetcher {
  async fetchAll(): Promise<any[]> {
    try { await mkdir('scrapers-output'); } catch {}
    const fileContents = await readFile('scrapers-output/multisport.json');
    return JSON.parse(fileContents.toString());
  }
}

export class DummyMultisportFetcher extends MultisportFetcher {
  constructor(private data: any[]) {
    super('');
  }

  async fetchAll(): Promise<any[]> {
    return this.data;
  }
}

class MultisportTransformer {
  constructor(
    private cards: Record<number, string>,
    private activities: Record<number, string>,
    private filters: Record<number, string>
  ) {}

  private getPostalCode(item: MultisportItem) {
    if (item.postcode)
      return item.postcode;

    const extractedPostalCode = item.address_full.match(/\d{2}-\d{3}/g);
    if (extractedPostalCode)
      // there may appear street numbers that look like postal codes,
      // for example: ul. Grabiszyńska 238-240 53-235 Dolnośląskie
      // so we take the last dd-ddd that matches
      return extractedPostalCode[extractedPostalCode.length - 1];

    return ''; // doesn't happen for now
  }

  private getStreetNumber(item: MultisportItem) {
    const { address } = item;

    const numbersInAddress = address.match(/\d*-*\d+\s*([A-Z,a-z][^\.])*/g);
    if (!numbersInAddress)
      return '';

    if (numbersInAddress.length === 1)
      return numbersInAddress[0].trimEnd();

    return numbersInAddress[numbersInAddress.length - 2].trimEnd();
  }

  private getCards(item: MultisportItem) {
    return item.cards_ids
      ? item.cards_ids.map(card => this.cards[parseInt(card)])
      : [];
  }

  private getFlatNumber(item: MultisportItem) {
    const { address } = item;

    const numbersInAddress = address.match(/\d*-*\d+\s*([A-Z,a-z][^\.])*/g);
    if (!numbersInAddress)
      return '';

    if (numbersInAddress.length === 1)
      return '';

    return numbersInAddress[numbersInAddress.length - 1].trimEnd();
  }

  private getName(item: MultisportItem) {
    return (item.name || item.title) as string;
  }

  private getLocation(item: MultisportItem) {
    return { lat: item.lat, lng: item.lng };
  }

  private getImages(item: MultisportItem) {
    return item.logo ? ['https://wys.benefitsystems.pl/' + item.logo] : [];
  }

  private getOpen24h(item: MultisportItem) {
    return !!item.open24h;
  }

  private getOpenHours(item: MultisportItem) {
    if (!item.hours)
      return [];

    return Object.values(item.hours).map(day => {
      if (day.closed)
        return 'Zamknięte';

      const resultParts: string[] = [];
      if (day.from && day.to)
        resultParts.push(`${day.from} - ${day.to}`);

      if (day.fromSecond && day.toSecond)
        resultParts.push(`${day.fromSecond} - ${day.toSecond}`);

      return resultParts.join(', ');
    });
  }

  private getLink(input: string) {
    return input.startsWith('http') ? input : ('https://' + input);
  }

  private getPhone(item: MultisportItem) {
    const resultParts: string[] = [];

    if (item.phone)
      resultParts.push(item.phone);
    if (item.phone2)
      resultParts.push(item.phone2);

    return resultParts.join(', ');
  }

  private getServiceTypes(item: MultisportItem) {
    // todo: unify the naming (params: filters, service types, cards)
    if (!item.categories_all_ids)
      return [];

    return item.categories_all_ids
      .map(id => this.activities[id])
      .filter(Boolean);
  }

  private getStreetName(item: MultisportItem) {
    const { address } = item;

    const numbersInAddress = address.match(/\d*-*\d+\s*([A-Z,a-z][^\.])*/g);
    if (!numbersInAddress)
      return address;

    if (numbersInAddress.length === 1)
      return address.split(numbersInAddress[0])[0].trimEnd();

    return address.split(
      numbersInAddress[numbersInAddress.length - 2]
    )[0].trimEnd();
  }

  private getFilters(item: MultisportItem): string[] {
    if (!item.parameters_ids)
      return [];

    return item.parameters_ids
      .map(p => this.filters[parseInt(p)])
      .filter(Boolean);
  }

  constructDbObject(
    item: MultisportItem
  ): CreateFacilityParams {
    return {
      cards: this.getCards(item),
      city: item.city,
      description: item.info || '',
      email: item.email || '',
      fanpage: item.fanpage ? this.getLink(item.fanpage) : '',
      postalCode: this.getPostalCode(item),
      streetNumber: this.getStreetNumber(item),
      flatNumber: this.getFlatNumber(item),
      images: this.getImages(item),
      location: this.getLocation(item),
      name: this.getName(item),
      open24h: this.getOpen24h(item),
      openHours: this.getOpenHours(item),
      phone: this.getPhone(item),
      seasonal: item.is_seasonal || false,
      serviceTypes: this.getServiceTypes(item),
      sources: [{
        provider: 'multisport', externalId: String(item.uid)
      }],
      streetName: this.getStreetName(item),
      website: item.webpage ? this.getLink(item.webpage) : '',
      filters: this.getFilters(item),
      district: ''
    };
  }
}

class MultisportValidator {
  validateItem(data: any): data is MultisportItem {
    if (!data.uid || typeof data.uid !== 'number')
      return false;
    if (!data.lat || typeof data.lat !== 'number')
      return false;
    if (!data.address || typeof data.address !== 'string')
      return false;
    if (!data.city || typeof data.city !== 'string')
      return false;
    if (!data.address_full || typeof data.address_full !== 'string')
      return false;

    return true;
  }

  validateAll(items: any[]): [MultisportItem[], any[]] {
    const valid: MultisportItem[] = [];
    const invalid: MultisportItem[] = [];

    for (const item of items) {
      if (this.validateItem(item))
        valid.push(item);
      else
        invalid.push(item);
    }

    return [valid, invalid];
  }
}

export default class MultisportScraper {
  private fetcher: MultisportFetcher;
  setFetcher(value: MultisportFetcher) {
    this.fetcher = value;
  }

  private validator = new MultisportValidator();
  private transformer: MultisportTransformer;

  constructor(
    baseUrl: string,
    cards: Record<number, string>,
    activities: Record<number, string>,
    filters: Record<number, string>,
  ) {
    this.fetcher = new MultisportFetcher(baseUrl);
    this.transformer = new MultisportTransformer(cards, activities, filters);
  }

  async scrape() {
    const items = await this.fetcher.fetchAll();

    const [valid, invalid] = this.validator.validateAll(items);
    if (invalid.length > 0)
      console.error(
        `Multisport scraper: ${invalid.length} invalid objects`
      );

    return valid.map(item => this.transformer.constructDbObject(item));
  }
}