import fitz
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_summary_and_contrib(path):
    print("========================================")
    print("TESTING:", path)
    doc = fitz.open(path)
    full_text = "\n\n".join(p.get_text() for p in doc)
    pages_text = [p.get_text() for p in doc]
    
    # Unhyphenate and clean text
    cleaned_pages = []
    for idx, p_text in enumerate(pages_text, 1):
        # normalize ligatures
        t = p_text.replace('ﬀ', 'ff').replace('ﬁ', 'fi').replace('ﬂ', 'fl').replace('ﬃ', 'ffi')
        # unhyphenate broken words across lines: e.g. "pa- per" -> "paper"
        t = re.sub(r'(\b[a-zA-Z]{2,})-\s*\n\s*([a-zA-Z]{2,}\b)', r'\1\2', t)
        cleaned_pages.append((idx, t))

    # Sentence extraction with page provenance
    all_sentences = []
    for p_num, p_text in cleaned_pages:
        lines = [l.strip() for l in p_text.split('\n') if l.strip()]
        clean_lines = []
        for l in lines:
            if re.match(r'^(?:Figure|Fig\.|Table)\s*\d+', l, re.I): continue
            if re.match(r'^(?:[0-9IVXLCDM]+\.?\s+)?(?:References|Acknowlegements)\b', l, re.I): continue
            if re.match(r'^[0-9\s\.\,\+\-\*\/\=\(\)\[\]\{\}\<\>\_\^\|\:\;\\\%]+$', l): continue
            if len(l) <= 3: continue
            clean_lines.append(l)
        para = " ".join(clean_lines)
        for s in re.split(r'(?<=[.!?])\s+(?=[A-Z])', para):
            s_clean = re.sub(r'\s+', ' ', s).strip()
            # strip citation brackets like [1] or [1, 2]
            s_no_cite = re.sub(r'\[[0-9\s,–\-]+\]', '', s_clean).strip()
            words = s_no_cite.split()
            if 10 <= len(words) <= 55 and s_no_cite.endswith('.'):
                if not any(f in s_no_cite for f in ['\\sum', 'w(x)', 'pk(x)', 'exp(', 'd(x)', 'dk', 'dv', 'sqrt(']):
                    all_sentences.append((p_num, s_no_cite))

    # Scientific Contribution Candidates
    contrib_cues = [
        r'\b(?:we propose|we present|in this paper|in this work|we introduce|we demonstrate|our network|architecture consists of|key concept|we achieve|we show results|allows for significantly more parallelization|generalizes well to)\b'
    ]
    contributions = []
    seen = set()
    for p_num, sent in all_sentences:
        if any(re.search(c, sent, re.I) for c in contrib_cues):
            norm = re.sub(r'\W+', '', sent.lower())
            if norm not in seen:
                seen.add(norm)
                # determine section
                sec = "Introduction"
                if p_num >= 6:
                    sec = "Experiments"
                elif p_num >= 3:
                    sec = "Method / Architecture"
                contributions.append({
                    "claim": sent,
                    "source_page": p_num,
                    "source_section": sec,
                    "confidence": 0.95
                })

    print(f"Extracted {len(contributions)} contributions:")
    for c in contributions[:5]:
        print(f"  [P{c['source_page']} - {c['source_section']}]: {c['claim']}")
    doc.close()

test_summary_and_contrib('backend/uploads/f3c1070e-63c8-4dde-a0b8-6b56db56bc4e_input_scholar_pulse.pdf')
test_summary_and_contrib('backend/uploads/065ce79a-4ee9-45c9-969b-f4dfab258d7a_scholarpulse_example_input.pdf')
