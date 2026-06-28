import hashlib
import os

files = [
    "Media App logo 1024.png",
    "Media App logo honey 1024.png",
    "Media App logo for Luminous.png",
    "Media App logo for Midnight.png",
    "new_logo_dark.png",
    "new_logo_light.png"
]

for f in files:
    if os.path.exists(f):
        with open(f, "rb") as fh:
            h = hashlib.sha256(fh.read()).hexdigest()
            print(f"{f}: {h}")
