import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

def create_nanoguard_avatar():
    # 1. Supersampled canvas 2048x2048 for crisp rendering
    SIZE = 2048
    img = Image.new("RGBA", (SIZE, SIZE), (7, 10, 8, 255)) # #070a08
    draw = ImageDraw.Draw(img)

    cx, cy = SIZE // 2, SIZE // 2

    # 2. Radial background gradient from center
    glow_bg = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_bg)
    max_r = int(SIZE * 0.65)
    for r in range(max_r, 0, -12):
        factor = (1.0 - (r / max_r)) ** 2
        alpha = int(45 * factor)
        glow_draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=(155, 242, 70, alpha)
        )
    img = Image.alpha_composite(img, glow_bg)
    draw = ImageDraw.Draw(img)

    # 3. Tactical Cyber Grid & Dots
    grid_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    grid_draw = ImageDraw.Draw(grid_layer)
    grid_step = 64
    for x in range(128, SIZE - 128, grid_step):
        for y in range(128, SIZE - 128, grid_step):
            # Distance from center
            dist = math.hypot(x - cx, y - cy)
            if dist > 850:
                continue
            alpha = int(22 * (1.0 - dist / 850))
            grid_draw.rectangle([x - 1, y - 1, x + 1, y + 1], fill=(155, 242, 70, alpha))
            if (x // grid_step + y // grid_step) % 4 == 0:
                grid_draw.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(155, 242, 70, alpha + 20))
    img = Image.alpha_composite(img, grid_layer)

    # 4. Corner Tactical Brackets [ + ]
    corner_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(corner_layer)
    bracket_len = 80
    c_pad = 140
    corners = [
        (c_pad, c_pad, 1, 1),
        (SIZE - c_pad, c_pad, -1, 1),
        (c_pad, SIZE - c_pad, 1, -1),
        (SIZE - c_pad, SIZE - c_pad, -1, -1)
    ]
    for x, y, dx, dy in corners:
        cdraw.line([(x, y), (x + dx * bracket_len, y)], fill=(155, 242, 70, 90), width=6)
        cdraw.line([(x, y), (x, y + dy * bracket_len)], fill=(155, 242, 70, 90), width=6)
        # Small cross
        px, py = x + dx * 20, y + dy * 20
        cdraw.line([(px - 8, py), (px + 8, py)], fill=(155, 242, 70, 140), width=3)
        cdraw.line([(px, py - 8), (px, py + 8)], fill=(155, 242, 70, 140), width=3)
    img = Image.alpha_composite(img, corner_layer)

    # 5. Shield Geometry Coordinates
    # Chiseled tactical cyberpunk shield
    shield_pts = [
        (cx, cy - 660),              # Top peak
        (cx + 460, cy - 540),        # Top right shoulder
        (cx + 520, cy - 180),        # Upper right flank
        (cx + 420, cy + 220),        # Mid right inward
        (cx + 260, cy + 520),        # Lower right slope
        (cx, cy + 720),              # Bottom tip
        (cx - 260, cy + 520),        # Lower left slope
        (cx - 420, cy + 220),        # Mid left inward
        (cx - 520, cy - 180),        # Upper left flank
        (cx - 460, cy - 540)         # Top left shoulder
    ]

    # Inner facets
    inner_shield = [
        (cx, cy - 610),
        (cx + 410, cy - 500),
        (cx + 460, cy - 170),
        (cx + 370, cy + 190),
        (cx + 220, cy + 470),
        (cx, cy + 650),
        (cx - 220, cy + 470),
        (cx - 370, cy + 190),
        (cx - 460, cy - 170),
        (cx - 410, cy - 500)
    ]

    # Left and Right inner halves for 3D bevel lighting
    left_half = [
        (cx, cy - 610),
        (cx - 410, cy - 500),
        (cx - 460, cy - 170),
        (cx - 370, cy + 190),
        (cx - 220, cy + 470),
        (cx, cy + 650)
    ]
    right_half = [
        (cx, cy - 610),
        (cx + 410, cy - 500),
        (cx + 460, cy - 170),
        (cx + 370, cy + 190),
        (cx + 220, cy + 470),
        (cx, cy + 650)
    ]

    # 6. Neon Bloom Layers (Multi-pass Gaussian Blur)
    # Deep ambient bloom
    bloom1 = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    b1_draw = ImageDraw.Draw(bloom1)
    b1_draw.polygon(shield_pts, outline=(155, 242, 70, 180), width=36)
    bloom1 = bloom1.filter(ImageFilter.GaussianBlur(radius=55))

    # Mid bloom
    bloom2 = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    b2_draw = ImageDraw.Draw(bloom2)
    b2_draw.polygon(shield_pts, outline=(155, 242, 70, 220), width=18)
    bloom2 = bloom2.filter(ImageFilter.GaussianBlur(radius=22))

    # Crisp glow line
    bloom3 = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    b3_draw = ImageDraw.Draw(bloom3)
    b3_draw.polygon(shield_pts, outline=(195, 255, 120, 255), width=8)
    bloom3 = bloom3.filter(ImageFilter.GaussianBlur(radius=5))

    img = Image.alpha_composite(img, bloom1)
    img = Image.alpha_composite(img, bloom2)

    # 7. Shield Base & Facets
    shield_base = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shield_base)

    # Outer border rim
    sdraw.polygon(shield_pts, fill=(12, 18, 14, 250), outline=(31, 39, 33, 255), width=6)

    # Facet lighting: Left side slightly darker (shadow), Right side slightly brighter (key light)
    sdraw.polygon(left_half, fill=(16, 24, 18, 255))
    sdraw.polygon(right_half, fill=(23, 33, 26, 255))

    # Center vertical ridge
    sdraw.line([(cx, cy - 610), (cx, cy + 650)], fill=(155, 242, 70, 70), width=4)

    # Inner perimeter circuit trace
    sdraw.polygon(inner_shield, outline=(155, 242, 70, 60), width=3)

    img = Image.alpha_composite(img, shield_base)
    img = Image.alpha_composite(img, bloom3)

    # 8. Core Cyber Emblem: NanoGuard "N" Fortress Key
    emblem_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    edraw = ImageDraw.Draw(emblem_layer)

    # Modern sharp geometric 'N' & shield crest
    # Left vertical pillar
    edraw.polygon([
        (cx - 260, cy - 300),
        (cx - 160, cy - 300),
        (cx - 160, cy + 240),
        (cx - 260, cy + 320)
    ], fill=(155, 242, 70, 245))

    # Right vertical pillar
    edraw.polygon([
        (cx + 160, cy - 320),
        (cx + 260, cy - 240),
        (cx + 260, cy + 300),
        (cx + 160, cy + 300)
    ], fill=(155, 242, 70, 245))

    # Diagonal bridge
    edraw.polygon([
        (cx - 160, cy - 220),
        (cx - 160, cy - 90),
        (cx + 160, cy + 220),
        (cx + 160, cy + 90)
    ], fill=(210, 255, 140, 255))

    # Core Fortress Lock Center Accent (Diamond core)
    core_pts = [
        (cx, cy - 140),
        (cx + 90, cy),
        (cx, cy + 140),
        (cx - 90, cy)
    ]
    edraw.polygon(core_pts, fill=(7, 10, 8, 255), outline=(155, 242, 70, 255), width=8)

    inner_core = [
        (cx, cy - 70),
        (cx + 45, cy),
        (cx, cy + 70),
        (cx - 45, cy)
    ]
    edraw.polygon(inner_core, fill=(155, 242, 70, 255))

    # Circuit lines radiating from core
    circuits = [
        ([(cx - 90, cy), (cx - 150, cy), (cx - 200, cy - 50)], (cx - 200, cy - 50)),
        ([(cx + 90, cy), (cx + 150, cy), (cx + 200, cy + 50)], (cx + 200, cy + 50)),
        ([(cx, cy - 140), (cx, cy - 220)], (cx, cy - 220)),
        ([(cx, cy + 140), (cx, cy + 260), (cx + 60, cy + 320)], (cx + 60, cy + 320)),
        ([(cx, cy + 140), (cx, cy + 260), (cx - 60, cy + 320)], (cx - 60, cy + 320))
    ]
    for path, node in circuits:
        edraw.line(path, fill=(155, 242, 70, 180), width=5)
        edraw.ellipse([node[0] - 8, node[1] - 8, node[0] + 8, node[1] + 8], fill=(215, 255, 150, 255))

    # Glow for emblem
    emblem_bloom = emblem_layer.filter(ImageFilter.GaussianBlur(radius=16))
    img = Image.alpha_composite(img, emblem_bloom)
    img = Image.alpha_composite(img, emblem_layer)

    # 9. Tactical Typography & Badges
    text_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    tdraw = ImageDraw.Draw(text_layer)

    # Top Status Pill: [ NANOGUARD // PRO SECTOR ]
    pill_w, pill_h = 480, 56
    pill_x = cx - pill_w // 2
    pill_y = cy - 760
    tdraw.rounded_rectangle(
        [pill_x, pill_y, pill_x + pill_w, pill_y + pill_h],
        radius=12,
        fill=(19, 24, 20, 230),
        outline=(51, 65, 57, 255),
        width=3
    )

    # Status LED in pill
    tdraw.ellipse([pill_x + 24, pill_y + 20, pill_x + 40, pill_y + 36], fill=(155, 242, 70, 255))

    # Bottom Pill: [ HARDENED // OFFLINE ]
    b_pill_w, b_pill_h = 420, 50
    b_pill_x = cx - b_pill_w // 2
    b_pill_y = cy + 780
    tdraw.rounded_rectangle(
        [b_pill_x, b_pill_y, b_pill_x + b_pill_w, b_pill_y + b_pill_h],
        radius=10,
        fill=(19, 24, 20, 230),
        outline=(51, 65, 57, 255),
        width=3
    )
    tdraw.ellipse([b_pill_x + 22, b_pill_y + 18, b_pill_x + 36, b_pill_y + 32], fill=(155, 242, 70, 255))

    img = Image.alpha_composite(img, text_layer)

    # 10. Downsample from 2048 to 1024 (2x Lanczos Supersampling)
    final_avatar = img.resize((1024, 1024), Image.Resampling.LANCZOS)

    # 11. Save outputs
    # A) High-Res Avatar for Desktop / Telegram / GitHub
    desktop_avatar = r"C:\Users\nanodev\Desktop\NanoGuard_Avatar.png"
    final_avatar.save(desktop_avatar, "PNG", optimize=True)
    print(f"[+] Saved 1024x1024 Avatar to Desktop: {desktop_avatar}")

    # B) 512x512 app icons
    icon_512 = final_avatar.resize((512, 512), Image.Resampling.LANCZOS)
    build_png = r"C:\Users\nanodev\NanoGuard\build\icon.png"
    engine_png = r"C:\Users\nanodev\NanoGuard\resources\engine\icon.png"
    icon_512.save(build_png, "PNG", optimize=True)
    icon_512.save(engine_png, "PNG", optimize=True)
    print(f"[+] Saved 512x512 app icon: {build_png}")

    # C) Multi-size Windows ICO (16, 24, 32, 48, 64, 128, 256)
    ico_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (24, 24), (16, 16)]
    build_ico = r"C:\Users\nanodev\NanoGuard\build\icon.ico"
    engine_ico = r"C:\Users\nanodev\NanoGuard\resources\engine\icon.ico"
    desktop_ico = r"C:\Users\nanodev\Desktop\NanoGuard_Icon.ico"

    final_avatar.save(build_ico, format="ICO", sizes=ico_sizes)
    final_avatar.save(engine_ico, format="ICO", sizes=ico_sizes)
    final_avatar.save(desktop_ico, format="ICO", sizes=ico_sizes)
    print(f"[+] Saved Multi-layer Windows ICO to Desktop: {desktop_ico}")

if __name__ == "__main__":
    create_nanoguard_avatar()
