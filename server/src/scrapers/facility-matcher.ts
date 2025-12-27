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
      const similarity = targetEmbedding.similarity(candidate.embedding);
      const isGeographicallyClose = this.areLocationsClose(
        target, candidate.facility
      );

      if (similarity > 0.90 && isGeographicallyClose) {
        if (similarity > maxScore) {
          maxScore = similarity;
          bestMatch = candidate.facility;
        }
      }
    }

    return { match: bestMatch, score: maxScore };
  }
}
