import { useEffect, useState } from 'react';
import { useServices } from '../lib/context';

export default function useFacilityData(id: number | undefined) {
  const { facilitiesService } = useServices();
  const [data, setData] = useState<any>();

  useEffect(() => {
    if (id)
      facilitiesService.getFacilityData(id)
        .then(setData)
        .catch(console.error);
    else
      setData(undefined);
  }, [id]);

  return data;
}