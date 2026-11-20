"""
Bhasha Library - Lightweight Bengali & English OCR Engine
Powered by Tesseract OCR & PyPDFium2

Features:
- Renders high-resolution page screenshots from uploaded PDFs (PNG/JPG).
- Bilingual OCR recognition supporting both Bengali (বাংলা) and English scripts.
- Structured folio & paragraph parsing for database ingestion.
- Intelligent fallback to digital stream parsing (pypdf) if Tesseract executable is not yet present on host.
"""

import os
import io
import shutil
import tempfile
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image, ImageEnhance, ImageOps

# PDF rendering & digital extraction libraries
import pypdfium2 as pdfium
import pypdf
import pytesseract

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
LOCAL_TESSDATA = os.path.join(CURRENT_DIR, "tessdata")


def find_tesseract_binary() -> Optional[str]:
    """
    Locates the Tesseract OCR executable on the system across standard paths.
    """
    # 1. User-defined environment variable
    env_cmd = os.environ.get("TESSERACT_CMD")
    if env_cmd and os.path.isfile(env_cmd):
        return env_cmd

    # 2. System PATH
    which_cmd = shutil.which("tesseract")
    if which_cmd and os.path.isfile(which_cmd):
        return which_cmd

    # 3. Standard Windows installation paths
    candidate_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
        os.path.join(CURRENT_DIR, "tesseract", "tesseract.exe"),
    ]

    for path in candidate_paths:
        if os.path.isfile(path):
            return path

    return None


