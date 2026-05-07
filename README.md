# Memora - Sistema de Gestión Documental con RAG

Memora es una aplicación web que permite a un usuario subir documentos (PDF, DOCX, TXT), indexarlos automáticamente, y chatear con un LLM que responde basándose en el contenido de esos documentos.

Trabajo Fin de Grado - Universitat Oberta de Catalunya.

<img width="1920" height="887" alt="captura-memora" src="https://github.com/user-attachments/assets/15a0b486-07ba-468c-bbf3-813923377a4b" />

---

## Requisitos previos

1. **Docker Desktop** instalado y en ejecución.
   - Windows/macOS: https://www.docker.com/products/docker-desktop/
   - Linux: instalar Docker Engine + Docker Compose plugin.
2. **Dos API keys gratuitas**:
   - Groq: registrarse en https://console.groq.com/ → "API Keys" → crear nueva clave (formato `gsk_...`).

     <img width="1920" height="880" alt="image" src="https://github.com/user-attachments/assets/e74ee95b-870a-44a8-b518-d4329aaa30a2" />

   - Jina AI: acceder (no es necesario registro) a https://jina.ai/es/reranker/ → "API Key" (formato `jina_...`).

     <img width="1920" height="874" alt="jina-apikey" src="https://github.com/user-attachments/assets/6c3531cf-6449-4ef5-854a-0f882ae2a8b7" />


No es necesario instalar Python, Node.js, PostgreSQL ni otras herramientas. Todo se ejecuta dentro de Docker.

---

## Inicialización desde cero

### 1. Clonar el repositorio

```bash
git clone https://github.com/weri02/memora.git
cd memora
```

### 2. Configurar las claves

Copiar el archivo de plantilla y rellenar las claves generadas:

```bash
cp .env.example .env
```

Editar el archivo `.env` con un editor de texto y rellenar los tres valores obligatorios:

```env
GROQ_API_KEY=gsk_tu-clave-aquí
JINA_API_KEY=jina_tu-clave-aquí
JWT_SECRET=cualquier-cadena-aleatoria-de-32-caracteres-o-mas
```

**Generación rápida de un `JWT_SECRET` seguro** (en una terminal):

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

El resto de variables (`POSTGRES_USER`, `GROQ_MODEL`, etc.) tienen valores por defecto y solo es necesario cambiarlas en caso de querer personalizar la instalación.

### 3. Levantar todos los servicios

```bash
docker compose up -d --build
```

Este comando construye las imágenes (~5-10 min la primera vez) y arranca los 3 contenedores en segundo plano.

### 4. Verificar que todo funciona

Comprobar el estado de los contenedores:

```bash
docker compose ps
```

Deben verse tres servicios `Up`: `postgres`, `backend`, `frontend`.

Comprobar los logs del backend para asegurar que arrancó sin errores:

```bash
docker compose logs backend | grep "Model loaded successfully"
```

Si aparece esa línea, todo está listo.

### 5. Acceder a la aplicación

Abrir el navegador en:

```
http://localhost:5173
```

Donde redirige a `/login` automáticamente.

---

## Uso de la aplicación

1. **Registro**: en `/register` crear una cuenta con email, contraseña (mínimo 6 caracteres) y nombre.
2. **Login**: Inicios de sesión posteriores a la creación de la cuenta.
3. **Subir documentos**: en `/documents` arrastrar o seleccionar archivos PDF, DOCX o TXT (máximo 50 MB). El sistema los procesará en segundo plano.  El estado cambiará de `pending` a `processing` y finalmente a `indexed`.
4. **Crear una conversación**: en `/chat` pulsar el botón de nueva conversación.
5. **Chatear**: escribir preguntas sobre el contenido de los documentos adjuntos. La respuesta llega en streaming token a token, con citas de los fragmentos relevantes.

---

## Comandos útiles

| Acción | Comando |
|--------|---------|
| Arrancar todos los servicios | `docker compose up -d` |
| Detener todos los servicios | `docker compose down` |
| Ver logs en tiempo real | `docker compose logs -f` |
| Ver logs solo del backend | `docker compose logs -f backend` |
| Reiniciar el backend tras cambios de código | `docker compose restart backend` |
| Reconstruir la imagen del backend | `docker compose up -d --build backend` |
| Borrar todo (incluyendo volúmenes y BD) | `docker compose down -v` |
| Acceder a la BD interactivamente | `docker compose exec postgres psql -U ragdocs -d ragdocs_db` |
| Ejecutar los tests del backend | `docker compose exec backend pytest` |

---

## Estructura del proyecto

```
proyecto/
├── README.md                       # Este archivo
├── docker-compose.yml              # Orquestación de los 3 servicios
├── .env / .env.example             # Configuración de claves y BD
├── scripts/
│   └── init_pgvector.sql           # Esquema inicial de la BD
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── requirements.txt
│   ├── app/
│   │   ├── api/v1/                 # Routers HTTP (auth, documents, chat)
│   │   ├── core/                   # Database, dependencies, exceptions
│   │   ├── models/                 # SQLAlchemy ORM (User, Document, Chat...)
│   │   ├── schemas/                # Pydantic DTOs
│   │   ├── services/               # Lógica de negocio (embeddings, RAG, etc.)
│   │   ├── config.py               # Settings via pydantic-settings
│   │   └── main.py                 # FastAPI app + lifespan
│   └── tests/
│       └── unit/                   # Tests unitarios (ver tests/README.md)
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── pages/                  # LoginPage, DocumentsPage, ChatPage...
        ├── components/             # Componentes reutilizables
        ├── stores/                 # Estado global (Zustand)
        ├── lib/                    # Cliente API, constantes
        └── types/                  # Tipos TypeScript compartidos
```

---

## Resolución de problemas comunes

### El backend no arranca o se queda colgado al inicio

Probablemente está descargando el modelo de embeddings BGE-M3. Esperar 1-2 minutos y verificar con:

```bash
docker compose logs -f backend
```

### El frontend muestra "ECONNREFUSED" al hacer login

El backend aún no terminó de arrancar. Esperar a que aparezca `Uvicorn running on http://0.0.0.0:8000` en sus logs y refrescar el navegador.

### Quiero empezar desde cero (borrar usuarios, documentos y chats)

```bash
docker compose down -v
docker compose up -d
```

El flag `-v` elimina los volúmenes de PostgreSQL.

### La aplicación dice que un documento no se encuentra después de subirlo

El indexado tarda unos segundos para PDFs grandes. Refrescar la página y verificar que el estado del documento sea `indexed`. Si queda en `error`, mirar los logs del backend para diagnosticar.

## Tests

Suite de tests unitarios cubre la lógica crítica del pipeline RAG (chunking, BM25, RRF, agrupación de fuentes, JWT, hashing).

```bash
docker compose exec backend pytest
```

---

## Autor

Houari Bekkay Boumaza - Trabajo Fin de Grado, Universitat Oberta de Catalunya.
