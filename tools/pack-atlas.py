"""Pack ten 512px unit frames + ten 256px portraits into one 2048² texture."""
from pathlib import Path
import json
from PIL import Image
root=Path('public/assets')
ids=['ironwall','lancer','shade','ember','hawkeye','lumen','grunt','slinger','shaman','brute']
atlas=Image.new('RGBA',(2048,2048));frames={}
def add(id, im, x,y,w,h):
    atlas.alpha_composite(im.resize((w,h),Image.Resampling.LANCZOS),(x,y))
    frames[id]={'frame':dict(x=x,y=y,w=w,h=h),'rotated':False,'trimmed':False,'spriteSourceSize':dict(x=0,y=0,w=w,h=h),'sourceSize':dict(w=w,h=h)}
for i,id in enumerate(ids):add(id,Image.open(root/'units'/f'{id}.png').convert('RGBA'),i%4*512,i//4*512,512,512)
for i,id in enumerate(ids):add('portrait-'+id,Image.open(root/'portraits'/f'{id}.png').convert('RGBA'),i%8*256,1536+i//8*256,256,256)
atlas.save(root/'units'/'atlas.png',optimize=True)
(root/'units'/'atlas.json').write_text(json.dumps({'frames':frames,'meta':{'image':'atlas.png','size':{'w':2048,'h':2048},'scale':'1'}},indent=2)+'\n')
print('Packed',len(frames),'frames into 2048 x 2048:',(root/'units'/'atlas.png').stat().st_size,'bytes')
