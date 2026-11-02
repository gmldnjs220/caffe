from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
out=Path('C:/School/coffee_site/output/erd');out.mkdir(parents=True,exist_ok=True)
im=Image.new('RGB',(2100,1690),'white');d=ImageDraw.Draw(im)
def font(n,b=False):return ImageFont.truetype('C:/Windows/Fonts/malgun'+('bd' if b else '')+'.ttf',n)
def text(x,y,s,n=26,b=False):d.text((x,y),s,font=font(n,b),fill='black')
text(70,35,'원보틀 카페 사이트 ERD',46,True)
text(70,108,'매장 · 메뉴 분류 · 메뉴 · 공지사항  |  문의 및 회원 제외',27)
def box(x,y,w,title,rows):
 h=92+len(rows)*49+16
 d.rectangle((x,y,x+w,y+h),outline='black',width=4)
 text(x+22,y+17,title,32,True);d.line((x,y+76,x+w,y+76),fill='black',width=3)
 for i,(key,name,desc) in enumerate(rows):
  yy=y+92+i*49
  text(x+19,yy,key,22,True);text(x+82,yy,name,25,True);text(x+410,yy,desc,25)
 return (x,y,w,h)
cafe=box(70,215,880,'CAFE  매장',[
 ('PK','cafe_id','매장 고유 번호'),('','name','매장 이름'),('','introduction','카페 소개글'),('','address','매장 주소'),('','business_hours','영업시간 안내'),('','closed_days','정기휴무 안내'),('','parking_info','주차 안내'),('','transit_info','대중교통 안내'),('','main_image_path','대표 이미지 경로'),('','updated_at','마지막 수정 시각')])
cat=box(1150,215,880,'MENU_CATEGORY  메뉴 분류',[
 ('PK','category_id','분류 고유 번호'),('FK','cafe_id','연결된 매장 번호'),('','name','분류 이름'),('','sort_order','표시 순서')])
menu=box(1150,795,880,'MENU  메뉴',[
 ('PK','menu_id','메뉴 고유 번호'),('FK','category_id','연결된 분류 번호'),('','name','메뉴 이름'),('','description','메뉴 설명'),('','price','원 단위 가격'),('','image_path','메뉴 이미지 경로'),('','is_published','공개 여부'),('','sort_order','표시 순서'),('','created_at','등록 시각'),('','updated_at','마지막 수정 시각')])
notice=box(70,1015,880,'NOTICE  공지사항',[
 ('PK','notice_id','공지 고유 번호'),('FK','cafe_id','연결된 매장 번호'),('','title','공지 제목'),('','content','공지 본문'),('','is_published','공개 여부'),('','created_at','등록 시각'),('','updated_at','마지막 수정 시각')])
def line(points):d.line(points,fill='black',width=4)
# Relations connect the primary-key rows to the corresponding foreign-key rows.
line([(950,327),(1045,327),(1045,376),(1150,376)])
text(965,280,'1',28,True);text(1100,330,'N',28,True)
line([(510,813),(510,1015)])
text(532,824,'1',28,True);text(532,957,'N',28,True)
text(250,895,'매장별 공지사항',25)
line([(1590,535),(1590,795)])
text(1615,550,'1',28,True);text(1615,738,'N',28,True)
text(1315,652,'분류별 메뉴',25)
text(70,1550,'PK  고유 번호     FK  다른 테이블을 참조하는 번호',28,True)
text(70,1600,'1 : N  하나에 여러 개 연결  ·  공개 여부: 1 공개 / 0 비공개',26)
im.save(out/'coffee_erd.png')
print(out/'coffee_erd.png')
