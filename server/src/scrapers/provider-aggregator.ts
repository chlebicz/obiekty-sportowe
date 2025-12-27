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

  private levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1 // deletion
            )
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  private normalizedLevenshtein(a: string, b: string): number {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1.0;
    const distance = this.levenshteinDistance(a, b);
    return 1.0 - distance / maxLen;
  }

  private cleanName(name: string, city?: string): string {
      let cleaned = name.toLowerCase();
      if (city) {
          cleaned = cleaned.replace(city.toLowerCase(), '');
      }
      // Remove all non-alphanumeric chars (removes spaces, punctuation)
      return cleaned.replace(/[^a-z0-9]/g, '');
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

            // Clean names (remove city, spaces, special chars) to check "core" name match
            const cleanedA = this.cleanName(item.name, item.city);
            const cleanedB = this.cleanName(candidate.facility.name, candidate.facility.city);
            const nameSimilarityClean = this.normalizedLevenshtein(cleanedA, cleanedB);

            // Refined Hybrid Logic
            // 1. Extreme confidence in embedding (>0.99): likely exact string match or perfect alias
            // 2. High confidence (>0.85) AND High core-name match (>0.80)
            //    - "Blue Gym" vs "Blue Fitness": Sim High, CleanSim Low (0.58) -> Fail
            //    - "Test Gym Warsaw" vs "Test Gym": Sim High, CleanSim 1.0 -> Pass
            //    - "Salsafit" vs "Salsa Fit": Sim Medium/High, CleanSim 1.0 -> Pass

            let isMatch = false;

            if (isGeographicallyClose) {
              if (similarity > 0.99) {
                isMatch = true;
              } else if (similarity > 0.85 && nameSimilarityClean > 0.80) {
                isMatch = true;
              }
            }

            if (isMatch) {
                if (similarity > maxScore) {
                    maxScore = similarity;
                    bestMatch = candidate;
                }
            }
        }

        if (bestMatch) {
            // Merge
            const merged = this.combine(bestMatch.facility, item);
            bestMatch.facility = merged;
        } else {
            // No match found, treat as new facility
            result.push(item);
        }
    }

    const finalSet: CreateFacilityParams[] = [];

    for (const list of firstByCity.values()) {
        for (const enriched of list) {
            finalSet.push(enriched.facility);
        }
    }

    return [...finalSet, ...result];
  }
}
