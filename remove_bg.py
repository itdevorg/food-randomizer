from PIL import Image

def remove_bg(input_path, output_path, threshold=240):
    img = Image.open(input_path).convert("RGBA")
    params = img.load()
    width, height = img.size
    
    for x in range(width):
        for y in range(height):
            r, g, b, a = params[x, y]
            if r > threshold and g > threshold and b > threshold:
                params[x, y] = (255, 255, 255, 0)
                
    img.save(output_path, "PNG")

if __name__ == "__main__":
    remove_bg(r"C:\Users\pisak\.gemini\antigravity\brain\32be10ef-b25c-4d56-9e1d-e83ae5a71e04\esiimsi_cup_1772427543266.png", "d:/Antigravity/what-to-eat/public/cup.png")
    remove_bg(r"C:\Users\pisak\.gemini\antigravity\brain\32be10ef-b25c-4d56-9e1d-e83ae5a71e04\esiimsi_stick_1772427577031.png", "d:/Antigravity/what-to-eat/public/stick.png")
