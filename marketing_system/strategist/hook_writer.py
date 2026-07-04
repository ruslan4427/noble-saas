#!/usr/bin/env python3
"""
Noble HookWriter Agent
Rewrites the first 3 seconds of each Reel using trending hooks from TrendScout.
The hook = the only thing that decides if the video gets watched or skipped.

Reads:  output/trends/trends_YYYY-MM-DD.json
Saves:  output/hooks/hooks_YYYY-MM-DD.json

Usage:
  python strategist/hook_writer.py
  python strategist/hook_writer.py --force
"""

import argparse
import json
import os
import sys
from datetime import date
from pathlib import Path

import anthropic
from dotenv import load_dotenv

ROOT       = Path(__file__).parent.parent
TRENDS_DIR = ROOT / "output" / "trends"
HOOKS_DIR  = ROOT / "output" / "hooks"
load_dotenv(ROOT / ".env")

WEEK_PLAN = [
    {"day": 1, "weekday": "Monday",    "pillar": "Product",      "concept": "Booking automation — your shop works even when you don't", "original_hook": "Stop chasing clients. Let them come to you."},
    {"day": 2, "weekday": "Tuesday",   "pillar": "Social Proof",  "concept": "Real numbers from a Noble barbershop — stats that prove ROI", "original_hook": "47 bookings. $3,240 revenue. 0 no-shows. This month."},
    {"day": 3, "weekday": "Wednesday", "pillar": "Features",      "concept": "Real-time booking notification — the moment it clicks for barbers", "original_hook": "You're in the middle of a cut. A client just booked for tomorrow."},
    {"day": 4, "weekday": "Thursday",  "pillar": "Features",      "concept": "Calendar filling up automatically — visual proof of demand", "original_hook": "What does a full calendar feel like? Ask Noble users."},
    {"day": 5, "weekday": "Friday",    "pillar": "Education",     "concept": "24/7 booking page — the barbershop that never sleeps", "original_hook": "Your shop is open. Even when you're not."},
    {"day": 6, "weekday": "Saturday",  "pillar": "Engagement",    "concept": "Weekend without phone call chaos — the Noble difference", "original_hook": "It's Saturday. You cut 12 heads. Took zero phone calls."},
    {"day": 7, "weekday": "Sunday",    "pillar": "Promotional",   "concept": "Free trial CTA — lowest barrier, highest urgency", "original_hook": "14 days free. No credit card. No risk. Just a full calendar."},
]

HOOK_PROMPT = """You are a viral Reels hook specialist for Noble — a booking SaaS for Black barbershop owners.

Your job: rewrite the hook for each day's Reel using the trending hook formats below.
The hook = first 1-2 sentences / first 3 seconds. It must STOP THE SCROLL.

TRENDING HOOKS RIGHT NOW:
{trending_hooks}

TRENDING TOPICS (pain points barbers feel):
{trending_topics}

For each day, write 3 hook variations:
1. PATTERN INTERRUPT — starts with something unexpected/bold
2. PAIN POINT — opens on a specific frustration barbers feel
3. CURIOSITY GAP — makes them NEED to watch to get the answer

Keep each hook under 12 words. No emojis in the hook itself (add after).
Speak directly to Black barbershop owners. Confident, direct, no fluff.

Days to rewrite:
{days_json}

Return ONLY valid JSON:
{{
  "generated_date": "{today}",
  "hooks": [
    {{
      "day": 1,
      "weekday": "Monday",
      "pillar": "Product",
      "original": "original hook text",
      "recommended": "best hook to use",
      "variations": {{
        "pattern_interrupt": "...",
        "pain_point": "...",
        "curiosity_gap": "..."
      }},
      "why": "one line on why recommended works best right now"
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
    parser = argparse.ArgumentParser(description="Noble HookWriter — rewrite Reel hooks using trends")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    today = date.today().isoformat()
    HOOKS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = HOOKS_DIR / f"hooks_{today}.json"

    if out_path.exists() and not args.force:
        print(f"✓ Hooks already written today: {out_path.name}")
        return

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY not set")
        sys.exit(1)

    trends = load_latest_trends()
    if not trends:
        print("Warning: no trends found — run trend_scout.py first. Using defaults.")

    client = anthropic.Anthropic(api_key=api_key)

    print("=" * 60)
    print("  NOBLE HOOK WRITER")
    print(f"  Date: {today}")
    if trends:
        print(f"  Trends: {trends.get('collected_date', 'unknown')}")
    print("=" * 60)

    trending_hooks = "\n".join(
        f"  • [{h['format']}] \"{h['hook']}\" → e.g. \"{h['example']}\""
        for h in trends.get("trending_hooks", [])[:8]
    ) or "  • Use direct, bold statements\n  • Open on a pain point\n  • Start with a number"

    trending_topics = "\n".join(
        f"  • {t['topic']}: {t['pain_point']}"
        for t in trends.get("trending_topics", [])[:5]
    ) or "  • No-shows costing money\n  • Too many DMs and phone calls\n  • Slow midweek days"

    days_json = json.dumps([
        {"day": d["day"], "weekday": d["weekday"], "pillar": d["pillar"],
         "concept": d["concept"], "original_hook": d["original_hook"]}
        for d in WEEK_PLAN
    ], indent=2)

    print("\n  Writing hooks with Claude...")
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        messages=[{"role": "user", "content": HOOK_PROMPT.format(
            trending_hooks=trending_hooks,
            trending_topics=trending_topics,
            days_json=days_json,
            today=today,
        )}],
    )

    raw = response.content[0].text.strip()
    start, end = raw.find("{"), raw.rfind("}") + 1
    result = json.loads(raw[start:end])

    out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False))

    print(f"\n{'=' * 60}")
    print(f"  Hooks saved: {out_path.name}")
    print(f"{'=' * 60}\n")

    low_score_days = []
    for h in result.get("hooks", []):
        hook_text = h["recommended"]
        words = hook_text.split()
        score = 50
        # Under 12 words: +20
        if len(words) <= 12:
            score += 20
        # Contains a number: +15
        if any(c.isdigit() for c in hook_text):
            score += 15
        # Contains a question mark: +15
        if "?" in hook_text:
            score += 15
        # Mentions Noble/noblelink (brand in hook = weaker): -20
        if any(w in hook_text.lower() for w in ("noble", "noblelink")):
            score -= 20

        flag = " ⚠️  LOW SCORE" if score < 60 else ""
        print(f"  Day {h['day']} {h['weekday']} [score: {score}]{flag}:")
        print(f"    Original:    {h['original']}")
        print(f"    Recommended: {hook_text}")
        print(f"    Why: {h['why']}")
        print()

        if score < 60:
            low_score_days.append((h["day"], h["weekday"], score))

    if low_score_days:
        print(f"[WARNING] {len(low_score_days)} hook(s) scored below 60:")
        for day, weekday, s in low_score_days:
            print(f"  Day {day} {weekday} — score {s}. Consider re-running with --force.")
        print()


if __name__ == "__main__":
    main()
