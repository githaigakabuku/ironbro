import unittest

from app import create_app


class GuildApiTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app(testing=True)
        self.client = self.app.test_client()

    def test_health(self):
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"status": "ok"})

    def test_create_goal_and_weekly_assessment(self):
        response = self.client.post(
            "/api/goals",
            json={
                "title": "Revenue Sprint",
                "month": "October",
                "milestone_label": "Financial Milestone",
                "milestone_target": 50000,
            },
        )

        self.assertEqual(response.status_code, 201)
        goal = response.get_json()

        weekly_response = self.client.post(
            f"/api/goals/{goal['id']}/weekly/1",
            json={"notes": "On track", "score": 8.5},
        )
        self.assertEqual(weekly_response.status_code, 200)

        goals_response = self.client.get("/api/goals")
        self.assertEqual(goals_response.status_code, 200)

        goals = goals_response.get_json()
        self.assertEqual(len(goals), 1)
        self.assertEqual(goals[0]["weekly_assessments"][0]["notes"], "On track")


if __name__ == "__main__":
    unittest.main()
