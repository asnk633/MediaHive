import zipfile
import sys

try:
    with zipfile.ZipFile('thaiba_ui_package.zip', 'r') as z:
        print("Zip file is valid. Contents:")
        for name in z.namelist():
            print(f" - {name}")
except zipfile.BadZipFile:
    print("Error: Bad Zip File")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
