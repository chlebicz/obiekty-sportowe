import json

with open('server/package.json', 'r') as f:
    data = json.load(f)

# Allow transforming supercluster and kdbush (which supercluster depends on)
data['jest']['transformIgnorePatterns'] = [
    "/node_modules/(?!(@xenova|supercluster|kdbush)/)"
]

with open('server/package.json', 'w') as f:
    json.dump(data, f, indent=2)
