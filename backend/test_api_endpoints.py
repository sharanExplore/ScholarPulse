import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

# 1. Login to get token
login_req = urllib.request.Request(
    f"{BASE_URL}/api/auth/login",
    data=json.dumps({"email": "admin@scholarpulse.org", "password": "scholarpulse_admin_2026!"}).encode(),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(login_req) as resp:
    login_data = json.loads(resp.read().decode())
    token = login_data["token"]
    print(f"Logged in as {login_data['user']['email']}, role={login_data['user']['role']}")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

def get_json(url):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

pid = "a212edc5-173c-4d58-9f50-b16c511b51e1"
print(f"Testing paper ID: {pid}")

full_paper = get_json(f"{BASE_URL}/api/papers/{pid}")
val_refs = full_paper.get('validated_references', [])
print(f"Validated references count: {len(val_refs)}")
assert len(val_refs) == 40, f"Expected 40 references, got {len(val_refs)}"

# Check reference fields
for r in val_refs[:3]:
    print(f"  Ref [{r.get('reference_number')}]: {r.get('title')[:35]}... (in-text: {r.get('in_text_mention_count')})")

cm = full_paper.get('citation_metrics', {})
print("Citation Metrics:")
print(f"  total_references: {cm.get('total_references')}")
print(f"  in_text_mentions: {cm.get('in_text_mentions')}")
print(f"  reference_density: {cm.get('reference_density')}")
print(f"  external_citations: {cm.get('external_citations')}")
print(f"  year_distribution: {cm.get('year_distribution')}")
print(f"  year_percentages: {cm.get('year_percentages')}")

assert cm.get('total_references') == 40
assert cm.get('in_text_mentions') == sum(r.get('in_text_mention_count', 0) for r in val_refs)
assert cm.get('in_text_mentions') > 0
assert '2.67' in str(cm.get('reference_density'))
assert cm.get('external_citations') == 'N/A'
assert cm.get('year_distribution', {}).get('<2015') == 13
assert cm.get('year_distribution', {}).get('2015-2019') == 27
assert cm.get('year_distribution', {}).get('2020-2023', 0) == 0
assert cm.get('year_distribution', {}).get('2024-2026', 0) == 0

# Check Citation Intelligence endpoint directly
ci = get_json(f"{BASE_URL}/api/papers/{pid}/citations")
print(f"Citations endpoint total_references: {ci.get('total_references')}, in_text_mentions: {ci.get('in_text_mentions')}")
assert ci.get('total_references') == 40
assert ci.get('in_text_mentions') == cm.get('in_text_mentions')

# Check Recommendations
recs = get_json(f"{BASE_URL}/api/papers/{pid}/recommendations")
rec_list = recs.get("recommendations", recs) if isinstance(recs, dict) else recs
print(f"Recommendations count: {len(rec_list)}")
for r in rec_list[:5]:
    print(f"  - {r.get('title')} | Relevance: {r.get('similarity_label', 'N/A')}")
    assert not any(bad in r.get('title', '').lower() for bad in ['affinity', 'drug', 'vue', 'redis'])

# Check Summary & Contributions
summary = full_paper.get('summary', {})
contribs = summary.get('key_findings', [])
print(f"Scientific Contributions ({len(contribs)}):")
for c in contribs:
    print(f"  * {c}")
assert len(contribs) >= 3

# Check Keywords
keywords = full_paper.get('keywords', [])
print(f"Keywords count: {len(keywords)}")
kw_names = [k.get('keyword') for k in keywords]
print(f"Keywords: {kw_names[:10]}")
assert "Transformer" in kw_names or any("Transformer" in k for k in kw_names)

print("\nALL BACKEND API VERIFICATIONS PASSED SUCCESSFULLY!")
