import os
import json
from agents.ingestion_agent import DocumentIngestionAgent
from agents.summarization_agent import SummarizationAgent
from agents.keyword_agent import KeywordExtractionAgent
from agents.citation_agent import CitationAnalysisAgent
from agents.dashboard_agent import DashboardAgent

pdf_path = "uploads/22CS504_PT1_Student_Question_Bank.pdf"
with open(pdf_path, "rb") as f:
    file_bytes = f.read()

ingest = DocumentIngestionAgent("uploads")
ingest_res = ingest.process("22CS504_PT1_Student_Question_Bank.pdf", file_bytes)

print("=== INGESTION ===")
print("Title:", ingest_res["metadata"]["title"])
print("Abstract:", ingest_res["metadata"]["abstract"][:200])
print("Sections found:", list(ingest_res["sections"].keys()))

kw_agent = KeywordExtractionAgent()
kw_res = kw_agent.extract(ingest_res["full_text"], ingest_res["metadata"]["title"], ingest_res["metadata"]["abstract"])
print("\n=== KEYWORDS ===")
print("Keywords:", [k["keyword"] for k in kw_res[:10]])

cite_agent = CitationAnalysisAgent()
cite_res = cite_agent.analyze(ingest_res["full_text"], ingest_res["sections"], ingest_res["document"]["page_count"])
print("\n=== CITATIONS ===")
print("References count:", len(cite_res["references"]))
print("Metrics:", cite_res["metrics"])
if cite_res["references"]:
    print("First 3 refs:", [r["title"] for r in cite_res["references"][:3]])

dash_agent = DashboardAgent()
dash_res = dash_agent.synthesize(
    ingest_res["document"],
    ingest_res["metadata"],
    {},
    kw_res,
    cite_res,
    [],
    1.0
)
print("\n=== DASHBOARD RIGOR ===")
print("Health Score:", dash_res.get("academic_health_score"))
print("Rigor Score:", dash_res.get("rigor_score"))
