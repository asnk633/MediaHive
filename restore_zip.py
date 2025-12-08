import base64

chunks = [
"UEsDBBQAAAAIAPhmfFsa3iEjfwAAAJ4AAAAKAAAAc3JjL2NvbXBvbmVudHMvVG9wQmFyLnRzeGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFRvcEJhcigpe3JldHVybiA8aGVhZGVyPlRoYWliYSBHYXJkZW4gTWVkaWEgTWFuYWdlcjwvaGVhZGVyPjt9",
"UEsDBBQAAAAIAPhmfFvytoujfwAAAJ4AAAAKAAAAc3JjL2NvbXBvbmVudHMvRkFCLnRzeGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEZBQigpe3JldHVybiA8YnV0dG9uIGFyaWEtbGFiZWw9J2ZhYic+KzwvYnV0dG9uPjt9",
"UEsDBBQAAAAIAPhmfFvNHc6jfwAAAJ4AAAAKAAAAc3JjL3BhZ2VzL1Rhc2tzUGFnZS50c3hlekBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBUYXNrc1BhZ2UoKXtyZXR1cm4gPGRpdj5UYXNrcyBQYWdlIC0gcGxhY2Vob2xkZXI8L2Rpdj47fQ==",
"UEsDBBQAAAAIAPhmfFvYAXijfwAAAJ4AAAAKAAAAc3JjL2NvbXBvbmVudHMvQ2FsZW5kYXIudHN4ZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQ2FsZW5kYXIoKSB7cmV0dXJuIDxkaXY+Q2FsZW5kYXIgUGFnZSAtIHBsYWNlaG9sZGVyPC9kaXY+O31QSwMEFAAAAAgA+GZ8W/bcLqN/AAAAEAAAAA4AAABzcmMvYXBwL2dsb2JhbHMuY3NzIHJvb3R7LS1ib3R0b20tbmF2LWhlaWdodDoyMnB4O31ib2R5e2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDE4MGRlZywjMGYxNzJhLCMwMjA2MTcpO2NvbG9yOiNlNmVlZjg7Zm9udC1mYW1pbHk6SW50ZXIsc3lzdGVtLXVpLEFyaWFsO30=",
]

b64_data = ''.join(chunks).replace('\n','').replace('\r','').strip()
missing_padding = len(b64_data) % 4
if missing_padding != 0:
    b64_data += '=' * (4 - missing_padding)
with open('thaiba_ui_package.zip','wb') as f:
    f.write(base64.b64decode(b64_data))
print('Reconstructed: thaiba_ui_package.zip')
