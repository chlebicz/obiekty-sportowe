import re

with open('client/app/map/page.tsx', 'r') as f:
    content = f.read()

content = content.replace('''  const [mapBounds, setMapBounds] = useState<LatLngBounds>();

  const [searchValue, setSearchValue] = useState('');''', '''  const [mapBounds, setMapBounds] = useState<LatLngBounds>();
  const [zoom, setZoom] = useState<number | undefined>();

  const [searchValue, setSearchValue] = useState('');''')

content = content.replace('''          searchParams: {
            mapBounds, setMapBounds,

            searchValue, setSearchValue,''', '''          searchParams: {
            mapBounds, setMapBounds,
            zoom, setZoom,

            searchValue, setSearchValue,''')

with open('client/app/map/page.tsx', 'w') as f:
    f.write(content)
