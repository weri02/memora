"""Tests unitarios de las funciones vanilla de busqueda (BM25 y RRF)."""
from app.services.vector_search_service import _bm25_rerank, _rrf_fusion


class TestBM25Rerank:
    def test_empty_chunks_returns_empty(self):
        result = _bm25_rerank("query", [])

        assert result == []

    def test_assigns_bm25_score_to_each_chunk(self):
        chunks = [
            {"chunk_id": 1, "content": "perro gato", "score": 0.5},
            {"chunk_id": 2, "content": "casa coche", "score": 0.5},
            {"chunk_id": 3, "content": "perro perro", "score": 0.5},
        ]

        result = _bm25_rerank("perro", chunks)

        for chunk in result:
            assert "bm25_score" in chunk

    def test_chunks_with_query_keyword_score_higher(self):
        chunks = [
            {"chunk_id": 1, "content": "el perro corre rapido", "score": 0.5},
            {"chunk_id": 2, "content": "casa con jardin grande", "score": 0.5},
            {"chunk_id": 3, "content": "perro perro perro", "score": 0.5},
        ]

        result = _bm25_rerank("perro", chunks)

        # El chunk 3 tiene "perro" 3 veces, deberia tener el score mas alto
        scores = {c["chunk_id"]: c["bm25_score"] for c in result}
        assert scores[3] > scores[1]
        assert scores[1] > scores[2] or scores[1] >= scores[2]


class TestRRFFusion:
    def test_empty_chunks_returns_empty(self):
        result = _rrf_fusion([])

        assert result == []

    def test_combines_vector_and_bm25_rankings(self):
        # Chunk A: top en vector, bottom en BM25
        # Chunk B: bottom en vector, top en BM25
        # Chunk C: medio en ambos
        chunks = [
            {"chunk_id": "A", "score": 0.9, "bm25_score": 0.1},
            {"chunk_id": "B", "score": 0.1, "bm25_score": 0.9},
            {"chunk_id": "C", "score": 0.5, "bm25_score": 0.5},
        ]

        result = _rrf_fusion(chunks, k=60)

        # Cada chunk debe tener un rrf_score asignado
        for chunk in result:
            assert "rrf_score" in chunk
            assert chunk["rrf_score"] > 0

    def test_results_sorted_by_rrf_score_desc(self):
        chunks = [
            {"chunk_id": "A", "score": 0.9, "bm25_score": 0.5},
            {"chunk_id": "B", "score": 0.5, "bm25_score": 0.5},
            {"chunk_id": "C", "score": 0.1, "bm25_score": 0.1},
        ]

        result = _rrf_fusion(chunks)

        # El orden debe ser descendente por rrf_score
        for i in range(len(result) - 1):
            assert result[i]["rrf_score"] >= result[i + 1]["rrf_score"]

    def test_k_parameter_affects_score_smoothing(self):
        # Rankings alineados (no espejo) para que el spread sea distinto de cero
        chunks = [
            {"chunk_id": "A", "score": 0.9, "bm25_score": 0.9},
            {"chunk_id": "B", "score": 0.1, "bm25_score": 0.1},
        ]

        result_low_k = _rrf_fusion([dict(c) for c in chunks], k=1)
        result_high_k = _rrf_fusion([dict(c) for c in chunks], k=1000)

        # k pequeño -> mas peso a top ranks (scores mas separados)
        # k grande -> scores mas uniformes
        scores_low = sorted([c["rrf_score"] for c in result_low_k])
        scores_high = sorted([c["rrf_score"] for c in result_high_k])

        spread_low = scores_low[-1] - scores_low[0]
        spread_high = scores_high[-1] - scores_high[0]

        assert spread_low > spread_high
