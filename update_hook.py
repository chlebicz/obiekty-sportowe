import re

with open('client/app/hooks/useFacilities.ts', 'r') as f:
    content = f.read()

content = content.replace('''  useEffect(() => {
    if (!params.mapBounds) return;

    const controller = new AbortController();

    facilitiesService.findOnMap(params, { signal: controller.signal })
      .then(setObjects)
      .catch(() => {});

    return () => {
      controller.abort('Search parameters changed');
    };
  }, [
    params.searchValue,
    params.mapBounds,
    params.selectedCards,
    params.selectedFilters,
    params.selectedServiceTypes,
    params.sortingOption
  ]);''', '''  useEffect(() => {
    if (!params.mapBounds) return;

    const controller = new AbortController();

    facilitiesService.findOnMap(params, { signal: controller.signal })
      .then(setObjects)
      .catch(() => {});

    return () => {
      controller.abort('Search parameters changed');
    };
  }, [
    params.searchValue,
    params.mapBounds,
    params.zoom,
    params.selectedCards,
    params.selectedFilters,
    params.selectedServiceTypes,
    params.sortingOption
  ]);''')

with open('client/app/hooks/useFacilities.ts', 'w') as f:
    f.write(content)
