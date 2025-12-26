export default class Embedding {
  constructor(private data: number[]) {}

  similarity(other: Embedding) {
    if (this.data.length !== other.data.length) {
      throw new Error('Embeddings must be of the same length');
    }

    // Since we normalized the vectors during generation,
    // Cosine Similarity is just the Dot Product.
    let dotProduct = 0;
    for (let i = 0; i < this.data.length; i++) {
      dotProduct += this.data[i] * other.data[i];
    }
    return dotProduct;
  }
}