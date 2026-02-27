from PIL import Image

def remove_bg(image_path, threshold=240):
    img = Image.open(image_path).convert("RGBA")
    params = img.load()
    width, height = img.size
    
    for x in range(width):
        for y in range(height):
            r, g, b, a = params[x, y]
            if r > threshold and g > threshold and b > threshold:
                params[x, y] = (255, 255, 255, 0)
                
    img.save(image_path, "PNG")

if __name__ == "__main__":
    remove_bg("d:/Antigravity/what-to-eat/public/esiimsi.png")
