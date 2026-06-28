try:
    import cv2
    print("cv2 is available")
except ImportError:
    print("cv2 is NOT available")

try:
    import decord
    print("decord is available")
except ImportError:
    print("decord is NOT available")
