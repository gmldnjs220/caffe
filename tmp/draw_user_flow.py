from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
im=Image.new('RGB',(2200,1370),'white');d=ImageDraw.Draw(im)
def f(n,b=False):return ImageFont.truetype('C:/Windows/Fonts/malgun'+('bd' if b else '')+'.ttf',n)
def text_center(x,y,s,size=25,b=False):
 for i,line in enumerate(s.split('\n')):
  w=d.textlength(line,font=f(size,b));d.text((x-w/2,y+i*(size+12)),line,font=f(size,b),fill='black')
def box(cx,y,s,w=370,h=100,b=False):
 d.rectangle((cx-w/2,y,cx+w/2,y+h),outline='black',width=3)
 lines=s.count('\n')+1;text_center(cx,y+(h-lines*37)/2,s,25,b)
 return (cx,y,cx,y+h)
def arrow(x,y,x2,y2):
 d.line((x,y,x2,y2),fill='black',width=3)
 if y2>y:d.polygon([(x2,y2),(x2-8,y2-13),(x2+8,y2-13)],fill='black')
 elif x2>x:d.polygon([(x2,y2),(x2-13,y2-8),(x2-13,y2+8)],fill='black')
text_center(1100,25,'원보틀 카페 사이트 방문자 플로우차트',40,True)
box(1100,110,'사이트 접속',390,70);arrow(1100,180,1100,220)
box(1100,220,'메인 페이지\n사진 슬라이드 · 소개글',680,110,True)
xs=[230,665,1100,1535,1970]
d.line((230,385,1970,385),fill='black',width=3);d.line((1100,330,1100,385),fill='black',width=3)
names=['카페 소개','전체 메뉴 보기','공지사항 게시판','영업시간 · 정기휴무','오시는 길']
for x,name in zip(xs,names):arrow(x,385,x,430);box(x,430,name,b=True)
steps=[['소개글 · 매장 사진 확인'],['전체 / 분류 선택','공개 메뉴 카드 확인\n이름 · 설명 · 가격 · 사진'],['공개 공지 목록 확인','공지 제목 선택','공지 상세 확인','목록으로 돌아가기'],['영업시간 확인\n정기휴무 확인'],['주소 · 주차 안내\n대중교통 안내 확인','주소 복사','복사 성공 안내\n실패 시 주소 직접 선택']]
for x,seq in zip(xs,steps):
 yy=530
 for s in seq:
  arrow(x,yy,x,yy+35);box(x,yy+35,s);yy+=135
text_center(1100,1130,'모든 페이지 → 공통 상단 메뉴로 이동 가능 · 로고 선택 → 홈',28,True)
text_center(1100,1190,'빈 메뉴 / 공지 목록 → 해당 화면에서 안내     서버 오류 → 오류 화면 → 홈',26)
text_center(1100,1250,'문의 · 대표 메뉴 · 메인 중요 공지 · 지도 보기는 제외 / 관리자 및 모바일은 추후 지원',25)
p=Path('C:/School/coffee_site/output/design/user_flow.png');p.parent.mkdir(parents=True,exist_ok=True);im.save(p)
