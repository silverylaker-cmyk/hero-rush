"""Prepare supplied key art. Never modifies the input file.
python3 tools/rembg.py raw/ironwall.png ironwall [--background white|green]
Requires Pillow; optional rembg fallback is explicit (--rembg).
"""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops


def cutout(path, background='white', use_rembg=False):
    image = Image.open(path).convert('RGBA')
    if use_rembg:
        from rembg import remove
        image = remove(image)
    elif image.getextrema()[3][0] == 255:
        # Remove only the border-connected matte; preserve white costume details.
        matte = Image.new('L', image.size, 0)
        data = []
        for r, g, b, _ in image.getdata():
            is_bg = (g > 150 and g > r*1.4 and g > b*1.4) if background == 'green' else min(r,g,b) > 220 and max(r,g,b)-min(r,g,b) < 20
            data.append(255 if is_bg else 0)
        matte.putdata(data)
        for xy in [(0,0),(image.width-1,0),(0,image.height-1),(image.width-1,image.height-1)]:
            if matte.getpixel(xy) == 255: ImageDraw.floodfill(matte, xy, 128)
        image.putalpha(matte.point(lambda v: 0 if v == 128 else 255))
    box = image.getchannel('A').getbbox()
    if not box: raise ValueError(f'Empty key art: {path}')
    return image.crop(box)


def export(image, hero_id, root=Path('public/assets')):
    unit = Image.new('RGBA', (1024,1024))
    image.thumbnail((940,960), Image.Resampling.LANCZOS)
    unit.alpha_composite(image, ((1024-image.width)//2,1024-image.height))
    (root/'units').mkdir(parents=True,exist_ok=True)
    (root/'portraits').mkdir(parents=True,exist_ok=True)
    unit.save(root/'units'/f'{hero_id}.png')
    # Upper-body crop, with face placement reviewed in the contact sheet.
    side=min(image.width, int(image.height*.57))
    face=image.crop(((image.width-side)//2,0,(image.width+side)//2,side))
    face.resize((256,256), Image.Resampling.LANCZOS).save(root/'portraits'/f'{hero_id}.png')


if __name__ == '__main__':
    p=argparse.ArgumentParser();p.add_argument('input');p.add_argument('id');p.add_argument('--background',choices=['white','green'],default='green');p.add_argument('--rembg',action='store_true')
    args=p.parse_args();export(cutout(args.input,args.background,args.rembg),args.id)
