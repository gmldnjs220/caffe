from pathlib import Path
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH

root=Path('C:/School/coffee_site')
doc=Document()
sec=doc.sections[0]
sec.page_width=Cm(21);sec.page_height=Cm(29.7)
sec.top_margin=Cm(1.7);sec.bottom_margin=Cm(1.7)
sec.left_margin=Cm(1.8);sec.right_margin=Cm(1.8)
for name in ['Normal','Title','Heading 1','Heading 2']:
 st=doc.styles[name];st.font.name='맑은 고딕';st.font.color.rgb=RGBColor(0,0,0)
 st.element.get_or_add_rPr().rFonts.set(qn('w:eastAsia'),'맑은 고딕')
 st.paragraph_format.space_after=Pt(6)
doc.styles['Normal'].font.size=Pt(10)
doc.styles['Normal'].paragraph_format.line_spacing=1.1
doc.styles['Title'].font.size=Pt(21)
doc.styles['Heading 1'].font.size=Pt(15)
doc.styles['Heading 2'].font.size=Pt(11)
foot=sec.footer.paragraphs[0];foot.alignment=WD_ALIGN_PARAGRAPH.RIGHT
f=OxmlElement('w:fldSimple');f.set(qn('w:instr'),'PAGE');foot._p.append(f)
page=0;y=0;L=0
def start():
 global page
 if page:doc.add_page_break()
 page+=1
def end():pass
def heading(s):
 doc.add_paragraph(s, 'Title' if s=='커피 사이트 개발 기획서' else 'Heading 1')
def sub(s):doc.add_paragraph(s,'Heading 2')
def note(s):
 p=doc.add_paragraph(s);p.paragraph_format.space_after=Pt(9)
 for r in p.runs:r.font.size=Pt(9);r.font.color.rgb=RGBColor.from_string('606060')
def fields(items,gap=30):
 for s in items:
  p=doc.add_paragraph(s+': ')
  p.paragraph_format.space_after=Pt(max(6,gap-19))
  p.paragraph_format.keep_together=True
def table(headers,rows,widths,height=39):
 t=doc.add_table(rows=1,cols=len(headers));t.autofit=False;t.alignment=WD_TABLE_ALIGNMENT.CENTER
 for col,w in zip(t.columns,widths):col.width=Cm(w/sum(widths)*17.4)
 for cell,s in zip(t.rows[0].cells,headers):cell.text=s
 for values in rows:
  cells=t.add_row().cells
  for cell,s in zip(cells,values):cell.text=s.replace('\n',' ')
 for i,row in enumerate(t.rows):
  row.height=Pt(25 if i==0 else min(height,34))
  trpr=row._tr.get_or_add_trPr();el=OxmlElement('w:cantSplit');trpr.append(el)
  if i==0:trpr.append(OxmlElement('w:tblHeader'))
  for j,cell in enumerate(row.cells):
   cell.width=Cm(widths[j]/sum(widths)*17.4);cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
   pr=cell._tc.get_or_add_tcPr();borders=OxmlElement('w:tcBorders')
   for edge in ['top','left','bottom','right']:
    b=OxmlElement('w:'+edge);b.set(qn('w:val'),'single');b.set(qn('w:sz'),'4');b.set(qn('w:color'),'D9D9D9');borders.append(b)
   pr.append(borders)
   if i==0:
    sh=OxmlElement('w:shd');sh.set(qn('w:fill'),'E8EDF0');pr.append(sh)
   for p in cell.paragraphs:
    p.paragraph_format.space_before=Pt(4);p.paragraph_format.space_after=Pt(4)
    for r in p.runs:r.font.size=Pt(9);r.bold=i==0
 p=doc.add_paragraph();p.paragraph_format.space_after=Pt(2);p.paragraph_format.space_before=Pt(0);p.paragraph_format.line_spacing=Pt(4)
def txt(s,*a,**kw):
 p=doc.add_paragraph('☐ '+s);p.paragraph_format.space_after=Pt(9)
class Dummy:
 def setStrokeColor(self,*a):pass
 def rect(self,*a,**kw):pass
 def save(self):pass
c=Dummy()
def HexColor(s):return s
source=(root/'tmp/pdfs/create_plan.py').read_text(encoding='utf-8-sig')
body=source.split('\nstart()\n',1)[1]
body=body.rsplit('print(OUT)',1)[0]
start()
exec(body)
out=root/'output/docx/커피_사이트_개발_기획서.docx';out.parent.mkdir(parents=True,exist_ok=True)
doc.save(out)
print(out)
