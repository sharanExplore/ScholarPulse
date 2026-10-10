import fitz
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

def parse_doc(path):
    print('========================================')
    print('PARSING:', path)
    doc = fitz.open(path)
    full_text = '\n\n'.join(p.get_text() for p in doc)
    
    tables = []
    for idx, page in enumerate(doc):
        text = page.get_text()
        for m in re.finditer(r'(?:Table|TABLE)\s*(\d+)[\:\-\.]\s*([^\n]+(?:\n[^\n]+)?)', text):
            tbl_num = int(m.group(1))
            tbl_caption = re.sub(r'\s+', ' ', m.group(0)).strip()[:200]
            post_text = text[m.end():m.end() + 800].strip()
            lines = [l.strip() for l in post_text.split('\n') if l.strip()]
            tables.append({'page': idx+1, 'num': tbl_num, 'caption': tbl_caption, 'lines': lines})
            
    print(f'Found {len(tables)} tables')
    for t in tables:
        print(f"  Table {t['num']} (Page {t['page']}): {t['caption']}")
        print(f"    First 6 lines: {t['lines'][:6]}")
    doc.close()

parse_doc('backend/uploads/f3c1070e-63c8-4dde-a0b8-6b56db56bc4e_input_scholar_pulse.pdf')
parse_doc('backend/uploads/065ce79a-4ee9-45c9-969b-f4dfab258d7a_scholarpulse_example_input.pdf')
