# Tests del backend
## Ejecutar los tests

Dentro del contenedor Docker:

```bash
docker compose exec backend pytest
```

Con cobertura:

```bash
docker compose exec backend pip install pytest-cov
docker compose exec backend pytest --cov=app --cov-report=term-missing
```

Un test concreto:

```bash
docker compose exec backend pytest tests/unit/test_chat_service.py::TestBuildSources::test_groups_chunks_by_document
```
