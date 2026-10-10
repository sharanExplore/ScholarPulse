import os
import sys
import unittest

sys.stdout.reconfigure(encoding='utf-8')

from agents.ingestion_agent import DocumentIngestionAgent
from agents.keyword_agent import KeywordExtractionAgent


class TestDocumentExtractionPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
        attention_candidates = [f for f in os.listdir(cls.upload_dir) if 'scholarpulse_example_input.pdf' in f or 'Attention_Is_All_You_Need.pdf' in f]
        cls.attention_pdf = os.path.join(cls.upload_dir, attention_candidates[0]) if attention_candidates else ""
        cls.qb_pdf = os.path.join(cls.upload_dir, "22CS504_PT1_Student_Question_Bank.pdf")
        cls.ingest_agent = DocumentIngestionAgent(cls.upload_dir)
        cls.kw_agent = KeywordExtractionAgent()

    def test_attention_paper_authors(self):
        with open(self.attention_pdf, "rb") as f:
            file_bytes = f.read()

        res = self.ingest_agent.process("scholarpulse_example_input.pdf", file_bytes)
        authors = res["metadata"]["authors"]
        print(f"\n[TEST] Extracted authors: {authors}")

        expected_authors = [
            "Ashish Vaswani",
            "Noam Shazeer",
            "Niki Parmar",
            "Jakob Uszkoreit",
            "Llion Jones",
            "Aidan N. Gomez",
            "Lukasz Kaiser",
            "Illia Polosukhin"
        ]

        # Verify all 8 authors extracted
        self.assertGreaterEqual(len(authors), 8, "Expected all 8 authors to be extracted")
        for ea in expected_authors:
            self.assertTrue(
                any(ea.lower() in a.lower() for a in authors),
                f"Expected author '{ea}' to be in extracted authors: {authors}"
            )

    def test_attention_paper_abstract_and_footnotes(self):
        with open(self.attention_pdf, "rb") as f:
            file_bytes = f.read()

        res = self.ingest_agent.process("scholarpulse_example_input.pdf", file_bytes)
        abstract = res["metadata"]["abstract"]
        print(f"\n[TEST] Extracted abstract: {abstract[:150]}...")

        # 1. Verify actual abstract content is present
        self.assertIn("dominant sequence transduction models", abstract)
        self.assertIn("Transformer", abstract)
        self.assertIn("BLEU", abstract)

        # 2. Exclude author contribution footnotes
        self.assertNotIn("Equal contribution", abstract)
        self.assertNotIn("Listing order is random", abstract)
        self.assertNotIn("Jakob proposed replacing", abstract)
        self.assertNotIn("tensor2tensor", abstract)
        self.assertNotIn("Conference on Neural Information", abstract)
        self.assertNotIn("arXiv:1706.03762", abstract)

    def test_attention_paper_keywords_no_noise(self):
        with open(self.attention_pdf, "rb") as f:
            file_bytes = f.read()

        res = self.ingest_agent.process("scholarpulse_example_input.pdf", file_bytes)
        kw_res = self.kw_agent.extract_keywords(
            full_text=res["full_text"],
            title=res["metadata"]["title"],
            abstract=res["metadata"]["abstract"]
        )
        keywords = [k["keyword"] for k in kw_res]
        print(f"\n[TEST] Extracted keywords: {keywords}")

        # Check that noisy fragments are strictly excluded
        forbidden_fragments = [
            "Pad Pad Pad",
            "Law Will Never",
            "Will Never Perfect",
            "Opinion Eos Pad",
            "Arxiv Preprint Arxiv",
            "Computed Properties",
            "Eos Pad",
            "Pad Pad"
        ]
        for frag in forbidden_fragments:
            self.assertNotIn(frag, keywords, f"Forbidden fragment '{frag}' was found in keywords")

        # Check that meaningful academic concepts are extracted
        keyword_str = " ".join(keywords).lower()
        self.assertIn("attention", keyword_str)
        self.assertIn("transformer", keyword_str)
        self.assertTrue("self-attention" in keyword_str or "self attention" in keyword_str)
        self.assertTrue("encoder" in keyword_str or "decoder" in keyword_str)

    def test_question_bank_document(self):
        with open(self.qb_pdf, "rb") as f:
            file_bytes = f.read()

        res = self.ingest_agent.process("22CS504_PT1_Student_Question_Bank.pdf", file_bytes)
        self.assertEqual(res["document_type"], "Academic Question Bank")
        self.assertEqual(res["metadata"]["authors"], ["Academic Faculty / Course Instructors"])

        kw_res = self.kw_agent.extract(
            res["full_text"],
            res["metadata"]["title"],
            res["metadata"]["abstract"]
        )
        kw_names = [k["keyword"] for k in kw_res]
        self.assertIn("Vue.js", kw_names)
        self.assertIn("ExpressJS", kw_names)
        self.assertIn("Redis", kw_names)


if __name__ == "__main__":
    unittest.main()
