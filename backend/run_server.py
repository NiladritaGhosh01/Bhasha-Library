"""
Simple launcher for Bhasha Library Python OCR Backend
Usage:
    python backend/run_server.py
"""

import sys
import os

# Ensure project root is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 60)
    print(" 📜 Bhasha Library - Lightweight OCR & Archival Server")
    print("=" * 60)
    print(" Running at: http://127.0.0.1:8000")
    print(" Health check: http://127.0.0.1:8000/health")
    print(" Bengali & English OCR Ready")
    print("=" * 60 + "\n")
    uvicorn.run("backend.server:app", host="127.0.0.1", port=8000, reload=False)
