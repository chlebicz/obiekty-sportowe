import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';

export class SemanticMatcher {
  private static instance: SemanticMatcher;
  private extractor: FeatureExtractionPipeline | null = null;
  private modelName = 'Xenova/all-MiniLM-L6-v2';

  private constructor() {}

  static getInstance(): SemanticMatcher {
    if (!SemanticMatcher.instance) {
      SemanticMatcher.instance = new SemanticMatcher();
    }
    return SemanticMatcher.instance;
  }

  async init() {
    if (!this.extractor) {
      // Create the pipeline.
      // The first run will download the model to a local cache.
      this.extractor = await pipeline('feature-extraction', this.modelName);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.extractor) {
      await this.init();
    }

    // Normalize text lightly (lowercase) to help the model, though not strictly necessary
    const cleanedText = text.toLowerCase().trim();

    // Generate embedding
    // pooling: 'mean' averages the token embeddings to get a sentence embedding
    // normalize: true ensures the vector has length 1 (L2 norm), making dot product equal to cosine similarity
    const output = await this.extractor!(cleanedText, { pooling: 'mean', normalize: true });

    // Convert Tensor to standard number array
    return Array.from(output.data);
  }

  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must be of the same length');
    }

    // Since we normalized the vectors during generation,
    // Cosine Similarity is just the Dot Product.
    let dotProduct = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
    }
    return dotProduct;
  }
}
