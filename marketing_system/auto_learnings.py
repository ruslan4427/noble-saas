#!/usr/bin/env python3
"""
Auto-Learnings Builder
Reads week_content/*/published.json + output/engagement/post_stats.json
and rebuilds output/optimization/learnings.json for the strategist.

Run every Sunday night after weekly_report.py:
  python auto_learnings.py

The strategist reads learnings.json automatically on every plan_generator run.
"""

import json
from datetime import date, timedelta
from pathlib import Path

ROOT         = Path(__file__).parent
WEEK_CONTENT = ROOT / "week_content"
STATS_FILE   = ROOT / "output" / "engagement" / "post_stats.json"
LEARNINGS    = ROOT / "output" / "optimization" / "learnings.json"
OPT_DIR      = ROOT / "output" / "optimization"

DAY_FOLDERS  = [
    "Day01_Monday", "Day02_Tuesday", "Day03_Wednesday", "Day04_Thursday",
    "Day05_Friday", "Day06_Saturday", "Day07_Sunday",
]

DAY_FUNNEL = {
    1: "ATTRACT", 2: "ENGAGE",   3: "ENGAGE",
    4: "CONVINCE", 5: "CONVINCE", 6: "CONVERT", 7: "ENGAGE",
}

# ── Load existing learnings to preserve historical data ───────────────────────

def load_existing() -> dict:
    if LEARNINGS.exists():
        try:
            return json.loads(LEARNINGS.read_text())
        except Exception:
            pass
    return {}


# ── Load post stats (reach, likes, comments etc.) ────────────────────────────

def load_stats() -> dict:
    if STATS_FILE.exists():
        try:
            return json.loads(STATS_FILE.read_text())
        except Exception:
            pass
    return {}


# ── Collect posts from week_content published.json ───────────────────────────

def collect_week_posts(stats: dict) -> list[dict]:
    posts = []
    for i, folder_name in enumerate(DAY_FOLDERS, 1):
        folder = WEEK_CONTENT / folder_name
        pub_file = folder / "published.json"
        if not pub_file.exists():
            continue

        try:
            pub = json.loads(pub_file.read_text())
        except Exception:
            continue

        caption = ""
        caption_file = folder / "caption.txt"
        if caption_file.exists():
            caption = caption_file.read_text(encoding="utf-8").strip()

        for post_type, media_id in pub.items():
            stat = stats.get(str(media_id), {})
            reach    = stat.get("reach", 0)
            likes    = stat.get("likes", 0)
            comments = stat.get("comments", 0)
            saves    = stat.get("saves", 0)
            shares   = stat.get("shares", 0)
            total_eng = likes + comments + saves + shares
            er = round(total_eng / reach * 100, 2) if reach > 0 else 0.0

            posts.append({
                "day": i,
                "funnel": DAY_FUNNEL.get(i, "ENGAGE"),
                "folder": folder_name,
                "type": post_type,
                "media_id": str(media_id),
                "caption_preview": caption[:120],
                "hook": caption.split("\n")[0][:100] if caption else "",
                "reach": reach,
                "likes": likes,
                "comments": comments,
                "saves": saves,
                "shares": shares,
                "er": er,
            })

    return posts


# ── Build learnings from posts ────────────────────────────────────────────────

