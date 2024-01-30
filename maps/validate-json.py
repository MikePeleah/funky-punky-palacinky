import json

in_file = "highlight_countries.json"

with open(in_file) as f:
    data = json.load(f) 

for f in data.get("features"):
    ID = f.get('id')
    prop = f.get('properties')
    name =  prop.get('name')
    desc =  prop.get('description')
    print(f"ID: {ID} - {name}\nDescription:")
    print(f"{desc}")

print("* * * That's all, Folks! * * *")
