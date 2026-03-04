from PIL import Image
import os

source_img = r"C:\Users\pisak\.gemini\antigravity\brain\9cb2fc68-bac1-4a88-bc5a-522a8bc10cfe\app_icon_minimal_1772600277912.png"
output_dir = r"d:\Antigravity\what-to-eat\public\icons"
favicon_path = r"d:\Antigravity\what-to-eat\public\favicon.ico"

def remove_dark_bg(img, threshold=40):
    """
    Looks for dark pixels (R, G, B all under threshold) and makes them transparent.
    """
    img = img.convert("RGBA")
    data = img.getdata()
    new_data = []
    
    # 1A1A1A is ~ rgb(26,26,26). Using threshold ~40 should catch it all.
    for item in data:
        # Check if pixel is dark-ish
        if item[0] < threshold and item[1] < threshold and item[2] < threshold:
            # Change to transparent
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    return img

os.makedirs(output_dir, exist_ok=True)

try:
    img = Image.open(source_img)
    
    # Run the background removal script (removes the dark background)
    img = remove_dark_bg(img, threshold=60) # Relaxed threshold a bit to catch anti-aliased dark edges

    sizes = [72, 96, 128, 144, 152, 192, 384, 512]

    # Resize and save for each size
    for size in sizes:
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        out_path = os.path.join(output_dir, f"icon-{size}x{size}.png")
        resized.save(out_path, "PNG")

    # Generate rounded favicon 
    favicon_img = img.resize((32, 32), Image.Resampling.LANCZOS)
    favicon_img.save(favicon_path, format="ICO", sizes=[(32, 32)])
    print("Minimalist App icons generated WITH TRANSPARENT BACKGROUND!")
except Exception as e:
    print(f"Error processing image: {e}")
