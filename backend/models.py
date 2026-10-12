from datetime import UTC, datetime

from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


def utcnow():
    return datetime.now(UTC)


class Goal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    month = db.Column(db.String(32), nullable=False)
    photo_url = db.Column(db.String(500))
    milestone_label = db.Column(db.String(120), nullable=False)
    milestone_target = db.Column(db.Float, nullable=False)
    milestone_progress = db.Column(db.Float, nullable=False, default=0)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)

    assessments = db.relationship(
        "WeeklyAssessment",
        backref="goal",
        lazy=True,
        cascade="all, delete-orphan",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "month": self.month,
            "photo_url": self.photo_url,
            "milestone_label": self.milestone_label,
            "milestone_target": self.milestone_target,
            "milestone_progress": self.milestone_progress,
            "weekly_assessments": [assessment.to_dict() for assessment in self.assessments],
        }


class WeeklyAssessment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    goal_id = db.Column(db.Integer, db.ForeignKey("goal.id"), nullable=False)
    week_number = db.Column(db.Integer, nullable=False)
    notes = db.Column(db.Text, nullable=False, default="")
    score = db.Column(db.Float)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)

    __table_args__ = (
        db.UniqueConstraint("goal_id", "week_number", name="uq_goal_week"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "goal_id": self.goal_id,
            "week_number": self.week_number,
            "notes": self.notes,
            "score": self.score,
        }


class DeepWorkSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_name = db.Column(db.String(64), nullable=False)
    status = db.Column(db.String(32), nullable=False)
    started_at = db.Column(db.DateTime(timezone=True), nullable=False)
    ended_at = db.Column(db.DateTime(timezone=True))

    def to_dict(self):
        return {
            "id": self.id,
            "user_name": self.user_name,
            "status": self.status,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
        }
