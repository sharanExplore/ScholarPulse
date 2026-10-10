import os
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

from agents.orchestrator import OrchestratorAgent

pdf_path = 'uploads/f3c1070e-63c8-4dde-a0b8-6b56db56bc4e_input_scholar_pulse.pdf'
with open(pdf_path, 'rb') as f:
    bytes_data = f.read()

orchestrator = OrchestratorAgent(upload_dir='uploads')
res = orchestrator.process_document('U_Net_Biomedical_Image_Segmentation.pdf', bytes_data)

print('=== CURRENT U-NET EXTRACTION RESULT ===')
print('Title:', res['metadata'].get('title'))
print('Authors:', res['metadata'].get('authors'))
print('Year:', res['metadata'].get('publication_year'))
print('Pages:', res['document'].get('page_count'))
print('Abstract snippet:', (res['metadata'].get('abstract') or '')[:300])
print('Total References:', len(res.get('validated_references', [])))
for r in res.get('validated_references', []):
    print(f"  Ref [{r.get('reference_number')}]: {r.get('title')[:45]} | Year: {r.get('year')} | In-text: {r.get('in_text_mention_count')}")

print('In-text mentions:', res['citation_metrics'].get('in_text_mentions'))
print('Reference density:', res['citation_metrics'].get('reference_density'))
print('Temporal distribution:', res['citation_metrics'].get('year_distribution'))
print('\nKey findings / Contributions:')
for c in res['summary'].get('key_findings', []):
    print(f"  * {c}")

print('\nKeywords (first 10):', [k['keyword'] for k in res['keywords'][:10]])
print('\nExperiments:')
for e in res.get('analysis', {}).get('experiments', []):
    print(f"  - {e}")