def build_learnings(posts: list[dict], existing: dict) -> dict:
    if not posts:
        print("  No posts found — keeping existing learnings")
        return existing

    # Sort by ER
    by_er = sorted([p for p in posts if p["reach"] > 0], key=lambda p: p["er"], reverse=True)
    top   = by_er[:3]
    worst = by_er[-1:] if len(by_er) > 1 else []

    # ER by content type
    type_er: dict[str, list] = {}
    for p in posts:
        if p["reach"] > 0:
            type_er.setdefault(p["type"], []).append(p["er"])
    type_avg = {t: round(sum(v) / len(v), 1) for t, v in type_er.items()}

    top_types = sorted(type_avg, key=lambda t: type_avg[t], reverse=True)

    # ER by funnel stage
    funnel_er: dict[str, list] = {}
    for p in posts:
        if p["reach"] > 0:
            funnel_er.setdefault(p["funnel"], []).append(p["er"])
    funnel_avg = {f: round(sum(v) / len(v), 1) for f, v in funnel_er.items()}

    # Reach by day
    reach_by_day = {
        ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][p["day"] - 1]: p["reach"]
        for p in posts
    }

    # Recommended weekly mix (based on top performers)
    recommended_mix = existing.get("recommended_weekly_mix", {
        "Monday":    {"funnel": "ATTRACT",  "type": "reel",      "pillar": "Awareness"},
        "Tuesday":   {"funnel": "ENGAGE",   "type": "carousel",  "pillar": "Social Proof"},
        "Wednesday": {"funnel": "ENGAGE",   "type": "reel",      "pillar": "Education"},
        "Thursday":  {"funnel": "CONVINCE", "type": "reel",      "pillar": "Features"},
        "Friday":    {"funnel": "CONVINCE", "type": "feed_post", "pillar": "Social Proof"},
        "Saturday":  {"funnel": "CONVERT",  "type": "reel",      "pillar": "Promotional"},
        "Sunday":    {"funnel": "ENGAGE",   "type": "story",     "pillar": "Engagement"},
    })

    # Top post examples for strategist
    top_examples = [
        {
            "content_type": p["type"],
            "pillar": p["funnel"],
            "hook": p["hook"],
            "day": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][p["day"] - 1],
            "er": p["er"],
            "reach": p["reach"],
            "saves": p["saves"],
            "why": f"{p['type']} on {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][p['day']-1]}, ER {p['er']}%",
        }
        for p in top[:3]
    ]

    zero_patterns = [
        {
            "content_type": p["type"],
            "pillar": p["funnel"],
            "hook": p["hook"],
            "day": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][p["day"] - 1],
            "er": p["er"],
            "reach": p["reach"],
            "why": f"Lowest ER this week ({p['er']}%) — review hook and timing",
        }
        for p in worst
    ]

    # Preserve key_insights from existing, add new ones
    key_insights = existing.get("key_insights", [])
    total_reach = sum(p["reach"] for p in posts)
    total_saves = sum(p["saves"] for p in posts)
    if total_reach > 0:
        save_rate = round(total_saves / total_reach * 100, 1)
        new_insight = f"W{date.today().isocalendar().week}: {total_reach} total reach, {total_saves} saves ({save_rate}% save rate)"
        if new_insight not in key_insights:
            key_insights = [new_insight] + key_insights[:9]  # keep 10 most recent

    return {
        "updated":            date.today().isoformat(),
        "source_week":        f"{date.today().year}-W{date.today().isocalendar().week:02d}",
        "total_posts_analyzed": len([p for p in posts if p["reach"] > 0]),

        "top_content_types":     top_types,
        "content_type_avg_er":   type_avg,
        "avoid_content_types":   [],

        "top_pillars":           list(funnel_avg.keys())[:2],
        "pillar_avg_er":         funnel_avg,
        "avoid_pillars":         [p["funnel"] for p in worst] if worst else [],

        "best_hook_patterns":    existing.get("best_hook_patterns", []),
        "hook_pattern_avg_er":   existing.get("hook_pattern_avg_er", {}),

        "top_post_examples":     top_examples,
        "zero_post_patterns":    zero_patterns,

        "reach_by_day":          reach_by_day,
        "recommended_weekly_mix": recommended_mix,
        "key_insights":          key_insights,

        "strategist_note": (
            f"Week {date.today().year}-W{date.today().isocalendar().week:02d}: "
            f"{total_reach} reach, {total_saves} saves. "
            f"Top format: {top_types[0] if top_types else 'N/A'}. "
            f"Best ER: {top[0]['er'] if top else 0}% ({top[0]['type'] if top else 'N/A'} day {top[0]['day'] if top else 0}). "
            "Sunday is always ENGAGE — never CONVERT."
        ),
    }


def main():
    print("\nAuto-Learnings Builder")
    print("─" * 40)

    existing = load_existing()
    stats    = load_stats()
    posts    = collect_week_posts(stats)

    print(f"  Posts with published.json: {len(posts)}")
    print(f"  Posts with reach data:     {len([p for p in posts if p['reach'] > 0])}")

    learnings = build_learnings(posts, existing)

    OPT_DIR.mkdir(parents=True, exist_ok=True)
    LEARNINGS.write_text(json.dumps(learnings, indent=2, ensure_ascii=False))
    print(f"  ✓ learnings.json updated → {LEARNINGS}")
    print(f"  Top types: {learnings['top_content_types']}")
    print(f"  Top pillars: {learnings['top_pillars']}")


if __name__ == "__main__":
    main()
