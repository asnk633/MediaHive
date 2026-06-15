import urllib.request, json, os

def load_env(path):
    env = {}
    if os.path.exists(path):
        with open(path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip().strip('"').strip("'")
    return env

parent_env = load_env("../.env.local")
key = parent_env.get("SUPABASE_SERVICE_ROLE_KEY")

req = urllib.request.Request("https://fcctcorycpvebupluzpe.supabase.co/rest/v1/system_config")
req.add_header("apikey", key)

with urllib.request.urlopen(req) as response:
    print(json.dumps(json.loads(response.read()), indent=2))
