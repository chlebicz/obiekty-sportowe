import { CreateFacilityParams } from 'src/facilities/facilities.service';

class SimilarObjBucket {
  private objects: CreateFacilityParams[] = [];

  add(obj: CreateFacilityParams) {
    this.objects.push(obj);
  }

  private areLikelyEquivalent(
    left: CreateFacilityParams, right: CreateFacilityParams
  ): boolean {
    const lngDiff = Math.abs(right.location.lng - left.location.lng);
    const latDiff = Math.abs(right.location.lat - left.location.lat);

    // ~100 meters difference in both lng and lat
    return lngDiff < 0.002 && latDiff < 0.001;
  }

  search(obj: CreateFacilityParams): CreateFacilityParams | undefined {
    return this.objects.find(
      other => this.areLikelyEquivalent(obj, other)
    );
  }

  replace(oldObj: CreateFacilityParams, newObj: CreateFacilityParams) {
    this.objects = this.objects.filter(obj => obj !== oldObj);
    this.objects = [...this.objects, newObj];
  }

  getObjects() {
    return this.objects;
  }
}

class PossibleDuplicatesMap {
  private map = new Map<string, SimilarObjBucket>();

  private polishCharacterReplacements: Record<string, string> = {
    ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z'
  };

  private replacePolishChars(text: string): string {
    return text.replace(
      /[ąćęłńóśźż]/g,
      char => this.polishCharacterReplacements[char]
    );
  }

  private getKey(obj: CreateFacilityParams): string {
    return this.replacePolishChars(obj.name.toLocaleLowerCase())
      // remove non-alphanumeric chars
      .replace(/[^a-z0-9\s]/g, '')
      // remove unnecessary spacing
      .split(' ')
      .filter(word => word.length > 0)
      .join(' ');
  }

  addObject(obj: CreateFacilityParams) {
    const bucket = this.getBucketForObj(obj);
    bucket.add(obj);
  }

  getBucketForObj(obj: CreateFacilityParams): SimilarObjBucket {
    const key = this.getKey(obj);
    let bucket = this.map.get(key);
    if (bucket)
      return bucket;

    bucket = new SimilarObjBucket();
    this.map.set(key, bucket);
    return bucket;
  }

  getAll() {
    return [...this.map.values()]
      .map(bucket => bucket.getObjects())
      .flat();
  }
}

export default class ProviderAggregator {
  private combineUniqueElements<T>(first: T[], second: T[]) {
    return [...new Set([...first, ...second])];
  }

  combine(
    first: CreateFacilityParams, second: CreateFacilityParams
  ): CreateFacilityParams {
    return {
      cards: [...first.cards, ...second.cards],
      city: first.city || second.city,
      description: first.description || second.description,
      district: first.district || second.district,
      email: first.email || second.email,
      fanpage: first.fanpage || second.fanpage,
      flatNumber: first.flatNumber || second.flatNumber,
      images: [...first.images, ...second.images],
      location: first.location,
      name: first.name,
      open24h: first.open24h || second.open24h,
      openHours: first.openHours.length ? first.openHours : second.openHours,
      phone: first.phone || second.phone,
      postalCode: first.postalCode || second.postalCode,
      seasonal: first.seasonal || second.seasonal,
      serviceTypes: this.combineUniqueElements(
        first.serviceTypes, second.serviceTypes
      ),
      sources: [...first.sources, ...second.sources],
      streetName: first.streetName || second.streetName,
      streetNumber: first.streetNumber || second.streetNumber,
      website: first.website || second.website,
      filters: this.combineUniqueElements(
        first.filters, second.filters
      )
    };
  }

  combineTwoSets(
    first: CreateFacilityParams[], second: CreateFacilityParams[]
  ): CreateFacilityParams[] {
    const possibleDuplicates = new PossibleDuplicatesMap();

    for (const obj of first) {
      possibleDuplicates.addObject(obj);
    }

    for (const obj of second) {
      const bucket = possibleDuplicates.getBucketForObj(obj);
      const duplicate = bucket.search(obj);
      if (duplicate)
        bucket.replace(duplicate, this.combine(duplicate, obj));
      else
        bucket.add(obj);
    }

    return possibleDuplicates.getAll();
  }
}