# -*- coding: utf-8 -*-
"""生成 Android 启动图标资源：
  mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png      旧式方形图标（自带星空底）
  mipmap-*/ic_launcher_round.png                               旧式圆形图标
  mipmap-*/ic_launcher_background.png                          自适应图标 · 背景层（108dp）
  mipmap-*/ic_launcher_foreground.png                          自适应图标 · 前景层（108dp，水晶缩进安全区）
"""
import os
import random
from PIL import Image, ImageDraw, ImageFilter

SRC = '/workspace/assets/image/kaiju_icon_512.png'
RES = '/home/Maker/kaiju/app/src/main/res'

DENS = [('mdpi', 1.0), ('hdpi', 1.5), ('xhdpi', 2.0), ('xxhdpi', 3.0), ('xxxhdpi', 4.0)]
LEGACY_DP = 48          # 旧式图标基准尺寸
ADAPTIVE_DP = 108       # 自适应图标画布
SAFE_RATIO = 0.62       # 前景图缩放比例（保证落在 66dp 安全圆内）

src = Image.open(SRC).convert('RGBA')


def starry(size):
    """深紫星空底：竖向渐变 + 中心光晕 + 星点。"""
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for y in range(size):
        t = y / max(1, size - 1)
        d.line([(0, y), (size, y)], fill=(int(12 + (46 - 12) * t),
                                          int(10 + (14 - 10) * t),
                                          int(34 + (66 - 34) * t), 255))
    k = size / 512.0

    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i in range(28, 0, -1):
        r = int((512 * 0.30 + i * 6) * k)
        a = int(9 + (28 - i) * 3)
        cy = int(size * 0.54)
        gd.ellipse([size // 2 - r, cy - r, size // 2 + r, cy + r],
                   fill=(150, 80, 220, min(a, 90)))
    im.alpha_composite(glow.filter(ImageFilter.GaussianBlur(max(2, 26 * k))))

    rnd = random.Random(20260922)
    sd = ImageDraw.Draw(im)
    for _ in range(int(86 * k * k) + 12):
        x = rnd.randint(1, size - 2)
        y = rnd.randint(1, size - 2)
        r = max(1, int(rnd.choice([1, 1, 1, 1, 2]) * k))
        a = rnd.randint(55, 165)
        c = rnd.choice([(255, 255, 255, a), (180, 230, 255, a), (255, 200, 250, a)])
        sd.ellipse([x - r, y - r, x + r, y + r], fill=c)
    return im


def legacy_icon(size):
    """旧式图标：水晶 + 星空底，满幅。"""
    im = starry(size)
    a = src.resize((int(size * 0.90), int(size * 0.90)), Image.LANCZOS)
    im.alpha_composite(a, ((size - a.width) // 2, int(size * 0.045)))
    return im


def foreground(size):
    """自适应图标前景层：透明底，水晶缩进到安全区。"""
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    k = size / 512.0
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i in range(18, 0, -1):
        r = int((size * 0.26 + i * 4 * k))
        gd.ellipse([size // 2 - r, size // 2 - r, size // 2 + r, size // 2 + r],
                   fill=(150, 80, 220, 14))
    im.alpha_composite(glow.filter(ImageFilter.GaussianBlur(max(2, 12 * k))))
    a = src.resize((int(size * SAFE_RATIO), int(size * SAFE_RATIO)), Image.LANCZOS)
    im.alpha_composite(a, ((size - a.width) // 2, (size - a.height) // 2))
    return im


def background(size):
    return starry(size)


def save(im, path, rgb=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    (im.convert('RGB') if rgb else im).save(path, optimize=True)
    print('  %-58s %s' % (path.replace(RES + '/', ''), im.size))


for name, scale in DENS:
    d = os.path.join(RES, 'mipmap-' + name)
    lg = int(round(LEGACY_DP * scale))
    ad = int(round(ADAPTIVE_DP * scale))
    print('[%s] legacy=%d adaptive=%d' % (name, lg, ad))
    icon = legacy_icon(lg)
    save(icon, d + '/ic_launcher.png', rgb=True)
    save(icon, d + '/ic_launcher_round.png', rgb=True)
    save(background(ad), d + '/ic_launcher_background.png', rgb=True)
    save(foreground(ad), d + '/ic_launcher_foreground.png')

# 源图与生成脚本一并入库，方便以后重做图标
os.makedirs('/home/Maker/kaiju/assets/icon', exist_ok=True)
src.save('/home/Maker/kaiju/assets/icon/icon-512.png', optimize=True)
print('source -> assets/icon/icon-512.png')
print('DONE')
