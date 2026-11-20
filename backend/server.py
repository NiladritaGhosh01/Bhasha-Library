"""
Bhasha Library - Lightweight OCR & Archival Backend Server
FastAPI Service supporting Bengali & English OCR for Manuscripts

Run with:
    python -m backend.server
or:
    python backend/run_server.py
"""

import os
import io
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.ocr_engine import ocr_engine
from backend.db_manager import structure_manuscript, save_to_firestore

app = FastAPI(
    title="Bhasha Library OCR & Manuscript Backend",
    description="Lightweight Bengali & English OCR pipeline for manuscript folios & reference books",
    version="1.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCREENSHOTS_DIR = ocr_engine.screenshots_dir


@app.get("/health")
@app.get("/api/status")
def get_health():
    """
    Returns engine configuration, Tesseract availability, and loaded languages.
    """
    return {
        "status": "online",
        "service": "Bhasha Library OCR Backend",
        "ocrEngine": ocr_engine.get_status()
    }


@app.post("/api/ocr/extract-only")
async def extract_only(
    file: UploadFile = File(...),
    languages: str = Form("ben+eng"),
    max_pages: int = Form(50)
):
    """
    Takes an uploaded PDF or image, renders page screenshots, and performs OCR.
    Returns extracted pages & preview text for user inspection without saving to DB.
    """
    try:
        file_bytes = await file.read()
        result = ocr_engine.process_document(
            file_bytes=file_bytes,
            filename=file.filename or "uploaded_manuscript.pdf",
            languages=languages,
            max_pages=max_pages
        )
        return {
            "success": True,
            "filename": file.filename,
            "result": result
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/ocr/process-pdf")
@app.post("/api/ocr/upload-and-inscribe")
async def process_and_inscribe(
    file: UploadFile = File(...),
    name: str = Form(...),
    author: str = Form(...),
    yearPublished: int = Form(1920),
    genre: str = Form("Classical Literature"),
    summary: str = Form(""),
    coverMotif: str = Form("lotus"),
    coverColor: str = Form("#4A1521"),
    coverAccent: str = Form("#D4AF37"),
    isOfficialCanonical: bool = Form(False),
    uploadedByRole: str = Form("author"),
    uploadedByEmail: str = Form(""),
    languages: str = Form("ben+eng"),
    maxPages: int = Form(50),
    writeToDatabase: bool = Form(True)
):
    """
    End-to-End Pipeline:
    1. Ingests PDF or manuscript file.
    2. Renders high-resolution page screenshots.
    3. Runs Bengali + English Tesseract OCR.
    4. Formats carefully into pagesData paragraphs.
    5. Feeds structured book to main database (Cloud Firestore / in-memory).
    """
    try:
        file_bytes = await file.read()
        extraction = ocr_engine.process_document(
            file_bytes=file_bytes,
            filename=file.filename or "manuscript.pdf",
            languages=languages,
            max_pages=maxPages
        )

        # Structure into canonical Bhasha Library schema
        book = structure_manuscript(
            name=name,
            author=author,
            year_published=yearPublished,
            genre=genre,
            pages_data=extraction["pagesData"],
            summary=summary or extraction.get("previewSnippet", ""),
            cover_motif=coverMotif,
            cover_color=coverColor,
            cover_accent=coverAccent,
            is_official_canonical=isOfficialCanonical,
            uploaded_by_role=uploadedByRole,
            uploaded_by_email=uploadedByEmail
        )

        db_result = {"status": "Prepared for client sync"}
        if writeToDatabase:
            # Sync to Cloud Firestore
            db_result = save_to_firestore(book)

        return {
            "success": True,
            "message": "Manuscript extracted, structured, and prepared for library admission.",
            "book": book,
            "extraction": {
                "totalPages": extraction["totalPages"],
                "totalCharacters": extraction["totalCharacters"],
                "extractionMethod": extraction["extractionMethod"],
                "warnings": extraction["warnings"]
            },
            "databaseSync": db_result
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/ocr/screenshot/{image_name}")
def get_screenshot(image_name: str):
    """
    Serves a rendered page screenshot for UI inspection.
    """
    # Sanitize path
    clean_name = os.path.basename(image_name)
    file_path = os.path.join(SCREENSHOTS_DIR, clean_name)
    if os.path.isfile(file_path):
        return FileResponse(file_path, media_type="image/png")
    raise HTTPException(status_code=404, detail="Screenshot not found.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.server:app", host="127.0.0.1", port=8000, reload=True)
