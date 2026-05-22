from PIL import Image

def remove_background(image_path, output_path):
    img = Image.open(image_path).convert("RGBA")
    data = img.load()
    width, height = img.size

    # A simple approach to floodfill transparent from the 4 corners
    # Let's use an iterative floodfill to find all connected background pixels
    def get_color(x, y):
        return data[x, y][:3]

    def is_bg(color):
        # White or near white background
        return color[0] > 230 and color[1] > 230 and color[2] > 230

    visited = set()
    stack = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]

    # Add border pixels to stack if they are near white
    for x in range(width):
        stack.append((x, 0))
        stack.append((x, height - 1))
    for y in range(height):
        stack.append((0, y))
        stack.append((width - 1, y))

    valid_stack = [p for p in stack if is_bg(get_color(*p))]

    while valid_stack:
        x, y = valid_stack.pop()
        if (x, y) in visited:
            continue
        visited.add((x, y))

        data[x, y] = (255, 255, 255, 0) # Make transparent

        # Check neighbors
        for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height:
                if (nx, ny) not in visited and is_bg(get_color(nx, ny)):
                    valid_stack.append((nx, ny))

    # Save
    img.save(output_path, "PNG")

remove_background("public/logo.jpg", "public/logo.png")
