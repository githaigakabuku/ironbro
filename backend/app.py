import json
import os
from datetime import UTC, datetime

from flask import Flask, jsonify, request
from flask_sock import Sock
from kafka import KafkaProducer
from werkzeug.exceptions import NotFound

from models import DeepWorkSession, Goal, WeeklyAssessment, db


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()


def create_kafka_producer() -> KafkaProducer | None:
    servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS")
    if not servers:
        return None

    try:
        return KafkaProducer(
            bootstrap_servers=servers.split(","),
            value_serializer=lambda payload: json.dumps(payload).encode("utf-8"),
        )
    except Exception:
        return None


def create_app(testing: bool = False) -> Flask:
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///guild.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["TESTING"] = testing

    if testing:
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite+pysqlite:///:memory:"

    db.init_app(app)
    sock = Sock(app)
    producer = create_kafka_producer()
    ws_clients: set = set()

    with app.app_context():
        db.create_all()

    def emit_event(event_type: str, payload: dict) -> None:
        envelope = {
            "type": event_type,
            "timestamp": _timestamp(),
            "payload": payload,
        }
        if producer:
            producer.send("guild-events", envelope)

        stale_clients = []
        for ws in ws_clients:
            try:
                ws.send(json.dumps(envelope))
            except Exception:
                stale_clients.append(ws)

        for ws in stale_clients:
            ws_clients.discard(ws)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    @app.get("/api/goals")
    def list_goals():
        goals = Goal.query.order_by(Goal.id.asc()).all()
        return jsonify([goal.to_dict() for goal in goals])

    @app.post("/api/goals")
    def create_goal():
        payload = request.get_json(silent=True) or {}
        required_fields = [
            "title",
            "month",
            "milestone_label",
            "milestone_target",
        ]
        if any(field not in payload for field in required_fields):
            return jsonify({"error": "missing required fields"}), 400

        goal = Goal(
            title=payload["title"],
            month=payload["month"],
            photo_url=payload.get("photo_url"),
            milestone_label=payload["milestone_label"],
            milestone_target=float(payload["milestone_target"]),
            milestone_progress=float(payload.get("milestone_progress", 0)),
        )
        db.session.add(goal)
        db.session.commit()

        emit_event("goal_updated", {"goal_id": goal.id})
        return jsonify(goal.to_dict()), 201

    @app.post("/api/goals/<int:goal_id>/weekly/<int:week_number>")
    def update_weekly(goal_id: int, week_number: int):
        goal = db.session.get(Goal, goal_id)
        if goal is None:
            raise NotFound()
        payload = request.get_json(silent=True) or {}

        assessment = WeeklyAssessment.query.filter_by(
            goal_id=goal.id,
            week_number=week_number,
        ).first()

        if assessment is None:
            assessment = WeeklyAssessment(
                goal_id=goal.id,
                week_number=week_number,
            )
            db.session.add(assessment)

        assessment.notes = payload.get("notes", "")
        assessment.score = payload.get("score")
        db.session.commit()

        emit_event(
            "weekly_assessment_updated",
            {"goal_id": goal.id, "week": week_number},
        )
        return jsonify(assessment.to_dict())

    @app.post("/api/stopwatch/start")
    def start_stopwatch():
        payload = request.get_json(silent=True) or {}
        user_name = payload.get("user_name", "guild-user")

        session = DeepWorkSession(
            user_name=user_name,
            status="running",
            started_at=datetime.now(UTC),
        )
        db.session.add(session)
        db.session.commit()

        emit_event("stopwatch_started", session.to_dict())
        return jsonify(session.to_dict()), 201

    @app.post("/api/stopwatch/stop")
    def stop_stopwatch():
        payload = request.get_json(silent=True) or {}
        session_id = payload.get("session_id")
        session = db.session.get(DeepWorkSession, session_id)
        if session is None:
            raise NotFound()

        session.status = "stopped"
        session.ended_at = datetime.now(UTC)
        db.session.commit()

        emit_event("stopwatch_stopped", session.to_dict())
        return jsonify(session.to_dict())

    @sock.route("/ws/guild")
    def guild_socket(ws):
        ws_clients.add(ws)
        ws.send(
            json.dumps(
                {
                    "type": "agent_prompt",
                    "message": "Today's focus is XYZ. Complete weekly reviews before 8PM.",
                    "timestamp": _timestamp(),
                }
            )
        )

        while True:
            data = ws.receive()
            if data is None:
                ws_clients.discard(ws)
                break

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
