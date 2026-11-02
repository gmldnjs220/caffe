from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor

ROOT=Path('C:/School/coffee_site')
OUT=ROOT/'output/pdf/커피_사이트_개발_기획서.pdf'
OUT.parent.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(TTFont('K','C:/Windows/Fonts/malgun.ttf'))
pdfmetrics.registerFont(TTFont('KB','C:/Windows/Fonts/malgunbd.ttf'))
c=canvas.Canvas(str(OUT),pagesize=(595.28,841.89))
c.setTitle('커피 사이트 개발 기획서')
W=499.28; L=48; y=0; page=0
def txt(s,x,y,size=10,bold=False,color='#253039'):
 c.setFillColor(HexColor(color));c.setFont('KB' if bold else 'K',size);c.drawString(x,y,s)
def start():
 global y,page
 page+=1;y=752
 txt('커피 사이트 개발 기획서',L,790,12,True,'#654B3C')
 c.setStrokeColor(HexColor('#CBBFB5'));c.line(L,778,547,778)
 txt('개발 기획서 · 작성 양식',L,29,8,color='#777777');txt(str(page),535,29,9)
def end():c.showPage()
def heading(s):
 global y
 txt(s,L,y,15,True,'#654B3C');y-=29
def sub(s):
 global y
 txt(s,L,y,11,True);y-=22
def note(s):
 global y
 txt(s,L,y,9,color='#6C747A');y-=24
def fields(items,gap=30):
 global y
 for s in items:
  txt(s+':',L,y)
  x=L+pdfmetrics.stringWidth(s+':','K',10)+12
  c.setStrokeColor(HexColor('#D4D9DD'));c.line(x,y-4,547,y-4);y-=gap
 y-=8
def table(headers,rows,widths,height=39):
 global y
 top=y+6; total=sum(widths);c.setFillColor(HexColor('#EEE9E4'));c.rect(L,top-32,total,32,fill=1,stroke=0)
 c.setStrokeColor(HexColor('#C8CDD1'));c.setLineWidth(.5)
 ys=[top,top-32]+[top-32-height*(i+1) for i in range(len(rows))]
 for yy in ys:c.line(L,yy,L+total,yy)
 x=L
 for w in [0]+widths:
  x+=w;c.line(x,top,x,ys[-1])
 def row(values,base,bold=False):
  x=L
  for s,w in zip(values,widths):
   lines=s.split('\n')
   for j,line in enumerate(lines):txt(line,x+7,base-14-j*13,8.5,bold)
   x+=w
 row(headers,top,True)
 for i,r in enumerate(rows):row(r,top-32-height*i)
 y=ys[-1]-26

start()
heading('커피 사이트 개발 기획서')
fields(['작성자','작성일','프로젝트명','목표 완료일'])
heading('1. 프로젝트 개요')
sub('사이트를 만드는 목적')
note('어떤 문제를 해결하거나 어떤 정보를 제공하려는지 작성합니다.')
fields(['제작 목적','주요 이용자','이용자가 사이트에서 할 수 있어야 하는 일','기대 효과'],36)
sub('개발 범위')
fields(['이번에 반드시 구현할 내용','시간이 남으면 추가할 내용','이번 개발에서 제외할 내용'],42)
end()
start()
heading('2. 사이트 구성')
note('필요한 페이지를 추가하거나 삭제합니다.')
table(['페이지','목적','들어갈 내용','주요 기능'],[
 ['메인','사이트 소개 및\n주요 메뉴 안내','',''],['커피 소개','커피 관련 정보 제공','',''],
 ['메뉴 목록','판매하거나 소개할\n메뉴 표시','',''],['메뉴 상세','선택한 메뉴의\n상세 정보 제공','',''],
 ['매장 안내','위치 및 운영 정보 제공','',''],['기타: _____','','','']], [80,145,137,137.28],43)
heading('3. 기능 요구사항')
note('‘사용자가 무엇을 하면 어떤 결과가 나타나는지’를 구체적으로 작성합니다.')
note('우선순위 기준: 필수 / 추가 / 추후')
table(['번호','기능명','사용자 행동과 처리 결과','우선순위','완료 기준'],
 [[f'F-0{i}','','','',''] for i in range(1,6)],[48,75,177,65,134.28],38)
