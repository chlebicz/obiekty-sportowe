import { CreateFacilityParams } from 'src/facilities/facilities.service';
import { SemanticMatcher } from './semantic-matcher';

type EnrichedFacility = {
  facility: CreateFacilityParams;
  embedding: number[];
};

export default class ProviderAggregator {
  private matcher = SemanticMatcher.getInstance();

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

  private getTextForEmbedding(f: CreateFacilityParams): string {
    // Combine relevant fields to form a sentence describing the facility identity
    return `${f.name} ${f.streetName || ''} ${f.streetNumber || ''} ${f.city || ''}`.replace(/\s+/g, ' ').trim();
  }

  private areLocationsClose(
    f1: CreateFacilityParams, f2: CreateFacilityParams
  ): boolean {
    const lngDiff = Math.abs(f1.location.lng - f2.location.lng);
    const latDiff = Math.abs(f1.location.lat - f2.location.lat);

    // ~200 meters difference roughly (0.002 deg approx 220m lat)
    return lngDiff < 0.002 && latDiff < 0.002;
  }

  async combineTwoSets(
    first: CreateFacilityParams[], second: CreateFacilityParams[]
  ): Promise<CreateFacilityParams[]> {
    await this.matcher.init();

    // Group first set by city for optimization
    const firstByCity = new Map<string, EnrichedFacility[]>();

    // Process first set (source of truth / base set)
    for (const item of first) {
        const cityKey = (item.city || 'unknown').toLowerCase();
        if (!firstByCity.has(cityKey)) {
            firstByCity.set(cityKey, []);
        }

        const embedding = await this.matcher.generateEmbedding(this.getTextForEmbedding(item));
        firstByCity.get(cityKey)!.push({ facility: item, embedding });
    }

    const result: CreateFacilityParams[] = [];
    const matchedFirstSetIndices = new Set<string>(); // To track which items from first set were merged

    // Process second set and look for matches in the first set
    for (const item of second) {
        const cityKey = (item.city || 'unknown').toLowerCase();
        const candidates = firstByCity.get(cityKey) || [];

        if (candidates.length === 0) {
            result.push(item);
            continue;
        }

        const itemEmbedding = await this.matcher.generateEmbedding(this.getTextForEmbedding(item));

        let bestMatch: EnrichedFacility | null = null;
        let maxScore = -1;

        for (const candidate of candidates) {
            const similarity = this.matcher.cosineSimilarity(itemEmbedding, candidate.embedding);
            const isGeographicallyClose = this.areLocationsClose(item, candidate.facility);

            // Heuristic: If similarity is very high (>0.90) AND physically close
            // Threshold derived from testing:
            // - Exact match or messy address (e.g. number in street): ~1.0
            // - Minor name variation (e.g. "Sp. z o.o."): ~0.96
            // - Different gym at same/similar address: ~0.86
            if (similarity > 0.90 && isGeographicallyClose) {
                if (similarity > maxScore) {
                    maxScore = similarity;
                    bestMatch = candidate;
                }
            }
        }

        if (bestMatch) {
            // Merge
            const merged = this.combine(bestMatch.facility, item);

            // We need to replace the original object in the map or mark it as handled so we don't return the original unmerged version later.
            // Since `first` items are stored in `firstByCity`, we can track them.
            // But `result` currently only accumulates processed items from `second`.
            // We need a way to output ALL items (merged + unmerged from first + unmerged from second).

            // Strategy:
            // 1. Add all unmerged `first` items to result later.
            // 2. If merged, update the `bestMatch.facility` in place (or mark it) and add the merged result to a separate list?

            // Better Strategy:
            // Maintain a map of "final objects" derived from the first set.
            // If matched, update that object.
            // If not matched, add `item` (from second set) as a new object.

            // Let's implement this:
            // We can modify the object inside `firstByCity` directly (it's a reference).
            bestMatch.facility = merged;
        } else {
            // No match found, treat as new facility
            result.push(item);
        }
    }

    // Now collect all items: the ones from `first` (some might be merged) and the new ones from `second` (in `result`)
    const finalSet: CreateFacilityParams[] = [];

    for (const list of firstByCity.values()) {
        for (const enriched of list) {
            finalSet.push(enriched.facility);
        }
    }

    return [...finalSet, ...result];
  }
}
