"""
Bhasha Library - Admin & Author CLI Ingestion Tool
Direct terminal command for OCR processing and library admission.

Usage:
    # Admin reference book upload:
    python backend/cli_upload.py --file my_book.pdf --title "Gora" --author "Rabindranath Tagore" --year 1909 --genre "Philosophical Novel" --admin

    # Regular user/author upload:
    python backend/cli_upload.py --file manuscript.pdf --title "My Poem" --author "Pen Name" --year 2026 --genre "Modern Poetry"
"""

import sys
import os
import argparse
import json

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.ocr_engine import ocr_engine
from backend.db_manager import structure_manuscript, save_to_firestore


def main():
    parser = argparse.ArgumentParser(description="Bhasha Library - Inscribe Manuscript with OCR")
    parser.add_argument("--file", "-f", required=True, help="Path to PDF, image (PNG/JPG), or TXT file")
    parser.add_argument("--title", "-t", required=True, help="Manuscript Title")
    parser.add_argument("--author", "-a", required=True, help="Author / Scribe Name")
    parser.add_argument("--year", "-y", type=int, default=1920, help="Year of publication")
    parser.add_argument("--genre", "-g", default="Classical Literature", help="Literary Genre")
    parser.add_argument("--summary", "-s", default="", help="Archival synopsis")
    parser.add_argument("--admin", action="store_true", help="Flag as Admin Reference Folio for visitors")
    parser.add_argument("--email", default="admin@bhashalibrary.org", help="Uploader account email")
    parser.add_argument("--lang", default="ben+eng", help="OCR Languages (default: ben+eng)")
    parser.add_argument("--save-json", default="", help="Optional path to save structured JSON output")

    args = parser.parse_args()

    if not os.path.isfile(args.file):
        print(f"Error: File not found: {args.file}")
        sys.exit(1)

    print(f"\n[1/4] Reading '{args.file}'...")
    with open(args.file, "rb") as f:
        file_bytes = f.read()

    filename = os.path.basename(args.file)
    print(f"[2/4] Rendering page screenshots & performing OCR ({args.lang})...")
    extraction = ocr_engine.process_document(
        file_bytes=file_bytes,
        filename=filename,
        languages=args.lang
    )

    print(f"      Extracted {extraction['totalPages']} folios, {extraction['totalCharacters']} characters.")
    print(f"      Extraction method: {extraction['extractionMethod']}")
    if extraction["warnings"]:
        for w in extraction["warnings"]:
            print(f"      Notice: {w}")

    print("[3/4] Structuring data into canonical Bhasha Library format...")
    role = "admin" if args.admin else "author"
    book = structure_manuscript(
        name=args.title,
        author=args.author,
        year_published=args.year,
        genre=args.genre,
        pages_data=extraction["pagesData"],
        summary=args.summary or extraction.get("previewSnippet", ""),
        is_official_canonical=args.admin,
        uploaded_by_role=role,
        uploaded_by_email=args.email
    )

    print(f"      Folio ID: {book['id']}")
    print(f"      Archival Status: {'★ Admin Reference Folio' if book['isOfficialCanonical'] else 'Community Manuscript'}")

    print("[4/4] Writing to library vault (Cloud Firestore)...")
    db_res = save_to_firestore(book)
    print(f"      Database status: {db_res.get('status')}")

    if args.save_json:
        with open(args.save_json, "w", encoding="utf-8") as jf:
            json.dump(book, jf, indent=2, ensure_ascii=False)
        print(f"      Structured JSON saved to: {args.save_json}")

    print("\n✓ Inscription complete! The manuscript is ready for reading in Bhasha Library.\n")


if __name__ == "__main__":
    main()
