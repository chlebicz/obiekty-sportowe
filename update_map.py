import re

with open('client/app/map/map.tsx', 'r') as f:
    content = f.read()

content = content.replace('''  const { setMapBounds } = searchParams;

  const defaultZoom = 9;
  const [zoom, setZoom] = useState(defaultZoom);''', '''  const { setMapBounds, setZoom, zoom } = searchParams;

  const defaultZoom = 9;
  const currentZoom = zoom ?? defaultZoom;''')

content = content.replace('''  const handleBoundsChange = (e: ResizeEvent) => {
    setCenter(e.target.getCenter());
    setZoom(e.target.getZoom());
    setMapBounds(toBounds(e.target.getBounds()));
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
            setMapBounds(toBounds(e.target.getBounds()));
          }
        }}''', '''  const handleBoundsChange = (e: ResizeEvent) => {
    setCenter(e.target.getCenter());
    setZoom(e.target.getZoom());
    setMapBounds(toBounds(e.target.getBounds()));
  }

  return (
    <div className='flex-1'>
      <MapWrapper
        zoom={currentZoom}
        center={center}
        eventHandlers={{
          dragend: handleBoundsChange,
          zoomend: handleBoundsChange,
          ready: (e: LeafletEvent) => {
            setZoom(e.target.getZoom());
            setMapBounds(toBounds(e.target.getBounds()));
          }
        }}''')

with open('client/app/map/map.tsx', 'w') as f:
    f.write(content)
