export type RequestOptions = {
  query?: { [k: string]: any },
  signal?: AbortSignal
};

const defaultApiUrl = 'http://localhost:3001';
if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn(
    `Environment variable NEXT_PUBLIC_API_URL is not set, using default: "${defaultApiUrl}"`
  );
}
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? defaultApiUrl;

export default class ApiClient {
  constructor(private baseUrl = apiUrl) {}

  private getQueryString(query: { [k: string]: any } | undefined) {
    if (!query) return '';

    const queryString = Object.entries(query)
      .flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map(
            v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`
          );
        } else if (value !== undefined && value !== null && value !== '') {
          return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        } else {
          return [];
        }
      })
      .join('&');

    return queryString ? `?${queryString}` : '';
  }

  async get(endpoint: string, { query, signal }: RequestOptions = {}) {
    const url = this.baseUrl + endpoint + this.getQueryString(query);
    const res = await fetch(url, { signal });
    return await res.json();
  }

  static async isApiOnline(): Promise<boolean> {
    const res = await fetch(apiUrl);
    return res.ok;
  }
}
