import { DependencyList, EffectCallback, useEffect, useRef } from 'react';

export default function useUpdateEffect(
  effect: EffectCallback, deps?: DependencyList
) {
  const isMounting = useRef(false);

  useEffect(() => {
    isMounting.current = true;
  }, []);

  useEffect(() => {
    if (isMounting.current) {
      isMounting.current = false;
      return;
    }

    return effect();
  }, deps);
}