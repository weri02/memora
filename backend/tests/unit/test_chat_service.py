"""Tests unitarios de las funciones vanilla del servicio de chat."""
from app.services.chat_service import _build_context, _build_sources


class TestBuildContext:
    def test_empty_chunks_returns_explanation(self):
        result = _build_context([])

        assert "NO significa que no haya documentos" in result
        assert "documentos disponibles" in result

    def test_single_chunk_includes_source_label(self):
        chunks = [
            {
                "content": "Texto del fragmento",
                "metadata": {"document_name": "doc1.pdf"},
            }
        ]

        result = _build_context(chunks)

        assert "[Source 1: doc1.pdf]" in result
        assert "Texto del fragmento" in result

    def test_multiple_chunks_separated_by_delimiter(self):
        chunks = [
            {"content": "Chunk uno", "metadata": {"document_name": "a.pdf"}},
            {"content": "Chunk dos", "metadata": {"document_name": "b.pdf"}},
        ]

        result = _build_context(chunks)

        assert "[Source 1: a.pdf]" in result
        assert "[Source 2: b.pdf]" in result
        assert "---" in result

    def test_chunk_without_metadata_uses_unknown(self):
        chunks = [{"content": "Texto", "metadata": {}}]

        result = _build_context(chunks)

        assert "Unknown" in result


class TestBuildSources:
    def test_empty_chunks_returns_empty_list(self):
        result = _build_sources([])

        assert result == []

    def test_groups_chunks_by_document(self):
        chunks = [
            {
                "chunk_id": 1,
                "content": "Frag 1 doc A",
                "metadata": {"document_name": "a.pdf"},
                "score": 0.9,
                "rrf_score": 0.95,
                "rerank_score": 0.85,
            },
            {
                "chunk_id": 2,
                "content": "Frag 2 doc A",
                "metadata": {"document_name": "a.pdf"},
                "score": 0.7,
                "rrf_score": 0.8,
                "rerank_score": 0.75,
            },
            {
                "chunk_id": 3,
                "content": "Frag 1 doc B",
                "metadata": {"document_name": "b.pdf"},
                "score": 0.6,
                "rrf_score": 0.7,
                "rerank_score": 0.65,
            },
        ]

        result = _build_sources(chunks)

        # Dos documentos distintos -> dos entradas agrupadas
        assert len(result) == 2

        # Encontrar la entrada de a.pdf (deberia ser primero por mejor score)
        doc_a = next(r for r in result if r["document_name"] == "a.pdf")
        doc_b = next(r for r in result if r["document_name"] == "b.pdf")

        assert len(doc_a["excerpts"]) == 2
        assert len(doc_b["excerpts"]) == 1

    def test_sources_sorted_by_best_score_desc(self):
        chunks = [
            {
                "chunk_id": 1,
                "content": "low",
                "metadata": {"document_name": "low.pdf"},
                "score": 0.3,
                "rerank_score": 0.2,
            },
            {
                "chunk_id": 2,
                "content": "high",
                "metadata": {"document_name": "high.pdf"},
                "score": 0.9,
                "rerank_score": 0.95,
            },
        ]

        result = _build_sources(chunks)

        assert result[0]["document_name"] == "high.pdf"
        assert result[1]["document_name"] == "low.pdf"

    def test_excerpt_preview_truncates_at_400_chars(self):
        long_text = "a" * 1000
        chunks = [
            {
                "chunk_id": 1,
                "content": long_text,
                "metadata": {"document_name": "big.pdf"},
                "score": 0.5,
            }
        ]

        result = _build_sources(chunks)

        assert len(result[0]["excerpts"][0]["preview"]) == 400

    def test_excerpt_includes_chunk_id_and_scores(self):
        chunks = [
            {
                "chunk_id": 42,
                "content": "fragmento",
                "metadata": {"document_name": "doc.pdf"},
                "score": 0.5,
                "rrf_score": 0.6,
                "rerank_score": 0.7,
            }
        ]

        result = _build_sources(chunks)
        excerpt = result[0]["excerpts"][0]

        assert excerpt["chunk_id"] == 42
        assert excerpt["score"] is not None
        assert excerpt["rerank_score"] == 0.7
