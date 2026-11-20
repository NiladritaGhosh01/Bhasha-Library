"""
Bhasha Library - Database Ingestion & Data Management Adapter
Handles structured persistence to Cloud Firestore and catalog normalization.

Schema conforms strictly to firestore.rules and bookService.js:
- id: unique slug (e.g. gora-1909)
- name: manuscript title
- author: author name
- yearPublished: integer (1000 - 2100)
- decade: decade string (e.g. 1900s)
- genre: genre string
- pages: total page count
- isbn: ISBN or archival catalog number
- summary: scholarly synopsis / historical context
- coverColor, coverAccent, coverMotif: literary aesthetics
- isOfficialCanonical: bool (True for Admin Reference folios, False for community uploads)
- uploadedByRole: 'admin' | 'author' | 'reader'
- uploadedByEmail: str
- pagesData: list of { pageNumber, title, paragraphs }
"""

import re
import json
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from datetime import datetime

FIRESTORE_PROJECT_ID = "bhashalibrary-3a11a"
FIRESTORE_DATABASE = "(default)"
FIRESTORE_COLLECTION = "manuscripts_catalog"
FIRESTORE_REST_BASE = (
    f"https://firestore.googleapis.com/v1/projects/{FIRESTORE_PROJECT_ID}/"
    f"databases/{FIRESTORE_DATABASE}/documents/{FIRESTORE_COLLECTION}"
)


def slugify_title(title: str, year: int) -> str:
    """
    Creates a clean, human-readable identifier for manuscripts.
    """
    clean = re.sub(r"[^a-zA-Z0-9]+", "-", title.lower()).strip("-")
    slug = clean[:35] if clean else "manuscript"
    return f"{slug}-{year}"


def structure_manuscript(
    name: str,
    author: str,
    year_published: int,
    genre: str = "Classical Literature",
    pages_data: Optional[List[Dict[str, Any]]] = None,
    summary: str = "",
    cover_motif: str = "lotus",
    cover_color: str = "#4A1521",
    cover_accent: str = "#D4AF37",
    is_official_canonical: bool = False,
    uploaded_by_role: str = "user",
    uploaded_by_email: str = "",
    storage_url: str = "",
    custom_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Structures and validates raw book data into the canonical Bhasha Library schema.
    """
    title_str = (name or "").strip()[:200]
    author_str = (author or "").strip()[:150]
    if not title_str:
        raise ValueError("Manuscript title is required.")
    if not author_str:
        raise ValueError("Author name is required.")

    year = int(year_published) if year_published else datetime.now().year
    decade = f"{(year // 10) * 10}s"
    clean_id = custom_id or slugify_title(title_str, year)

    # Normalize pages data
    pages = pages_data or [
        {
            "pageNumber": 1,
            "title": "Folio I — Initial Inscription",
            "paragraphs": [summary or "Archival manuscript registered into Bhasha Library."]
        }
    ]
    page_count = len(pages)

    # Automatic synopsis from opening page if empty
    if not summary and pages and pages[0].get("paragraphs"):
        summary = pages[0]["paragraphs"][0][:450]

    return {
        "id": clean_id,
        "name": title_str,
        "author": author_str,
        "yearPublished": year,
        "decade": decade,
        "genre": (genre or "Classical Literature").strip()[:100],
        "pages": page_count,
        "isbn": f"978-BHA-{abs(hash(clean_id)) % 1000000:06d}",
        "clicks": 0,
        "storageUrl": storage_url[:500],
        "summary": summary[:5000],
        "coverColor": cover_color or "#4A1521",
        "coverAccent": cover_accent or "#D4AF37",
        "coverMotif": cover_motif or "lotus",
        "isOfficialCanonical": bool(is_official_canonical),
        "uploadedByRole": uploaded_by_role if uploaded_by_role in ["admin", "author", "reader"] else "user",
        "uploadedByEmail": (uploaded_by_email or "").strip(),
        "pagesData": pages,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "updatedAt": datetime.utcnow().isoformat() + "Z"
    }


def to_firestore_value(val: Any) -> Dict[str, Any]:
    """
    Converts a Python primitive into Firestore REST API typed values.
    """
    if val is None:
        return {"nullValue": None}
    elif isinstance(val, bool):
        return {"booleanValue": val}
    elif isinstance(val, int):
        return {"integerValue": str(val)}
    elif isinstance(val, float):
        return {"doubleValue": val}
    elif isinstance(val, str):
        return {"stringValue": val}
    elif isinstance(val, list):
        return {
            "arrayValue": {
                "values": [to_firestore_value(item) for item in val]
            }
        }
    elif isinstance(val, dict):
        return {
            "mapValue": {
                "fields": {k: to_firestore_value(v) for k, v in val.items()}
            }
        }
    return {"stringValue": str(val)}


def save_to_firestore(manuscript: Dict[str, Any], auth_token: Optional[str] = None) -> Dict[str, Any]:
    """
    Directly writes the structured manuscript to Cloud Firestore via REST API.
    Works with both authenticated user bearer tokens or open dev rules.
    """
    doc_id = manuscript["id"]
    endpoint = f"{FIRESTORE_REST_BASE}/{doc_id}"

    firestore_fields = {k: to_firestore_value(v) for k, v in manuscript.items()}
    payload = json.dumps({"fields": firestore_fields}).encode("utf-8")

    req = urllib.request.Request(
        f"{endpoint}?updateMask.fieldPaths=" + "&updateMask.fieldPaths=".join(manuscript.keys()),
        data=payload,
        method="PATCH",
        headers={"Content-Type": "application/json"}
    )

    if auth_token:
        req.add_header("Authorization", f"Bearer {auth_token}")

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return {
                "success": True,
                "remoteDoc": data.get("name"),
                "status": "Inscribed to Cloud Firestore"
            }
    except urllib.error.HTTPError as err:
        err_msg = err.read().decode("utf-8", errors="replace")
        return {
            "success": False,
            "status": f"Cloud Firestore Notice: HTTP {err.code}",
            "detail": err_msg
        }
    except Exception as exc:
        return {
            "success": False,
            "status": "Cloud Firestore Offline",
            "detail": str(exc)
        }
