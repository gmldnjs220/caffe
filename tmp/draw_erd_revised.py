from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
im=Image.new('RGB',(2100,1450),'white');d=ImageDraw.Draw(im)
def font(n,b=False):return ImageFont.truetype('C:/Windows/Fonts/malgun'+('bd' if b else '')+'.ttf',n)
def text(x,y,s,n=26,b=False):d.text((x,y),s,font=font(n,b),fill='black')
text(70,35,'카페 사이트 ERD 수정안',46,True)
text(70,110,'단일 매장 기준 · 메뉴 분류 / 메뉴 / 공지사항',28)
def box(x,y,w,title,rows):
 h=100+len(rows)*52
 d.rectangle((x,y,x+w,y+h),outline='black',width=4)
 text(x+22,y+18,title,32,True);d.line((x,y+76,x+w,y+76),fill='black',width=3)
 for i,(key,name,desc) in enumerate(rows):
  yy=y+91+i*52
  text(x+16,yy,key,21,True);text(x+112,yy,name,25,True);text(x+440,yy,desc,25)
 return y+h
bottom=box(70,220,900,'MENU_CATEGORY  메뉴 분류',[
 ('PK','category_id','분류 고유 번호'),('','name','분류 이름'),('','sort_order','표시 순서')])
box(1130,220,900,'MENU  메뉴',[
 ('PK','menu_id','메뉴 고유 번호'),('FK','category_id','연결된 분류 번호'),('','name','메뉴 이름'),('','description','메뉴 설명'),('','price','원 단위 가격'),('','image_path','메뉴 이미지 경로'),('','is_published','공개 여부'),('','sort_order','표시 순서'),('','created_at','등록 시각'),('','updated_at','마지막 수정 시각')])
d.line([(970,331),(1050,331),(1050,383),(1130,383)],fill='black',width=4)
text(989,284,'1',28,True);text(1082,337,'N',28,True)
box(70,690,900,'NOTICE  공지사항',[
 ('PK','notice_id','공지 고유 번호'),('','title','공지 제목'),('','content','공지 본문'),('','is_published','공개 여부'),('','created_at','등록 시각'),('','updated_at','마지막 수정 시각')])
text(1130,900,'메뉴 기본키: menu_id',29,True)
text(1130,960,'메뉴 이름이나 분류가 바뀌어도 ID 유지',26)
text(1130,1010,'공지사항은 다른 테이블과 연결하지 않음',26)
text(70,1230,'PK  고유 식별 기준     FK  다른 테이블을 참조하는 컬럼',28,True)
text(70,1285,'menu_id는 자동 증가하는 고유 번호 · category_id는 분류 연결용',27)
text(70,1340,'1 : N  하나의 분류에 여러 메뉴 연결  ·  공개 여부: 1 공개 / 0 비공개',26)
out=Path('C:/School/coffee_site/output/erd/coffee_erd_revised.png')
im.save(out)
