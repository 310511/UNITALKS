from PIL import Image
import os

# Spotify green color (RGB)
TARGET_COLOR = (29, 185, 84)  # #1DB954 in RGB

# List of logos to process
LOGO_FILES = [
    'client/public/assets/logos/logo.png',
    'client/public/assets/logos/f.png',
    'client/public/assets/logos/log.png',
    'client/public/assets/logos/f2.png',
    'client/build/assets/logos/logo.png',
    'client/build/assets/logos/f.png',
    'client/build/assets/logos/log.png',
    'client/build/assets/logos/lo.png'
]

def update_logo_color(input_path):
    try:
        # Open the image
        img = Image.open(input_path)
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Get image data
        data = img.getdata()
        
        # Create new image data
        new_data = []
        for item in data:
            # If pixel is not transparent
            if item[3] > 0:  # Alpha channel > 0
                # Replace with target color while preserving alpha
                new_data.append((*TARGET_COLOR, item[3]))
            else:
                new_data.append(item)
        
        # Update image with new data
        img.putdata(new_data)
        
        # Save the image
        img.save(input_path)
        print(f"Updated {input_path} to Spotify green")
        
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    for logo_path in LOGO_FILES:
        full_path = os.path.join(script_dir, logo_path)
        if os.path.exists(full_path):
            update_logo_color(full_path)
        else:
            print(f"File not found: {full_path}")

if __name__ == "__main__":
    main()


