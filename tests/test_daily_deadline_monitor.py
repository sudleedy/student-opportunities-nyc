"""Offline tests for the daily organizer deadline monitor."""
import datetime as dt
import importlib.util
import pathlib
import unittest

MODULE = pathlib.Path(__file__).resolve().parents[1] / "scripts" / "daily_deadline_monitor.py"
spec = importlib.util.spec_from_file_location("deadline_monitor", MODULE)
monitor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(monitor)
TODAY = dt.date(2026, 10, 18)

def make_program():
    return {"id": "demo", "title": "Queens Museum Youth Science Challenge",
            "url": "https://www.example.org/programs/queens-science",
            "applicationState": "unknown", "deadlineISO": "",
            "deadline": "Next date unknown", "sourceStatus": "program"}


def page(extra, heading="Queens Museum Youth Science Challenge"):
    return "<html><head><title>" + heading + "</title></head><body><main><h1>" + heading + "</h1><p>" + extra + "</p></main></body></html>"


class DeadlineMonitorTests(unittest.TestCase):
    def test_dates_never_guessed_without_year(self):
        self.assertIsNone(monitor.extract_verified_date(make_program(), page("Application deadline: November 25"), TODAY)[0])

    def test_explicit_application_deadline(self):
        found, _ = monitor.extract_verified_date(make_program(), page("Application deadline: November 25, 2026"), TODAY)
        self.assertEqual(found, "2026-11-25")

    def test_iso_deadline(self):
        found, _ = monitor.extract_verified_date(make_program(), page("Applications close: 2026-12-03"), TODAY)
        self.assertEqual(found, "2026-12-03")

    def test_old_date_rejected(self):
        found, _ = monitor.extract_verified_date(make_program(), page("Application deadline: November 25, 2025"), TODAY)
        self.assertIsNone(found)

    def test_conflicting_deadlines_rejected(self):
        found, _ = monitor.extract_verified_date(make_program(),
            page("Application deadline: November 25, 2026. Registration deadline: December 1, 2026."), TODAY)
        self.assertIsNone(found)

    def test_parent_consent_cutoff_is_excluded(self):
        found, _ = monitor.extract_verified_date(make_program(), page("Parent consent application deadline: November 25, 2026"), TODAY)
        self.assertIsNone(found)

    def test_other_program_identity_rejected(self):
        found, _ = monitor.extract_verified_date(make_program(), page("Application deadline: November 25, 2026", "Museum Membership"), TODAY)
        self.assertIsNone(found)

    def test_scripts_cannot_supply_dates(self):
        found, _ = monitor.extract_verified_date(make_program(), page("Learn more" + "<script>Application deadline: November 25, 2026</script>"), TODAY)
        self.assertIsNone(found)

    def test_first_observation_does_not_publish(self):
        program = make_program()
        updates, state, pending = monitor.apply_evidence([program], {"demo": ("2026-11-25", "confirmed")}, {}, TODAY)
        self.assertEqual(updates, [])
        self.assertEqual(pending, ["demo"])
        self.assertEqual(state["demo"]["hits"], 1)
        self.assertEqual(program["deadlineISO"], "")

    def test_second_distinct_day_publishes(self):
        program = make_program()
        _, state, _ = monitor.apply_evidence([program], {"demo": ("2026-11-25", "confirmed")}, {}, TODAY)
        updates, state, pending = monitor.apply_evidence(
            [program], {"demo": ("2026-11-25", "confirmed")}, state, TODAY + dt.timedelta(days=1))
        self.assertEqual(updates, ["demo"])
        self.assertEqual(pending, [])
        self.assertEqual(program["deadlineISO"], "2026-11-25")
        self.assertEqual(program["applicationState"], "unknown") # Date does not prove open
        self.assertEqual(state["demo"]["hits"], 2)

    def test_same_day_not_two_observations(self):
        program = make_program()
        _, state, _ = monitor.apply_evidence([program], {"demo": ("2026-11-25", "confirmed")}, {}, TODAY)
        updates, newstate, _ = monitor.apply_evidence([program], {"demo": ("2026-11-25", "confirmed")}, state, TODAY)
        self.assertEqual(updates, [])
        self.assertEqual(newstate["demo"]["hits"], 1)

    def test_changed_date_starts_confirmation_again(self):
        program = make_program()
        _, state, _ = monitor.apply_evidence([program], {"demo": ("2026-11-25", "confirmed")}, {}, TODAY)
        changed, state, _ = monitor.apply_evidence([program], {"demo": ("2026-12-03", "confirmed")}, state, TODAY + dt.timedelta(days=1))
        self.assertEqual(changed, [])
        self.assertEqual(state["demo"]["hits"], 1)

    def test_past_open_status_auto_flagged(self):
        program = make_program()
        program.update(deadlineISO="2026-10-10", deadline="Applications close 10/10", applicationState="open", status="Open")
        changes = monitor.expire_dates([program], TODAY)
        self.assertEqual(changes, ["demo"])
        self.assertEqual(program["applicationState"], "unknown")
        self.assertIn("passed", program["status"])
        self.assertEqual(monitor.expire_dates([program], TODAY), [])

    def test_closed_record_preserved(self):
        program = make_program()
        program.update(deadlineISO="2026-10-10", applicationState="closed")
        self.assertEqual(monitor.expire_dates([program], TODAY), [])

    def test_other_program_deadline_on_shared_museum_page_is_rejected(self):
        artslife = {"id": "madmuseum-artslife",
                    "title": "Museum of Arts and Design: Artslife Paid Summer Internship",
                    "org": "Museum of Arts and Design"}
        shared = """
        <html><title>Teen Programs | Museum of Arts and Design</title><body>
        <h1>Teen Programs</h1>
        <h2>Artslife</h2><p>The Artslife 2026 internship is closed.</p>
        <h2>RECESS: Winter Break Intensive</h2>
        <p>Application Deadline: January 3, 2027</p>
        <h2>Artslab</h2></body></html>"""
        date, reason = monitor.extract_verified_date(artslife, shared, TODAY)
        self.assertIsNone(date, reason)

    def test_own_section_date_not_confused_with_other_program(self):
        artslife = {"id": "madmuseum-artslife",
                    "title": "Museum of Arts and Design: Artslife Paid Summer Internship",
                    "org": "Museum of Arts and Design"}
        shared = """
        <html><title>Teen Programs | Museum of Arts and Design</title><body>
        <h1>Teen Programs</h1>
        <h2>Artslife</h2><p>Application Deadline: November 25, 2026</p>
        <h2>RECESS: Winter Break Intensive</h2>
        <p>Application Deadline: January 3, 2027</p>
        </body></html>"""
        found, reason = monitor.extract_verified_date(artslife, shared, TODAY)
        self.assertEqual(found, "2026-11-25", reason)

    def test_public_url_validation(self):
        self.assertTrue(monitor.public_url("https://www.example.org/programs/demo"))
        self.assertFalse(monitor.public_url("http://www.example.org/"))
        self.assertFalse(monitor.public_url("https://127.0.0.1/private"))
        self.assertFalse(monitor.public_url("https://localhost/private"))


if __name__ == "__main__":
    unittest.main()
