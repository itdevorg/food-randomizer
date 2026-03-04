from PIL import Image
import os

source_img = r"C:\Users\pisak\.gemini\antigravity\brain\9cb2fc68-bac1-4a88-bc5a-522a8bc10cfe\food_randomizer_logo_1772599640189.png"
output_dir = r"d:\Antigravity\what-to-eat\public\icons"
favicon_path = r"d:\Antigravity\what-to-eat\public\favicon.ico"

# Create output dir if not exists
os.makedirs(output_dir, exist_ok=True)

# Open the generated logo
try:
    img = Image.open(source_img)
    # Ensure it's RGBA for transparency stuff if needed, though it's likely RGB
    img = img.convert("RGBA")

    # Sizes needed for manifest
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]

    # Resize and save for each size
    for size in sizes:
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        out_path = os.path.join(output_dir, f"icon-{size}x{size}.png")
        resized.save(out_path, "PNG")

    # Save favicon.ico
    favicon_img = img.resize((32, 32), Image.Resampling.LANCZOS)
    favicon_img.save(favicon_path, format="ICO", sizes=[(32, 32)])
    print("Icons successfully generated and saved!")
except Exception as e:
    print(f"Error processing image: {e}")
