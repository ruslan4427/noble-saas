#!/usr/bin/env python3
"""
Noble HashtagResearcher Agent
Builds an optimized per-day hashtag set using TrendScout data + content pillar.

Formula per post: 3 niche + 3 mid + 2 broad + 2 geo + 1 branded = 11 tags
(Instagram sweet spot — enough to get found, not enough to look spammy)

Reads:  output/trends/trends_YYYY-MM-DD.json
Saves:  output/hashtags/hashtags_YYYY-MM-DD.json

Usage:
  python strategist/hashtag_researcher.py
  python strategist/hashtag_researcher.py --force
"""

import argparse
import json
import os
import sys
from datetime import date
from pathlib import Path

import anthropic
from dotenv import load_dotenv

ROOT          = Path(__file__).parent.parent
TRENDS_DIR    = ROOT / "output" / "trends"
HASHTAGS_DIR  = ROOT / "output" / "hashtags"
load_dotenv(ROOT / ".env")

WEEK_PLAN = [
    {"day": 1, "weekday": "Monday",    "pillar": "Product",      "topic": "booking automation"},
    {"day": 2, "weekday": "Tuesday",   "pillar": "Social Proof",  "topic": "revenue stats, no-shows"},
    {"day": 3, "weekday": "Wednesday", "pillar": "Features",      "topic": "real-time booking notifications"},
    {"day": 4, "weekday": "Thursday",  "pillar": "Features",      "topic": "full calendar, scheduling"},
    {"day": 5, "weekday": "Friday",    "pillar": "Education",     "topic": "24/7 online booking"},
    {"day": 6, "weekday": "Saturday",  "pillar": "Engagement",    "topic": "weekend workflow, no phone calls"},
    {"day": 7, "weekday": "Sunday",    "pillar": "Promotional",   "topic": "free trial, getting started"},
]

HASHTAG_PROMPT = """You are a hashtag strategist for Noble — a booking SaaS targeting Black barbershop owners in the USA (focus: Baltimore/Maryland area).

Build an optimized hashtag set for each day's Instagram post.

FORMULA per post (11 tags total):
- 3 NICHE tags: very specific to Black barbershop owners (small-medium audience, high engagement)
- 3 MID tags: barbershop/barber culture (medium audience)
- 2 BROAD tags: small business / entrepreneurship (large audience)
- 2 GEO tags: location-based for Baltimore/Maryland
- 1 BRANDED tag: #NobleSaaS or #NobleBooking

TRENDING TAGS FROM THIS WEEK (prioritize these):
{trending_tags}

TAGS TO AVOID (dead/oversaturated):
{tags_avoid}

Rules:
- Never repeat the same tag across multiple days
- Rotate tags so the week feels varied to the algorithm
- Match tags to the post topic — don't use #SkinFade on a stats post
- Include at least 1 tag with under 100K posts (niche discovery)

Days:
{days_json}

Return ONLY valid JSON:
{{
  "generated_date": "{today}",
  "strategy_note": "one line on the weekly hashtag approach",
  "days": [
    {{
      "day": 1,
      "weekday": "Monday",
      "pillar": "Product",
      "topic": "booking automation",
      "hashtags": ["#tag1", "#tag2", ...],
      "caption_ready": "#tag1 #tag2 #tag3 ... (space-separated, ready to paste)"
    }}
  ]
}}"""


def load_latest_trends():
    files = sorted(TRENDS_DIR.glob("trends_*.json"), reverse=True)
    if not files:
        return {}
    with open(files[0]) as f:
        return json.load(f)


def main():
    parser = argparse.ArgumentParser(description="Noble HashtagResearcher — build per-day hashtag sets")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    today = date.today().isoformat()
    HASHTAGS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = HASHTAGS_DIR / f"hashtags_{today}.json"

    if out_path.exists() and not args.force:
        print(f"✓ Hashtags already built today: {out_path.name}")
        return

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY not set")
        sys.exit(1)

    trends = load_latest_trends()

    client = anthropic.Anthropic(api_key=api_key)

    print("=" * 60)
    print("  NOBLE HASHTAG RESEARCHER")
    print(f"  Date: {today}")
    if trends:
        print(f"  Trends: {trends.get('collected_date', 'unknown')}")
    print("=" * 60)

    tags = trends.get("trending_hashtags", {})
    all_trending = (
        tags.get("niche", []) +
        tags.get("mid", []) +
        tags.get("broad", []) +
        tags.get("geo", [])
    )
    tags_avoid = tags.get("avoid", ["#Barber", "#Hair", "#Style"])

    trending_str = "\n".join(f"  {t}" for t in all_trending[:20]) or "  #BlackBarbershop #BarberLife #FreshFade"
    avoid_str    = "\n".join(f"  {t}" for t in tags_avoid[:10]) or "  (none specified)"

    days_json = json.dumps(WEEK_PLAN, indent=2)

    print("\n  Building hashtag sets with Claude...")
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=3000,
        messages=[{"role": "user", "content": HASHTAG_PROMPT.format(
            trending_tags=trending_str,
            tags_avoid=avoid_str,
            days_json=days_json,
            today=today,
        )}],
    )

    raw = response.content[0].text.strip()
    start, end = raw.find("{"), raw.rfind("}") + 1
    result = json.loads(raw[start:end])

    out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False))

    print(f"\n{'=' * 60}")
    print(f"  Hashtags saved: {out_path.name}")
    print(f"  Strategy: {result.get('strategy_note', '')}")
    print(f"{'=' * 60}\n")

    for d in result.get("days", []):
        print(f"  Day {d['day']} {d['weekday']} [{d['pillar']}]:")
        print(f"    {d['caption_ready']}")
        print()


if __name__ == "__main__":
    main()
