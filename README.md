# ironbro

Guild productivity app scaffold with:

- **Web**: Next.js + React Three Fiber immersive 3D timeline (`/web`)
- **Backend**: Flask API + PostgreSQL models + Kafka event hooks (`/backend`)
- **Android companion**: Kotlin Jetpack Compose starter (`/android`)
- **Container orchestration**: Docker Compose (`/docker-compose.yml`)

## Web app (Next.js + R3F)

The web dashboard implements:

- Infinite `ScrollControls` timeline movement through 3D space
- Monthly 3D goal nodes with click-to-focus behavior
- Weekly orbiting sub-nodes with hover expansion using `<Html>` overlays
- Persistent deep-work stopwatch and urgency-based scene lighting
- Guild agent overlay subscribing to websocket prompts

Run:

```bash
cd /home/runner/work/ironbro/ironbro/web
npm install
npm run dev
```

## Backend (Flask + PostgreSQL + Kafka-ready)

API includes:

- `GET /health`
- `GET /api/goals`
- `POST /api/goals`
- `POST /api/goals/<goal_id>/weekly/<week_number>`
- `POST /api/stopwatch/start`
- `POST /api/stopwatch/stop`
- `WS /ws/guild`

Run:

```bash
cd /home/runner/work/ironbro/ironbro/backend
python -m pip install -r requirements.txt
python app.py
```

Run backend tests:

```bash
cd /home/runner/work/ironbro/ironbro/backend
python -m unittest discover -s tests
```

## Docker

Start full stack:

```bash
cd /home/runner/work/ironbro/ironbro
docker compose up --build
```