def configure_tesseract() -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Configures pytesseract with the binary and tessdata path.
    Returns: (is_available, binary_path, tessdata_dir)
    """
    binary_path = find_tesseract_binary()
    if binary_path:
        pytesseract.pytesseract.tesseract_cmd = binary_path

    # Determine tessdata path
    tessdata_dir = None
    if os.path.isdir(LOCAL_TESSDATA) and (
        os.path.isfile(os.path.join(LOCAL_TESSDATA, "ben.traineddata")) or
        os.path.isfile(os.path.join(LOCAL_TESSDATA, "eng.traineddata"))
    ):
        tessdata_dir = LOCAL_TESSDATA
    elif binary_path:
        binary_tessdata = os.path.join(os.path.dirname(binary_path), "tessdata")
        if os.path.isdir(binary_tessdata):
            tessdata_dir = binary_tessdata

    if tessdata_dir:
        os.environ["TESSDATA_PREFIX"] = tessdata_dir

    is_available = bool(binary_path and os.path.isfile(binary_path))
    return is_available, binary_path, tessdata_dir


def preprocess_image_for_ocr(image: Image.Image) -> Image.Image:
    """
    Enhances Bengali and Latin script readability:
    - Converts to grayscale
    - Autocontrast & slight sharpness boost to preserve Bengali vowel diacritics (matras)
    """
    if image.mode != "RGB":
        image = image.convert("RGB")
    
    gray = image.convert("L")
    enhanced = ImageOps.autocontrast(gray, cutoff=2)
    enhancer = ImageEnhance.Sharpness(enhanced)
    return enhancer.enhance(1.5)


def clean_and_split_paragraphs(raw_text: str) -> List[str]:
    """
    Cleans OCR raw output and splits into coherent literary paragraphs.
    Handles irregular line wraps from columnized scanned pages.
    """
    if not raw_text:
        return []

    lines = [line.strip() for line in raw_text.splitlines()]
    paragraphs: List[str] = []
    current_para: List[str] = []

    for line in lines:
        if not line:
            if current_para:
                para_str = " ".join(current_para).strip()
                if len(para_str) > 10:
                    paragraphs.append(para_str)
                current_para = []
        else:
            # Ignore standalone scanner noise like solitary punctuation or page numbers
            if len(line) <= 2 and not line.isalnum():
                continue
            current_para.append(line)

    if current_para:
        para_str = " ".join(current_para).strip()
        if len(para_str) > 10:
            paragraphs.append(para_str)

    return paragraphs


class OCREngine:
    def __init__(self):
        self.is_available, self.binary_path, self.tessdata_dir = configure_tesseract()
        self.screenshots_dir = os.path.join(CURRENT_DIR, "page_screenshots")
        os.makedirs(self.screenshots_dir, exist_ok=True)

    def get_status(self) -> Dict[str, Any]:
        """
        Returns real-time engine health and configuration status.
        """
        # Re-check in case user just installed tesseract
        self.is_available, self.binary_path, self.tessdata_dir = configure_tesseract()
        languages_available = []
        if self.tessdata_dir and os.path.isdir(self.tessdata_dir):
            for fname in os.listdir(self.tessdata_dir):
                if fname.endswith(".traineddata"):
                    languages_available.append(fname.replace(".traineddata", ""))

        return {
            "tesseractInstalled": self.is_available,
            "binaryPath": self.binary_path,
            "tessdataDir": self.tessdata_dir,
            "supportedLanguages": ["ben", "eng"],
            "installedLanguages": languages_available,
            "defaultLanguage": "ben+eng",
            "fallbackAvailable": True
        }

    def render_pdf_screenshots(
        self, 
        pdf_bytes: bytes, 
        dpi: int = 200, 
        max_pages: Optional[int] = None,
        save_to_disk: bool = True,
        prefix: str = "page"
    ) -> List[Tuple[int, Image.Image, Optional[str]]]:
        """
        Takes raw PDF bytes and renders high-resolution page screenshots.
        Returns: List of (page_index, PIL_Image, saved_file_path_or_none)
        """
        pdf_doc = pdfium.PdfDocument(pdf_bytes)
        total = len(pdf_doc)
        limit = min(total, max_pages) if max_pages else total

        results = []
        # Calculate scale factor for target DPI (72 DPI is 1.0)
        scale = max(1.0, dpi / 72.0)

        for i in range(limit):
            page = pdf_doc.get_page(i)
            # Render page to bitmap and convert to PIL Image
            bitmap = page.render(scale=scale)
            pil_image = bitmap.to_pil()

            screenshot_path = None
            if save_to_disk:
                filename = f"{prefix}_{i + 1}.png"
                screenshot_path = os.path.join(self.screenshots_dir, filename)
                pil_image.save(screenshot_path, "PNG")

            results.append((i + 1, pil_image, screenshot_path))

        return results

    def ocr_image(
        self, 
        image: Image.Image, 
        languages: str = "ben+eng"
    ) -> str:
        """
        Runs Tesseract OCR on a PIL Image with Bengali & English recognition.
        """
        if not self.is_available:
            raise RuntimeError(
                "Tesseract OCR binary not found on host. "
                "Please install Tesseract-OCR with Bengali language data."
            )

        processed = preprocess_image_for_ocr(image)

        # Build tesseract configuration
        config_parts = ["--psm 3"]
        if self.tessdata_dir:
            config_parts.append(f'--tessdata-dir "{self.tessdata_dir}"')

        config_str = " ".join(config_parts)

        # Check if requested languages are installed, fallback to available
        status = self.get_status()
        installed = status.get("installedLanguages", [])
        active_langs = []
        for lang in languages.split("+"):
            if lang in installed or not installed:
                active_langs.append(lang)

        final_lang = "+".join(active_langs) if active_langs else "eng"

        try:
            raw_text = pytesseract.image_to_string(
                processed, 
                lang=final_lang, 
                config=config_str
            )
            return raw_text.strip()
        except pytesseract.TesseractError as e:
            # If bilingual fails (e.g., missing specific font pack), try English only
            if "ben" in final_lang:
                try:
                    return pytesseract.image_to_string(
                        processed, 
                        lang="eng", 
                        config=config_str
                    ).strip()
                except Exception:
                    pass
            raise e

    def extract_digital_pdf_text(self, pdf_bytes: bytes) -> List[Tuple[int, str]]:
        """
        Fallback parser extracting embedded digital text stream directly from PDF.
        """
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        results = []
        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            results.append((idx + 1, text.strip()))
        return results

    def process_document(
        self, 
        file_bytes: bytes, 
        filename: str, 
        languages: str = "ben+eng",
        max_pages: Optional[int] = 50,
        dpi: int = 200
    ) -> Dict[str, Any]:
        """
        Full end-to-end extraction pipeline:
        1. If PDF: captures screenshots for each page, performs OCR (or falls back to digital text).
        2. If image: runs OCR directly.
        3. If plain text: parses directly.
        4. Cleans and structures folios & paragraphs for main database.
        """
        lower_name = filename.lower()
        pages_data: List[Dict[str, Any]] = []
        method_used = "tesseract_ocr"
        warnings: List[str] = []

        # ----------------- PDF Document -----------------
        if lower_name.endswith(".pdf"):
            # Step 1: Render high-resolution page screenshots
            screenshots = self.render_pdf_screenshots(
                file_bytes, 
                dpi=dpi, 
                max_pages=max_pages, 
                save_to_disk=True,
                prefix=f"doc_{abs(hash(filename)) % 10000}"
            )

            # Step 2: OCR each screenshot (or fallback)
            if self.is_available:
                for page_num, img, shot_path in screenshots:
                    try:
                        page_text = self.ocr_image(img, languages=languages)
                        paragraphs = clean_and_split_paragraphs(page_text)
                    except Exception as ocr_err:
                        warnings.append(f"Page {page_num} OCR notice: {str(ocr_err)}")
                        paragraphs = []

                    pages_data.append({
                        "pageNumber": page_num,
                        "title": f"Folio {page_num}",
                        "paragraphs": paragraphs if paragraphs else [
                            f"[Archival Folio {page_num}: Visual manuscript plate captured.]"
                        ],
                        "screenshotPath": shot_path,
                        "charCount": sum(len(p) for p in paragraphs)
                    })
            else:
                # Intelligent Fallback: Digital text stream extraction
                method_used = "pypdf_digital_stream"
                warnings.append(
                    "Tesseract binary not detected in PATH; extracted embedded digital text stream via PyPDF. "
                    "To enable full visual OCR on scanned manuscripts, ensure Tesseract-OCR is installed."
                )
                digital_pages = self.extract_digital_pdf_text(file_bytes)
                for page_num, text in digital_pages[:max_pages]:
                    paragraphs = clean_and_split_paragraphs(text)
                    shot_path = screenshots[page_num - 1][2] if page_num - 1 < len(screenshots) else None
                    pages_data.append({
                        "pageNumber": page_num,
                        "title": f"Folio {page_num}",
                        "paragraphs": paragraphs if paragraphs else [
                            f"[Folio {page_num}: Archival text stream entered.]"
                        ],
                        "screenshotPath": shot_path,
                        "charCount": sum(len(p) for p in paragraphs)
                    })

        # ----------------- Image File (PNG, JPG, JPEG, WEBP) -----------------
        elif any(lower_name.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"]):
            img = Image.open(io.BytesIO(file_bytes))
            if self.is_available:
                text = self.ocr_image(img, languages=languages)
                paragraphs = clean_and_split_paragraphs(text)
            else:
                method_used = "none"
                paragraphs = ["[Scanned folio image registered into the sanctuary archives.]"]
                warnings.append("Tesseract OCR is required to extract text from standalone scanned image files.")

            pages_data.append({
                "pageNumber": 1,
                "title": "Folio I — Inscribed Scan",
                "paragraphs": paragraphs,
                "screenshotPath": None,
                "charCount": sum(len(p) for p in paragraphs)
            })

        # ----------------- Plain Text / Markdown -----------------
        elif any(lower_name.endswith(ext) for ext in [".txt", ".md"]):
            method_used = "text_file"
            try:
                content = file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                content = file_bytes.decode("latin-1", errors="replace")

            raw_paras = clean_and_split_paragraphs(content)
            # Break large text into ~300-word folios for clean pagination
            folios: List[List[str]] = []
            chunk: List[str] = []
            word_count = 0

            for p in raw_paras:
                p_words = len(p.split())
                chunk.append(p)
                word_count += p_words
                if word_count >= 250:
                    folios.append(chunk)
                    chunk = []
                    word_count = 0

            if chunk or not folios:
                folios.append(chunk if chunk else ["[Empty manuscript folio.]"])

            for idx, folio_paras in enumerate(folios):
                pages_data.append({
                    "pageNumber": idx + 1,
                    "title": f"Folio {idx + 1}",
                    "paragraphs": folio_paras,
                    "screenshotPath": None,
                    "charCount": sum(len(p) for p in folio_paras)
                })

        else:
            raise ValueError(f"Unsupported file format: {filename}. Supported formats: PDF, PNG, JPG, JPEG, TXT.")

        total_pages = len(pages_data)
        total_chars = sum(p["charCount"] for p in pages_data)

        # Generate summary preview from opening paragraphs
        opening_sample = ""
        for p in pages_data:
            if p["paragraphs"]:
                opening_sample = p["paragraphs"][0]
                break

        return {
            "filename": filename,
            "totalPages": total_pages,
            "totalCharacters": total_chars,
            "extractionMethod": method_used,
            "languagesUsed": languages,
            "pagesData": pages_data,
            "previewSnippet": opening_sample[:300],
            "warnings": warnings
        }


# Singleton engine instance
ocr_engine = OCREngine()