end()
start()
heading('3. 기능 요구사항 (계속)')
sub('검토할 기능')
fields(['메뉴 검색 및 분류','회원가입 및 로그인','즐겨찾기','문의','주문 및 결제','관리자 등록·수정·삭제','기타'],25)
note('※ 필요한 기능만 선택합니다.')
heading('4. 사용자 이용 흐름')
sub('대표 이용 흐름')
note('예: 메인 접속 → 메뉴 목록 확인 → 메뉴 선택 → 상세 정보 확인')
fields(['사이트 접속 경로','첫 화면에서 할 행동','다음 화면에서 할 행동','최종적으로 완료할 행동'],28)
sub('예외 상황 처리')
fields(['검색 결과가 없을 때','필수 입력이 누락되었을 때','존재하지 않는 페이지에 접속했을 때','오류가 발생했을 때'],28)
end()
start()
heading('5. 화면 및 디자인')
fields(['전체 분위기','주요 색상','글꼴','참고 사이트','상단 메뉴 구성','하단 정보 구성','모바일에서의 화면 구성','로딩·오류·빈 화면 표시 방식'],23)
sub('화면별 구성')
table(['화면','표시할 요소','버튼·입력 항목','이동할 화면'],[['','','','']]*3,[90,150,150,109.28],32)
heading('6. 콘텐츠 및 자료 준비')
table(['자료','필요한 내용','준비 담당자','준비 기한'],[[s,'','',''] for s in ['로고','소개 문구','커피·메뉴 정보','사진','매장 정보','기타']],[105,190,105,99.28],26)
fields(['사진 및 글의 사용 권한 확인','콘텐츠 수정 방법','업데이트 주기'],24)
end()
start()
heading('7. 데이터 및 관리 방식')
note('저장이 필요한 정보와 관리 방법을 작성합니다.')
table(['데이터','저장 항목','등록·수정 담당자','저장 방식'],[[s,'','',''] for s in ['커피·메뉴','회원 정보','문의 내역','기타']],[90,165,135,109.28],40)
fields(['데이터베이스 필요 여부','관리자 화면 필요 여부','개인정보 수집 항목 및 목적','접근 권한','백업 및 삭제 방식'],28)
heading('8. 개발 환경 및 배포')
fields(['화면 개발 기술','서버 개발 기술 및 필요 여부','데이터베이스','외부 서비스 또는 API','개발 도구','코드 관리 방식','배포 서비스','도메인','예상 운영 비용'],26)
end()
start()
heading('9. 개발 일정')
table(['단계','작업 내용','시작일','완료일','결과물'],[
 ['기획','목적·페이지·기능 확정','','','개발 기획서'],['화면 설계','화면 구성 및 이용 흐름 정리','','','화면 설계안'],
 ['디자인','색상·글꼴·이미지 확정','','','디자인 시안'],['개발','페이지 및 기능 구현','','','동작하는 사이트'],
 ['검수','오류 수정 및 사용성 확인','','','검수 결과'],['배포','사이트 공개 및 최종 확인','','','접속 주소']],
 [65,170,70,70,124.28],37)
heading('10. 검수 및 완료 기준')
for s in ['필수 페이지가 모두 구현되어 있다.','필수 기능이 정의한 완료 기준을 충족한다.','링크와 버튼이 정상적으로 작동한다.','모바일과 PC에서 내용을 확인할 수 있다.','입력 오류와 빈 결과에 대한 안내가 있다.','이미지와 콘텐츠가 정상적으로 표시된다.','키보드로 주요 메뉴와 기능을 이용할 수 있다.','배포 주소에서 정상적으로 접속할 수 있다.','필요한 운영 방법이 정리되어 있다.']:
 c.setStrokeColor(HexColor('#78828A'));c.rect(L,y-2,8,8,fill=0,stroke=1);txt(s,L+17,y,10);y-=26
 y-=4
fields(['추가 검수 항목'],45)
end()
start()
heading('11. 제약 및 미정 사항')
fields(['예산','개발 가능 기간','기술 또는 서비스 제약','외부 자료 준비에 필요한 시간','예상되는 어려움','해결 방안'],48)
table(['결정할 사항','검토할 선택지','결정 기한','결정 내용'],[['','','','']]*3,[130,150,85,134.28],64)
end()
c.save()
print(OUT)

