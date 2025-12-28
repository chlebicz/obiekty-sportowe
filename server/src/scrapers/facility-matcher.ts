import { SemanticMatcher } from './semantic-matcher';
import Embedding from './embedding';

export interface SimpleLocation {
  lng: number;
  lat: number;
}

export interface MatchableFacility {
  name: string;
  city?: string;
  streetName?: string;
  streetNumber?: string;
  flatNumber?: string;
  location: SimpleLocation | { coordinates: number[] };
}

export type FacilityWithEmbedding<T> = {
  facility: T;
  embedding: Embedding;
};

export class FacilityMatcher {
  private static instance: FacilityMatcher;
  private matcher = SemanticMatcher.getInstance();

  private constructor() {}

  static getInstance(): FacilityMatcher {
    if (!FacilityMatcher.instance) {
      FacilityMatcher.instance = new FacilityMatcher();
    }
    return FacilityMatcher.instance;
  }

  async init() {
    await this.matcher.init();
  }

  private getCleanName(facility: MatchableFacility): string {
    let cleaned = facility.name.toLowerCase();
    if (facility.city) {
      cleaned = cleaned.replace(facility.city.toLowerCase(), '');
    }
    if (facility.streetName) {
      cleaned = cleaned.replace(facility.streetName.toLowerCase(), '');
    }
    // Remove all non-alphanumeric chars (removes spaces, punctuation)
    return cleaned.replace(/[^\p{L}0-9]/gu, '');
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

  getTextForEmbedding(f: MatchableFacility): string {
    return [
      f.name, f.streetName, f.streetNumber, f.flatNumber, f.city
    ]
      .filter(el => el) // remove nulls
      .join(' ').replace(/\s+/g, ' ').trim();
  }

  getLocation(f: MatchableFacility): SimpleLocation {
    if ('coordinates' in f.location && Array.isArray(f.location.coordinates)) {
      return { lng: f.location.coordinates[0], lat: f.location.coordinates[1] };
    }
    return f.location as SimpleLocation;
  }

  areLocationsClose(f1: MatchableFacility, f2: MatchableFacility): boolean {
    const loc1 = this.getLocation(f1);
    const loc2 = this.getLocation(f2);

    const lngDiff = Math.abs(loc1.lng - loc2.lng);
    const latDiff = Math.abs(loc1.lat - loc2.lat);

    // ~200 meters difference roughly (0.002 deg approx 220m lat)
    return lngDiff < 0.002 && latDiff < 0.002;
  }

  async generateEmbedding(text: string): Promise<Embedding> {
    return this.matcher.generateEmbedding(text);
  }

  private static CERTAIN_COS_SIMILARITY = 0.99;
  private static COS_SIMILARITY_THRESHOLD = 0.85;
  private static NAME_SIMILARITY_THRESHOLD = 0.8;

  async findBestMatch<T extends MatchableFacility>(
    target: MatchableFacility,
    candidates: FacilityWithEmbedding<T>[]
  ): Promise<{ match: T | null; score: number }> {
    const targetEmbedding = await this.generateEmbedding(
      this.getTextForEmbedding(target)
    );

    let bestMatch: T | null = null;
    let maxScore = -1;

    for (const candidate of candidates) {
      const cosSimilarity = targetEmbedding.similarity(candidate.embedding);
      const isGeographicallyClose = this.areLocationsClose(
        target, candidate.facility
      );

      if (!isGeographicallyClose)
        continue;

      const cleanTargetName = this.getCleanName(target);
      const cleanCandidateName = this.getCleanName(candidate.facility);
      const nameSimilarity = this.normalizedLevenshtein(
        cleanTargetName, cleanCandidateName
      );

      const isMatch = cosSimilarity > FacilityMatcher.CERTAIN_COS_SIMILARITY
        || (
          cosSimilarity > FacilityMatcher.COS_SIMILARITY_THRESHOLD
          && nameSimilarity > FacilityMatcher.NAME_SIMILARITY_THRESHOLD
        );

      if (isMatch && cosSimilarity > maxScore) {
        maxScore = cosSimilarity;
        bestMatch = candidate.facility;
      }
    }

    return { match: bestMatch, score: maxScore };
  }
}
