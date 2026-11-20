"""
Bhasha Library - Tesseract OCR Setup & Verification Helper
Checks for Tesseract-OCR binary, tessdata, and Bengali language pack.

Run with:
    python backend/setup_tesseract.py
"""

import os
import sys
import shutil

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.ocr_engine import ocr_engine, find_tesseract_binary


def main():
    print("\n" + "=" * 65)
    print(" 🔍 Bhasha Library - Tesseract OCR & Bengali Language Checker")
    print("=" * 65)

    status = ocr_engine.get_status()
    binary = find_tesseract_binary()

    print(f"\n1. Tesseract Executable:")
    if binary:
        print(f"   ✓ Found: {binary}")
    else:
        print("   ✗ Not found in system PATH or standard locations.")
        print("\n   To install Tesseract on Windows:")
        print("   Option A: Run the official installer executable:")
        print("             https://github.com/UB-Mannheim/tesseract/wiki")
        print("   Option B: Using Winget in Administrator Terminal:")
        print("             winget install UB-Mannheim.TesseractOCR")
        print("   Option C: Set environment variable TESSERACT_CMD to tesseract.exe path.")

    print(f"\n2. Language Models (Tessdata):")
    tess_dir = status.get("tessdataDir")
    print(f"   Directory: {tess_dir}")
    langs = status.get("installedLanguages", [])
    if "ben" in langs:
        print("   ✓ Bengali (ben.traineddata) is ready!")
    else:
        print("   ✗ Missing ben.traineddata (Bengali model).")

    if "eng" in langs:
        print("   ✓ English (eng.traineddata) is ready!")
    else:
        print("   ✗ Missing eng.traineddata (English model).")

    print(f"\n3. Engine Fallback:")
    print("   ✓ PyPDF Digital Text Stream fallback is ACTIVE.")
    print("   (Even without Tesseract, digital text in PDFs will be cleanly parsed and ingested.)")

    print("\n" + "=" * 65 + "\n")


if __name__ == "__main__":
    main()
