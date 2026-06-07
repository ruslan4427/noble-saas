#!/usr/bin/env python3
"""
Build week_content/schedule.json — posting schedule for current week.
Run every Monday after generating content.

Output: marketing_system/week_content/schedule.json
  {
    "week": "2026-W24",
    "posts": [
      {"day": 1, "folder": "Day01_Monday",  "type": "reel", "post_at_utc": "2026-06-08T15:00:00Z"},
      ...
    ]
  }

The instagram_post.yml workflow reads this file hourly to decide what to post.
"""

import json
import os
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

ROOT         = Path(__file__).parent
WEEK_CONTENT = ROOT / "week_content"
SCHEDULE_OUT = WEEK_CONTENT / "schedule.json"

DAY_FOLDERS = [
    "Day01_Monday", "Day02_Tuesday", "Day03_Wednesday", "Day04_Thursday",
    "Day05_Friday",  "Day06_Saturday", "Day07_Sunday",
]

# EDT = UTC-4. Best posting times per day (in EDT → converted to UTC).
# Based on W23 analysis: mid-week 11am-1pm EDT + Sat morning.
POSTING_TIMES_EDT = {
    1: ("11", "00"),   # Mon  11:00 EDT — ATTRACT reel
    2: ("11", "30"),   # Tue  11:30 EDT — ENGAGE feed/carousel
    3: ("12", "00"),   # Wed  12:00 EDT — ENGAGE reel
    4: ("11", "00"),   # Thu  11:00 EDT — CONVINCE reel
    5: ("11", "30"),   # Fri  11:30 EDT — CONVINCE feed
    6: ("10", "00"),   # Sat  10:00 EDT — CONVERT reel (morning audience)
    7: ("11", "00"),   # Sun  11:00 EDT — ENGAGE story/reel
}

# Post type per day (matches funnel: reel for reach days, feed for engagement days)
POST_TYPES = {
    1: "reel",   # Mon — reach
    2: "feed",   # Tue — engagement
    3: "reel",   # Wed — reach
    4: "reel",   # Thu — convince
    5: "feed",   # Fri — social proof
    6: "reel",   # Sat — convert
    7: "reel",   # Sun — community
}

# Timezone offset: override via POSTING_UTC_OFFSET env var (e.g. "-4" for EDT, "-5" for EST)
_tz_hours = int(os.environ.get("POSTING_UTC_OFFSET", "-4"))
EDT_OFFSET = timedelta(hours=_tz_hours)


def get_monday(next_week: bool = False) -> date:
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    if next_week or today.weekday() == 6:  # Sunday → auto next week
        monday += timedelta(weeks=1)
    return monday


def build_schedule() -> dict:
    monday = get_monday()
    iso = monday.isocalendar()
    week_label = f"{iso.year}-W{iso.week:02d}"

    posts = []
    for day_num in range(1, 8):
        folder_name = DAY_FOLDERS[day_num - 1]
        folder = WEEK_CONTENT / folder_name

        # Only schedule days that have content
        has_content = (folder / "caption.txt").exists() or (folder / "published.json").exists()
        if not has_content:
            continue

        # Already published — skip
        if (folder / "published.json").exists():
            try:
                pub = json.loads((folder / "published.json").read_text())
                if pub:
                    continue  # already posted
            except Exception:
                pass

        post_date = monday + timedelta(days=day_num - 1)
        hour, minute = POSTING_TIMES_EDT[day_num]

        # Convert EDT to UTC
        post_dt_edt = datetime(
            post_date.year, post_date.month, post_date.day,
            int(hour), int(minute), 0,
            tzinfo=timezone(EDT_OFFSET)
        )
        post_dt_utc = post_dt_edt.astimezone(timezone.utc)

        posts.append({
            "day": day_num,
            "folder": folder_name,
            "type": POST_TYPES[day_num],
            "post_at_utc": post_dt_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "post_at_edt": post_dt_edt.strftime("%Y-%m-%d %H:%M EDT"),
        })

    return {"week": week_label, "generated_at": datetime.now(timezone.utc).isoformat(), "posts": posts}


def main():
    schedule = build_schedule()
    WEEK_CONTENT.mkdir(parents=True, exist_ok=True)
    SCHEDULE_OUT.write_text(json.dumps(schedule, indent=2))
    print(f"✓ Schedule written: {SCHEDULE_OUT}")
    print(f"  Week: {schedule['week']}")
    for p in schedule["posts"]:
        print(f"  Day {p['day']} {p['type']:5s} → {p['post_at_edt']}")


if __name__ == "__main__":
    main()
