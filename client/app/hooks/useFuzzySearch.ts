import { useState } from 'react';
import { useServices } from '../lib/context';
import useUpdateEffect from './useUpdateEffect';
import { FuzzySearchResult } from '../lib/services/facilities';

export default function useFuzzySearch(input: string, delay = 500) {
  const { facilitiesService } = useServices();

  const [result, setResult] = useState<FuzzySearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useUpdateEffect(() => {
    if (!input) {
      setResult([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);

      const result = await facilitiesService.fuzzySearch(input);
      setLoading(false);
      setResult(result);
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [input]);

  return { result, loading };
}