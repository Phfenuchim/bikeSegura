# Backend Flask + PostgreSQL (BikeSegura)

API com padrão modular (models, repositories, services, controllers) e rotas separadas em core (`/api/v1`) e BFF (`/bff/v1`) dentro do mesmo serviço Flask.

## Estrutura
- `app/__init__.py`: cria app, registra extensões e blueprints.
- `app/config.py`: config por ambiente.
- `app/extensions.py`: instâncias de db, migrate, jwt, cors.
- `app/modules/`
  - `users/` (model, repository, service, controller para auth)
  - `incidents/` (model, repository, service, controller)
  - `routes/` (model, repository, service, controller)
  - `sos/` (model, repository, service, controller)
  - `feed/` (model, repository, service, controller)
  - `events/` (model, repository, service, controller para eventos de rota)
- `app/bff/` (controllers agregados para telas)
- `manage.py`: entrypoint Flask.
- `docker-compose.yml`: `api` + `db`.

## Rodar
```bash
cd Back
cp .env.example .env
docker-compose up --build
```

## Migrations (após subir containers)
```bash
docker-compose run --rm api flask db init    # primeira vez
docker-compose run --rm api flask db migrate -m "init"
docker-compose run --rm api flask db upgrade
```

## Seeds
`POST /api/v1/dev/seed` popula incidentes de exemplo.

## Configuração de DB
- Variáveis separadas: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (já preenchidas no `.env.example` e no `docker-compose.yml`).
- Alternativa: use `DATABASE_URL` para sobrescrever (ex.: Postgres gerenciado).

## Endpoints iniciais
- Auth: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `PATCH /api/v1/auth/me`
- Core: `GET /api/v1/incidents`, `POST /api/v1/incidents`, `POST /api/v1/dev/seed`
- Rotas: `GET /api/v1/routes`, `POST /api/v1/routes`, `GET /api/v1/routes/<id>`, `POST /api/v1/routes/<id>/incidents`
- SOS: `GET /api/v1/sos`, `POST /api/v1/sos`, `PATCH /api/v1/sos/<id>/status`
- Feed: `GET /api/v1/feed`, `POST /api/v1/feed`
- Eventos: `GET /api/v1/route-events`, `POST /api/v1/route-events`, `PATCH /api/v1/route-events/<id>/status`
- Perfil público: `GET /api/v1/auth/<id>`
- BFF: `GET /bff/v1/map/summary`, `GET /bff/v1/home`
