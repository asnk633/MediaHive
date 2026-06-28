with open("index.html", "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if any(keyword in line for keyword in ["470px", "860px", "gradient", "backdrop", "blur"]):
            print(f"{i}: {line.strip()}")
