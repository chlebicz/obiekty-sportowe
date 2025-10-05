import { dayNames, isInTimeRange } from '../time-util';

export interface FacilityProps {
  id: number;
  name: string;
  location: { lat: number, lng: number };
  streetName: string;
  streetNumber: string;
  postalCode: string;
  city: string;
  flatNumber?: string;
  district: string;
  serviceTypes: string[];
  filters: string[];
  cards: string[];
  phone: string;
  email?: string;
  website?: string;
  fanpage?: string;
  description?: string;
  images: string[];
  openHours: string[];
  seasonal: boolean;
  open24h: boolean;
}

export class Facility {
  private readonly props: FacilityProps;

  constructor(props: FacilityProps) {
    this.props = { ...props };
  }

  getNavigateLink(): string {
    return 'https://google.com/maps?daddr='
      + this.location.lat + ',' + this.location.lng;
  }

  isOpenNow(): boolean {
    if (this.open24h)
      return true;

    const date = new Date();

    // 1 - monday, 7 - sunday mapping
    let dayOfWeek = date.getDay();
    if (dayOfWeek === 0)
      dayOfWeek = 7;

    const possible = this.openHours
      .filter(
        hours => hours.startsWith(`${dayOfWeek}`)
      )
      .map(v => v.slice(3));

    return possible.some(range => isInTimeRange(date, range));
  }

  getReadableOpenHours(): string[] {
    const result: string[] = [];
  
    for (let i = 0; i < this.openHours.length; ++i) {
      const dayName = dayNames[i + 1];
      const openHours = this.openHours[i];
      if (openHours !== '')
        result.push(`${dayName}: ${openHours}`);
    }
  
    return result;
  }

  get shortAddress(): string {
    let result = `${this.streetName} ${this.streetNumber}`;

    if (this.flatNumber)
      result += ` lok. ${this.flatNumber}`;

    result += `, ${this.city}`;

    return result;
  }

  get fullAddress(): string {
    let result = `${this.streetName} ${this.streetNumber}`;

    if (this.flatNumber)
      result += `lok. ${this.flatNumber}`;

    result += `, ${this.postalCode} ${this.city}`;

    return result;
  }

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get location() { return this.props.location; }
  get streetName() { return this.props.streetName; }
  get streetNumber() { return this.props.streetNumber; }
  get postalCode() { return this.props.postalCode; }
  get city() { return this.props.city; }
  get flatNumber() { return this.props.flatNumber; }
  get district() { return this.props.district; }
  get serviceTypes() { return this.props.serviceTypes; }
  get filters() { return this.props.filters; }
  get cards() { return this.props.cards; }
  get phone() { return this.props.phone; }
  get email() { return this.props.email; }
  get website() { return this.props.website; }
  get fanpage() { return this.props.fanpage; }
  get description() { return this.props.description; }
  get images() { return this.props.images; }
  get openHours() { return this.props.openHours; }
  get seasonal() { return this.props.seasonal; }
  get open24h() { return this.props.open24h; }
}