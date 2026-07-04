#!/usr/bin/env python3
"""
Noble Scheduler Agent
Assigns optimal posting time for each day based on:
- Algorithm insights from TrendScout
- Barbershop audience behavior (when barbers + clients scroll)
- Day-of-week patterns for Black small business owners

Saves:  output/schedule/schedule_YYYY-MM-DD.json
        (includes exact datetime strings ready to paste into Business Suite)

Usage:
  python strategist/scheduler.py
  python strategist/scheduler.py --timezone EST
  python strategist/scheduler.py --start-date 2026-06-09
"""

import argparse
import json
import os
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

ROOT          = Path(__file__).parent.parent
TRENDS_DIR    = ROOT / "output" / "trends"
SCHEDULE_DIR  = ROOT / "output" / "schedule"
load_dotenv(ROOT / ".env")

# Best windows per day for barbershop owners (EST)
# Based on: when barbers prep for work + between clients + evening wind-down
DAY_WINDOWS = {
    "Monday":    [("11:30", "Product launch window — barbers planning their week"),
                  ("19:00", "Evening scroll after shop closes")],
    "Tuesday":   [("12:00", "Lunch break — midweek slow day, more time to scroll"),
                  ("20:00", "Prime evening window for education content")],
    "Wednesday": [("11:00", "Mid-morning — steady shop day, clients share between appts"),
                  ("19:30", "Peak engagement for features/how-to content")],
    "Thursday":  [("12:30", "Pre-weekend energy starts — barbers planning Fri/Sat"),
                  ("18:30", "High engagement window before weekend rush")],
    "Friday":    [("09:00", "Morning before shop rush — barbers check phone early"),
                  ("20:30", "Post-shop evening — barbers wind down, scroll heavily")],
    "Saturday":  [("10:00", "Between morning clients — quick scroll during break"),
                  ("21:00", "After shop closes — highest weekly engagement for barbers")],
    "Sunday":    [("11:00", "Late morning — rest day, highest leisure scrolling"),
                  ("19:00", "Evening — planning next week, very receptive to offers")],
}

WEEK_PLAN = [
    {"day": 1, "weekday": "Monday",    "type": "Reel", "pillar": "Product"},
    {"day": 2, "weekday": "Tuesday",   "type": "Feed", "pillar": "Social Proof"},
    {"day": 3, "weekday": "Wednesday", "type": "Reel", "pillar": "Features"},
    {"day": 4, "weekday": "Thursday",  "type": "Feed", "pillar": "Features"},
    {"day": 5, "weekday": "Friday",    "type": "Reel", "pillar": "Education"},
    {"day": 6, "weekday": "Saturday",  "type": "Feed", "pillar": "Engagement"},
    {"day": 7, "weekday": "Sunday",    "type": "Reel", "pillar": "Promotional"},
]

# Reels → morning window (algorithm auditions to cold audience during commute hours)
# Feed posts → evening window (warmer audience, nurture existing followers)
CONTENT_WINDOW = {"Reel": 0, "Feed": 1}


def next_weekday(start: date, weekday_name: str) -> date:
    days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    target = days.index(weekday_name)
    delta = (target - start.weekday()) % 7
    return start + timedelta(days=delta)


def main():
    parser = argparse.ArgumentParser(description="Noble Scheduler — assign optimal posting times")
    parser.add_argument("--timezone",   default="America/New_York")
    parser.add_argument("--start-date", default=None, dest="start_date",
                        help="YYYY-MM-DD of the Monday to schedule (default: next Monday)")
    args = parser.parse_args()

    today = date.today()
    if args.start_date:
        start = date.fromisoformat(args.start_date)
    else:
        # Next Monday (or today if it's Monday)
        start = next_weekday(today, "Monday")

    out_date = today.isoformat()
    SCHEDULE_DIR.mkdir(parents=True, exist_ok=True)
    out_path = SCHEDULE_DIR / f"schedule_{out_date}.json"

    # Load algorithm insights from trends
    trend_files = sorted(TRENDS_DIR.glob("trends_*.json"), reverse=True)
    insights = []
    if trend_files:
        with open(trend_files[0]) as f:
            trends = json.load(f)
        insights = trends.get("algorithm_insights", [])

    tz = ZoneInfo(args.timezone)

    print("=" * 60)
    print("  NOBLE SCHEDULER")
    print(f"  Week starting: {start.isoformat()}")
    print(f"  Timezone: {args.timezone}")
    print("=" * 60)

    schedule = []

    for entry in WEEK_PLAN:
        post_date = next_weekday(start, entry["weekday"])
        windows   = DAY_WINDOWS[entry["weekday"]]
        window_idx = CONTENT_WINDOW.get(entry["type"], 0)
        time_str, reason = windows[window_idx]

        hour, minute = map(int, time_str.split(":"))
        post_dt = datetime(post_date.year, post_date.month, post_date.day,
                           hour, minute, tzinfo=tz)

        schedule.append({
            "day":        entry["day"],
            "weekday":    entry["weekday"],
            "type":       entry["type"],
            "pillar":     entry["pillar"],
            "post_date":  post_date.isoformat(),
            "post_time":  time_str,
            "timezone":   args.timezone,
            "datetime_local": post_dt.strftime("%Y-%m-%d %H:%M %Z"),
            "business_suite_format": post_dt.strftime("%m/%d/%Y %I:%M %p"),
            "reason":     reason,
        })

        print(f"\n  Day {entry['day']} — {entry['weekday']} [{entry['type']}]")
        print(f"    📅 {post_date.isoformat()} at {time_str} {args.timezone}")
        print(f"    💡 {reason}")

    result = {
        "generated_date": out_date,
        "week_start":     start.isoformat(),
        "timezone":       args.timezone,
        "schedule":       schedule,
        "algorithm_note": insights[8] if len(insights) > 8 else
                          "Post during peak windows: 7-9am or 11:30am-1:30pm for max early engagement velocity.",
    }

    out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False))

    print(f"\n{'=' * 60}")
    print(f"  Schedule saved: {out_path.name}")
    print(f"{'=' * 60}\n")
    print("  Business Suite format (copy-paste ready):")
    print()
    for s in schedule:
        print(f"  {s['weekday']:12} {s['type']:5} → {s['business_suite_format']}")
    print()


if __name__ == "__main__":
    main()
