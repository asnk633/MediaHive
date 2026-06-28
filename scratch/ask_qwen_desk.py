import urllib.request
import json
import sys

prompt = """
We need to redesign the standalone `qwen-preview.html` 3D scene to match a highly realistic scroll-driven desk transformation sequence, taking inspiration from the user's images.

### Design Goals:
1. **More Rich Clutter Objects on the Desk:**
   - **Sticky Notes:** Multi-colored squares (yellow, blue, orange) rotated slightly, with custom canvas-drawn handwritten text: "LOGOS DONE!", "CLIENT CALL 3PM", "EDIT SKETCHES", "DEADLINE FRI!".
   - **Colored Pens/Markers:** A cluster of cylinders (magenta, green, blue, yellow) lying together.
   - **Open Notebook:** Positioned on the right, showing "BRANDING IDEAS" text and logo sketches drawn on a canvas texture.
   - **Headphones:** Simple assembly of a torus band and cylindrical ear cups on the top-right.
   - **Coffee Mug:** A ceramic cup with "COFFEE FIRST" written on its texture.
   - **Succulent Plant:** A small pot (cone) with green succulent leaves (spheres/cones) on the top-center/right.
   - **Desk Surface:** An improved procedural wooden desk look (fine-grained wood pattern or standard material tuning).

2. **Transition to Scroll-Driven GSAP Timeline (using ScrollTrigger):**
   - Replace the automatic repeat timer with a scroll-driven timeline (`ScrollTrigger` pinning the `#three-canvas` container).
   - **Scroll 0% to 40% (Clutter Clearing):** Staggered fly-off/disappearance of all clutter objects (notebook, pens, headphones, succulent, sticky notes, coffee cup), clearing the desk to leave only the closed laptop.
   - **Scroll 40% to 80% (Laptop Opening):** The camera zooms in slightly, and the laptop lid rotates open smoothly from 0 (closed) to -Math.PI * 0.65 (open).
   - **Scroll 80% to 100% (Logo Reveal):** The screen glows, and the official MediaHive brand logo (loaded from `/Media Hive final logo.png`) fades in on the emissiveMap of the screen.

Please generate the complete, production-ready ES Module code block that implements this. Use the existing import maps and CDN imports for Three.js (r163) and GSAP. Include the canvas textures for text on notes, cup, and notebook pages. Ensure shadow maps, decay=0 lights, and BokehPass are active and calibrated. Do not truncate the code.
"""

url = "http://localhost:11434/api/generate"
data = {
    "model": "qwen2.5-coder:latest",
    "prompt": prompt,
    "stream": False,
    "options": {
        "num_ctx": 16384  # Ensure large context window for full code generation
    }
}

req = urllib.request.Request(
    url, 
    data=json.dumps(data).encode("utf-8"), 
    headers={"Content-Type": "application/json"}
)

print("Sending request to Ollama (model: qwen2.5-coder:latest)...")
try:
    with urllib.request.urlopen(req, timeout=300) as response:
        res = json.loads(response.read().decode("utf-8"))
        print("\n=== QWEN RESPONSE ===")
        # Write response to a text file for parsing, and print summary
        output_text = res.get("response", "")
        with open("scratch/qwen_desk_output.txt", "w", encoding="utf-8") as f:
            f.write(output_text)
        print("Success! Qwen response saved to scratch/qwen_desk_output.txt")
except Exception as e:
    print(f"Error calling Ollama: {e}", file=sys.stderr)
