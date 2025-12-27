import { CreateFacilityParams } from 'src/facilities/facilities.service';
import { FacilityMatcher, FacilityWithEmbedding } from './facility-matcher';

export default class ProviderAggregator {
  private facilityMatcher = FacilityMatcher.getInstance();

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

  async combineTwoSets(
    first: CreateFacilityParams[], second: CreateFacilityParams[]
  ): Promise<CreateFacilityParams[]> {
    await this.facilityMatcher.init();

    // Group first set by city for optimization
    const facilitiesByCity = new Map<string, FacilityWithEmbedding<CreateFacilityParams>[]>();

    // Process first set (source of truth / base set)
    for (const item of first) {
      const key = item.postalCode;
      if (!facilitiesByCity.has(key)) {
        facilitiesByCity.set(key, []);
      }

      const embedding = await this.facilityMatcher.generateEmbedding(
        this.facilityMatcher.getTextForEmbedding(item)
      );
      facilitiesByCity.get(key)!.push({ facility: item, embedding });
    }

    const newSecondSetFacilities: CreateFacilityParams[] = [];

    // Process second set and look for matches in the first set
    for (const item of second) {
      const key = item.postalCode;
      const candidates = facilitiesByCity.get(key) || [];

      if (candidates.length === 0) {
        newSecondSetFacilities.push(item);
        continue;
      }

      const { match: bestMatch } = await this.facilityMatcher.findBestMatch(item, candidates);

      // Maintain a map of "final objects" derived from the first set.
      // If matched, update that object.
      // If not matched, add `item` (from second set) as a new object.
      if (bestMatch) {
        // Merge
        const merged = this.combine(bestMatch, item);
        // Note: bestMatch is a reference to the object inside facilitiesByCity
        // We need to update it in place so that the final collection reflects the merge
        Object.assign(bestMatch, merged);
      } else {
        // No match found, treat as new facility
        newSecondSetFacilities.push(item);
      }
    }

    // Now collect all items: the ones from `first` (some might be merged) and the new ones from `second` (in `result`)
    const finalSet: CreateFacilityParams[] = [];

    for (const list of facilitiesByCity.values()) {
      for (const facilityWithEmbedding of list) {
        finalSet.push(facilityWithEmbedding.facility);
      }
    }

    return [...finalSet, ...newSecondSetFacilities];
  }
}
