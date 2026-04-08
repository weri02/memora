from pathlib import Path

from PyPDF2 import PdfReader
from docx import Document


def extract_text(file_path: str, file_type: str) -> str:
    path = Path(file_path)

    if file_type == "pdf":
        return _extract_pdf(path)
    elif file_type == "docx":
        return _extract_docx(path)
    elif file_type == "txt":
        return _extract_txt(path)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def _extract_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    parts = []
    for i, page in enumerate(reader.pages, 1):
        text = page.extract_text()
        if text and text.strip():
            parts.append(f"[Page {i}]\n{text.strip()}")
    return "\n\n".join(parts)


def _extract_docx(path: Path) -> str:
    doc = Document(str(path))
    parts = []
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        if para.style and para.style.name.startswith("Heading"):
            level = para.style.name.replace("Heading ", "").replace("Heading", "1")
            try:
                prefix = "#" * int(level)
            except ValueError:
                prefix = "#"
            parts.append(f"{prefix} {text}")
        else:
            parts.append(text)
    return "\n\n".join(parts)


def _extract_txt(path: Path) -> str:
    return path.read_text(encoding="utf-8")
