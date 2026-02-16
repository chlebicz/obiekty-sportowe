import { CreateFacilityParams } from 'src/facilities/facilities.service';
import { SemanticMatcher } from './semantic-matcher';
import Embedding from './embedding';

type FacilityWithEmbedding = {
  facility: CreateFacilityParams;
  embedding: Embedding;
};

export default class ProviderAggregator {
  private matcher = SemanticMatcher.getInstance();

  private combineUniqueElements<T>(first: T[], second: T[]) {
    return [...new Set([...first, ...second])];
  }

  combine(
    first: CreateFacilityParams,
    second: CreateFacilityParams,
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
        first.serviceTypes,
        second.serviceTypes,
      ),
      sources: [...first.sources, ...second.sources],
      streetName: first.streetName || second.streetName,
      streetNumber: first.streetNumber || second.streetNumber,
      website: first.website || second.website,
      filters: this.combineUniqueElements(first.filters, second.filters),
    };
  }

  private getTextForEmbedding(f: CreateFacilityParams): string {
    // Combine relevant fields to form a sentence describing the facility identity
    return `${f.name} ${f.streetName || ''} ${f.streetNumber || ''} ${f.city || ''}`
      .replace(/\s+/g, ' ')
      .trim();
  }

  private areLocationsClose(
    f1: CreateFacilityParams,
    f2: CreateFacilityParams,
  ): boolean {
    const lngDiff = Math.abs(f1.location.lng - f2.location.lng);
    const latDiff = Math.abs(f1.location.lat - f2.location.lat);

    // ~200 meters difference roughly (0.002 deg approx 220m lat)
    return lngDiff < 0.002 && latDiff < 0.002;
  }

  async combineTwoSets(
    first: CreateFacilityParams[],
    second: CreateFacilityParams[],
  ): Promise<CreateFacilityParams[]> {
    await this.matcher.init();

    // Group first set by city for optimization
    const facilitiesByCity = new Map<string, FacilityWithEmbedding[]>();

    // Process first set (source of truth / base set)
    const firstEmbeddings = await Promise.all(
      first.map((item) =>
        this.matcher.generateEmbedding(this.getTextForEmbedding(item)),
      ),
    );

    first.forEach((item, index) => {
      const cityKey = (item.city || 'unknown').toLowerCase();
      if (!facilitiesByCity.has(cityKey)) {
        facilitiesByCity.set(cityKey, []);
      }
      facilitiesByCity
        .get(cityKey)!
        .push({ facility: item, embedding: firstEmbeddings[index] });
    });

    const newSecondSetFacilities: CreateFacilityParams[] = [];

    // Pre-calculate embeddings for second set items that have candidates
    const itemsNeedingEmbedding = second.filter((item) => {
      const cityKey = (item.city || 'unknown').toLowerCase();
      const candidates = facilitiesByCity.get(cityKey) || [];
      return candidates.length > 0;
    });

    const secondEmbeddings = await Promise.all(
      itemsNeedingEmbedding.map((item) =>
        this.matcher.generateEmbedding(this.getTextForEmbedding(item)),
      ),
    );

    const secondEmbeddingsMap = new Map<CreateFacilityParams, Embedding>();
    itemsNeedingEmbedding.forEach((item, index) => {
      secondEmbeddingsMap.set(item, secondEmbeddings[index]);
    });

    // Process second set and look for matches in the first set
    for (const item of second) {
      const cityKey = (item.city || 'unknown').toLowerCase();
      const candidates = facilitiesByCity.get(cityKey) || [];

      if (candidates.length === 0) {
        newSecondSetFacilities.push(item);
        continue;
      }

      const itemEmbedding = secondEmbeddingsMap.get(item)!;

      let bestMatch: FacilityWithEmbedding | null = null;
      let maxScore = -1;

      for (const candidate of candidates) {
        const isGeographicallyClose = this.areLocationsClose(
          item,
          candidate.facility,
        );

        if (!isGeographicallyClose) {
          continue;
        }

        const similarity = itemEmbedding.similarity(candidate.embedding);

        // Heuristic: If similarity is very high (>0.90)
        if (similarity > 0.9) {
          if (similarity > maxScore) {
            maxScore = similarity;
            bestMatch = candidate;
          }
        }
      }

      // Maintain a map of "final objects" derived from the first set.
      // If matched, update that object.
      // If not matched, add `item` (from second set) as a new object.
      if (bestMatch) {
        // Merge
        const merged = this.combine(bestMatch.facility, item);
        bestMatch.facility = merged;
      } else {
        // No match found, treat as new facility
        newSecondSetFacilities.push(item);
      }
    }

    // Now collect all items: the ones from `first` (some might be merged) and the new ones from `second` (in `result`)
    const finalSet: CreateFacilityParams[] = [];

    for (const list of facilitiesByCity.values()) {
      for (const enriched of list) {
        finalSet.push(enriched.facility);
      }
    }

    return [...finalSet, ...newSecondSetFacilities];
  }
}
