import { useState } from 'react';

export default function useLocation() {
  const [location, setLocation] = useState<GeolocationPosition>();

  const requestLocation = (cb: (v: GeolocationPosition) => any) =>
    navigator.geolocation.getCurrentPosition(
      value => {
        setLocation(value);
        cb(value);
      },
      (err) => {}
    );

  return { location, requestLocation };
}