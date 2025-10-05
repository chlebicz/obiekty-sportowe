import React, { useContext, useEffect, useState } from 'react';
import useLocation from '../hooks/useLocation';
import {
  Marker as LeafletMarker, useMap
} from 'react-leaflet';
import { LeafletEvent, Map, ResizeEvent } from 'leaflet';
import MapWrapper, { CustomMarker } from './map-wrapper';
import { DataContext } from './data-context';
import {
  FacilityCluster, FacilitySingleton, isSingleton, MapObj
} from '../lib/services/facilities';
import useFacilities from '../hooks/useFacilities';

function getMarkerKey(obj: MapObj) {
  if (isSingleton(obj))
    return obj.value.id;
  
  const { lng, lat } = obj.value.location;
  return `${lng},${lat}`;
}

function ClusterMarker({ cluster }: { cluster: FacilityCluster }) {
  const map = useMap();

  const handleClick = () => {
    const location: [number, number] = [
      cluster.location.lat, cluster.location.lng
    ];
    map.setView(location, map.getZoom() + 1);
  }

  return (
    <CustomMarker
      position={cluster.location}
      eventHandlers={{
        click: handleClick
      }}
    >
      <div
        className={`
          rounded-full bg-white border-4 border-[#4698d0] w-10 h-10 flex
          items-center justify-center cursor-pointer font-bold text-[15px]
        `}
      >
        {cluster.count}
      </div>
    </CustomMarker>
  );
}

function SingletonMarker({ object }: { object: FacilitySingleton }) {
  const { setSelectedFacility } = useContext(DataContext);

  const handleClick = () =>
    setSelectedFacility!(object.id);

  return (
    <LeafletMarker
      position={[object.location.lat, object.location.lng]}
      eventHandlers={{
        click: handleClick
      }}
    />
  );
}

function Marker({ obj }: { obj: MapObj }) {
  if (obj.type === 'singleton')
    return <SingletonMarker object={obj.value as FacilitySingleton} />;
  if (obj.type === 'cluster')
    return <ClusterMarker cluster={obj.value as FacilityCluster} />;
}

export default function MapContents() {
  const { requestLocation } = useLocation();

  const {
    searchParams
  } = useContext(DataContext);
  const objects = useFacilities(searchParams);

  const { setMapBounds } = searchParams;

  const defaultZoom = 9;
  const [zoom, setZoom] = useState(defaultZoom);

  const defaultCenter = { lat: 52.2297, lng: 21.0122 }; // Warsaw
  const [center, setCenter] = useState(defaultCenter);

  useEffect(() => {
    requestLocation(location => {
      setCenter(
        { lat: location.coords.latitude, lng: location.coords.longitude }
      );
    });
  }, []);

  const handleBoundsChange = (e: ResizeEvent) => {
    setCenter(e.target.getCenter());
    setZoom(e.target.getZoom());
    setMapBounds(e.target.getBounds());
  }

  return (
    <div className='flex-1'>
      <MapWrapper
        zoom={zoom}
        center={center}
        eventHandlers={{
          dragend: handleBoundsChange,
          zoomend: handleBoundsChange,
          ready: (e: LeafletEvent) => {
            setMapBounds(e.target.getBounds());
          }
        }}
      >
        {objects.map(obj => <Marker obj={obj} key={getMarkerKey(obj)} />)}
      </MapWrapper>
    </div>
  );
}