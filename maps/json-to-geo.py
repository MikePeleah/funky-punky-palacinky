import json

in_file = "ca-middle-corridor.json"
out_file = "ca-middle-corridor-geo.json"

with open(in_file) as f:
    data = json.load(f) 

geo_data_features = []
points = {}

# Pass 1: Get coordinates of points 
for d in data:
    dname = d.get('name')
    dcoord = [d.get('longitude'), d.get('latitude')]
    points[dname] = dcoord
    print(f"Processing {dname}")
    geo_data_features.append({"type": "Feature",
                              "properties": {"name": dname}, 
                              "geometry": {"type": "Point", 
                                           "coordinates": dcoord}})

# Pass 2: Process connections
for d in data:
    conn = d.get("connections")
    if conn:
        dname = d.get('name')
        for c in conn:
            if c != dname:
                print(f"Processing connection {dname}-{c}")
                geo_data_features.append({"type": "Feature",
                                        "properties": {"name": dname + "-" + c, "connection_type": "corridor"}, 
                                        "geometry": {"type": "LineString", 
                                                    "coordinates": [points.get(dname), points.get(c)]}})
geo_data = {"type": "FeatureCollection", "features": geo_data_features}

# Dump JSON into file
with open(out_file, "w") as f:
    json.dump(geo_data, f, indent = 4) 

print("* * * That's all, folks! * * *")    


