import { divIcon, DivIcon, LeafletEventHandlerFn, Map } from 'leaflet';
import React, { Ref, useEffect, useState } from 'react';
import { renderToReadableStream } from 'react-dom/server';
import {
  MarkerProps,
  Marker as LeafletMarker,
  MapContainer,
  MapContainerProps,
  TileLayer
} from 'react-leaflet';
import useUpdateEffect from '../hooks/useUpdateEffect';

async function rsToHTML(rs: ReadableStream) {
  const reader = rs.getReader();
  let html = '';
  while (true) {
    const { value, done } = await reader.read();
    if (value) {
      html += new TextDecoder().decode(value);
    }
    if (done) {
      return html;
    }
  }
}

function renderToString(children: React.ReactNode) {
  return renderToReadableStream(children)
    .then(rsToHTML);
}

export function CustomMarker({ children, ...props }: {
  children: React.ReactNode
} & MarkerProps) {
  const [icon, setIcon] = useState<DivIcon>();

  useEffect(() => {
    async function run() {
      setIcon(divIcon({
        html: await renderToString(children),
        className: ''
      }));
    }

    run();
  }, [children]);

  return icon ? <LeafletMarker {...props} icon={icon} /> : null;
}

export default function MapWrapper({
  children,
  zoom,
  center,
  eventHandlers,
  ...props
}: {
  children: React.ReactNode,
  zoom: number,
  center: { lat: number, lng: number },
  eventHandlers: { [k: string]: Function }
} & MapContainerProps) {
  const [map, setMap] = useState<Map>();

  useEffect(() => {
    if (!map)
      return;

    eventHandlers['ready']({
      target: map
    });

    for (const event in eventHandlers) {
      map.on(event, eventHandlers[event] as LeafletEventHandlerFn);
    }

    return () => {
      for (const event in eventHandlers) {
        map.removeEventListener(
          event, eventHandlers[event] as LeafletEventHandlerFn
        );
      }
    }
  }, [map]);

  useUpdateEffect(() => {
    if (!map)
      return;

    const isUnchanged = map.getCenter().lat === center.lat
      && map.getCenter().lng === center.lng
      && map.getZoom() === zoom;

    if (isUnchanged)
      return;

    map.setView([center.lat, center.lng], zoom);
  }, [zoom, center.lat, center.lng]);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ width: '100%', height: '100%', cursor: 'default' }}
      zoomControl={false}
      ref={setMap as Ref<Map>}
      {...props}
    >
      <TileLayer
        attribution={
          '&copy; <a href="https://www.openstreetmap.org/copyright">'
          + 'OpenStreetMap</a> contributors'
        }
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {children}
    </MapContainer>
  )
}