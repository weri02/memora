"""Tests unitarios de las funciones vanilla del servicio de indexacion."""
from types import SimpleNamespace

from app.services.indexing_service import (
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    _build_header,
    _chunk_text,
    _detect_section,
)


class TestChunkText:
    def test_short_text_returns_single_chunk(self):
        text = "Esto es un texto corto"
        chunks = _chunk_text(text)

        assert len(chunks) == 1
        assert chunks[0] == text

    def test_empty_text_returns_empty_list(self):
        chunks = _chunk_text("")

        assert chunks == []

    def test_long_text_is_split(self):
        # Texto que excede CHUNK_SIZE
        text = "palabra " * (CHUNK_SIZE // 5)
        chunks = _chunk_text(text)

        assert len(chunks) > 1

    def test_chunks_respect_max_size(self):
        text = "x" * (CHUNK_SIZE * 3)
        chunks = _chunk_text(text)

        for chunk in chunks:
            assert len(chunk) <= CHUNK_SIZE

    def test_chunks_have_overlap(self):
        # Texto suficientemente grande para garantizar overlap entre chunks
        text = " ".join([f"palabra{i}" for i in range(CHUNK_SIZE)])
        chunks = _chunk_text(text)

        # Si hay mas de un chunk, debe haber al menos un fragmento del primero
        # cerca del inicio del segundo
        if len(chunks) >= 2:
            tail_of_first = chunks[0][-CHUNK_OVERLAP:]
            head_of_second = chunks[1][:CHUNK_OVERLAP]
            assert any(w in head_of_second for w in tail_of_first.split())

    def test_chunk_break_prefers_word_boundary(self):
        # Texto con palabras de longitud uniforme
        text = "palabra " * 200
        chunks = _chunk_text(text)

        for chunk in chunks:
            stripped = chunk.strip()
            if stripped:
                assert not stripped.startswith("alabra"), "No deberia cortar 'palabra'"


class TestBuildHeader:
    def test_header_includes_filename_and_type(self):
        doc = SimpleNamespace(original_filename="test.pdf", file_type="pdf")
        header = _build_header(doc)

        assert "test.pdf" in header
        assert "PDF" in header

    def test_header_includes_section_when_provided(self):
        doc = SimpleNamespace(original_filename="test.pdf", file_type="pdf")
        header = _build_header(doc, section="Introduccion")

        assert "Introduccion" in header

    def test_header_omits_section_when_empty(self):
        doc = SimpleNamespace(original_filename="test.pdf", file_type="pdf")
        header = _build_header(doc, section="")

        assert "SECTION" not in header


class TestDetectSection:
    def test_detects_markdown_heading(self):
        text = "# Mi Heading\nContenido del parrafo"

        assert _detect_section(text) == "Mi Heading"

    def test_detects_page_marker(self):
        text = "[Page 5]\nContenido de la pagina"

        assert _detect_section(text) == "[Page 5]"

    def test_returns_empty_when_no_marker(self):
        text = "Texto sin heading ni page marker"

        assert _detect_section(text) == ""

    def test_strips_multiple_hash_markers(self):
        text = "### Subheading nivel 3\nContenido"

        assert _detect_section(text) == "Subheading nivel 3"
