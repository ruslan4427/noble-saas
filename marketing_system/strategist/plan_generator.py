#!/usr/bin/env python3
"""
Noble SMM Strategist Agent
Generates structured content plans for Instagram, TikTok, and Telegram.
Reads marketing_system/data/noble_updates.json as priority content source.
"""

import argparse
import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path

import anthropic
from dotenv import load_dotenv

from prompts import NOBLE_BRAND_CONTEXT, PLATFORM_FORMATS, CONTENT_FOCUS_DESCRIPTIONS

load_dotenv(Path(__file__).parent.parent / ".env")

UPDATES_FILE   = Path(__file__).parent.parent / "data" / "noble_updates.json"
TRENDS_DIR     = Path(__file__).parent.parent / "output" / "trends"
HOOKS_DIR      = Path(__file__).parent.parent / "output" / "hooks"
LEARNINGS_FILE = Path(__file__).parent.parent / "output" / "optimization" / "learnings.json"


def get_client() -> anthropic.Anthropic:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY not set. Copy .env.example to .env and add your key.")
        sys.exit(1)
    return anthropic.Anthropic(api_key=api_key)


def load_learnings() -> dict:
    if not LEARNINGS_FILE.exists():
        return {}
    with open(LEARNINGS_FILE) as f:
        return json.load(f)


def format_learnings_block(learnings: dict) -> str:
    if not learnings:
        return ""

    lines = [f"PERFORMANCE LEARNINGS — based on {learnings.get('total_posts_analyzed', 0)} real posts ({learnings.get('updated', 'recent')}):"]
    lines.append("")
    lines.append("⚠ USE THIS DATA — it overrides default assumptions about what works.")
    lines.append("")

    top_types = learnings.get("top_content_types", [])
    type_er   = learnings.get("content_type_avg_er", {})
    if top_types:
        lines.append("📊 CONTENT TYPE PERFORMANCE (by engagement rate):")
        for ct in top_types:
            er = type_er.get(ct, 0)
            lines.append(f"  ✓ {ct:18s} avg ER {er:.1f}%  ← USE MORE")
        avoid = learnings.get("avoid_content_types", [])
        for ct in avoid:
            er = type_er.get(ct, 0)
            lines.append(f"  ✗ {ct:18s} avg ER {er:.1f}%  ← REDUCE")
        lines.append("")

    top_pillars = learnings.get("top_pillars", [])
    pillar_er   = learnings.get("pillar_avg_er", {})
    if top_pillars:
        lines.append("🏆 BEST PERFORMING PILLARS:")
        for p in top_pillars:
            er = pillar_er.get(p, 0)
            lines.append(f"  • {p:20s} avg ER {er:.1f}%")
        lines.append("")

    hook_pats = learnings.get("best_hook_patterns", [])
    hook_er   = learnings.get("hook_pattern_avg_er", {})
    if hook_pats:
        lines.append("🪝 BEST HOOK PATTERNS (write hooks in these styles):")
        for h in hook_pats:
            er = hook_er.get(h, 0)
            lines.append(f"  • {h:20s} avg ER {er:.1f}%")
        lines.append("")

    top_examples = learnings.get("top_post_examples", [])
    if top_examples:
        lines.append("🔥 TOP POST HOOKS (replicate these patterns):")
        for ex in top_examples:
            lines.append(f'  • [{ex["content_type"]} / {ex["pillar"]}] "{ex["hook"]}" — ER {ex["er"]}%')
        lines.append("")

    zero_examples = learnings.get("zero_post_patterns", [])
    if zero_examples:
        lines.append("✗ ZERO-REACH HOOKS (avoid these patterns):")
        for ex in zero_examples:
            lines.append(f'  • [{ex["content_type"]} / {ex["pillar"]}] "{ex["hook"]}"')
        lines.append("")

    mix = learnings.get("recommended_weekly_mix", {})
    if mix:
        lines.append("📅 RECOMMENDED WEEKLY MIX (based on what performs):")
        for ct, count in mix.items():
            lines.append(f"  • {ct}: {count} posts per week")
        lines.append("")

    note = learnings.get("strategist_note", "")
    if note:
        lines.append(f"SUMMARY: {note}")
        lines.append("")

    lines.append("INSTRUCTION: Adjust post_type distribution and pillar selection to match the learnings above. "
                 "Prioritize content types and pillars with highest ER. Write hooks that match the best patterns. "
                 "Avoid pillar/type combinations that produced zero reach.")
    return "\n".join(lines)


def load_latest_trends() -> dict:
    files = sorted(TRENDS_DIR.glob("trends_*.json"), reverse=True)
    if not files:
        return {}
    with open(files[0]) as f:
        return json.load(f)


def format_trends_block(trends: dict) -> str:
    if not trends:
        return ""
    lines = [f"INSTAGRAM TRENDS — {trends.get('collected_date', 'recent')} (last 30 days):"]
    lines.append("")

    audio = trends.get("trending_audio", [])
    if audio:
        lines.append("🎵 TRENDING AUDIO (use in Reels for algorithm boost):")
        for a in audio[:3]:
            lines.append(f"  • {a['track']} [{a['urgency'].upper()}] — {a['why']}")
        lines.append("")

    hooks = trends.get("trending_hooks", [])
    if hooks:
        lines.append("🪝 TRENDING HOOKS (formats getting high retention):")
        for h in hooks[:4]:
            lines.append(f"  • [{h['format']}] \"{h['hook']}\" → e.g. \"{h['example']}\"")
        lines.append("")

    topics = trends.get("trending_topics", [])
    if topics:
        lines.append("💡 TRENDING TOPICS (pain points resonating with barbers right now):")
        for t in topics[:4]:
            lines.append(f"  • {t['topic']}: {t['pain_point']} → Noble angle: {t['noble_angle']}")
        lines.append("")

    tags = trends.get("trending_hashtags", {})
    if tags:
        niche = tags.get("niche", [])
        mid   = tags.get("mid", [])
        geo   = tags.get("geo", [])
        lines.append(f"#️⃣  TOP HASHTAGS: {' '.join(niche[:3])} {' '.join(mid[:3])} {' '.join(geo[:2])}")
        lines.append("")

    insights = trends.get("algorithm_insights", [])
    if insights:
        lines.append("📊 ALGORITHM INSIGHTS:")
        for ins in insights[:2]:
            lines.append(f"  • {ins}")
        lines.append("")

    lines.append("INSTRUCTION: Use trending audio, hooks, and topics above to inform post concepts, hooks, and hashtags.")
    return "\n".join(lines)


def load_latest_hooks() -> dict:
    files = sorted(HOOKS_DIR.glob("hooks_*.json"), reverse=True)
    if not files:
        return {}
    with open(files[0]) as f:
        return json.load(f)


def format_hooks_block(hooks_data: dict) -> str:
    hooks = hooks_data.get("hooks", [])
    if not hooks:
        return ""
    lines = [f"REWRITTEN HOOKS — {hooks_data.get('generated_date', 'today')} (use THESE, not generic ones):"]
    lines.append("")
    for h in hooks:
        lines.append(f"  Day {h['day']} {h['weekday']} [{h['pillar']}]:")
        lines.append(f"    → RECOMMENDED: \"{h['recommended']}\"")
        lines.append(f"    → Why: {h['why']}")
        lines.append(f"    → Alt (pain point): \"{h['variations']['pain_point']}\"")
        lines.append(f"    → Alt (curiosity):  \"{h['variations']['curiosity_gap']}\"")
        lines.append("")
    lines.append("INSTRUCTION: Use the RECOMMENDED hook for each day's post hook field exactly as written.")
    return "\n".join(lines)


def load_noble_updates() -> list:
    if not UPDATES_FILE.exists():
        return []
    with open(UPDATES_FILE) as f:
        data = json.load(f)
    updates = data.get("updates", [])
    return sorted(updates, key=lambda u: u.get("priority", 99))


def format_updates_block(updates: list) -> str:
    if not updates:
        return ""

    lines = ["PRIORITY CONTENT — NOBLE RECENT UPDATES (use these as primary post topics this week):"]
    lines.append("")

    for u in updates:
        status_label = {"new": "🆕 NEW", "improved": "✨ IMPROVED", "coming_soon": "🔜 COMING SOON"}.get(
            u.get("status", ""), u.get("status", "").upper()
        )
        lines.append(f"[Priority {u.get('priority', '?')}] {status_label}: {u['feature_name']}")
        lines.append(f"  Launched : {u.get('launched_at', 'recently')}")
        lines.append(f"  Benefit  : {u['benefit']}")
        lines.append(f"  Angle    : {u['content_angle']}")
        lines.append("")

    lines.append(
        "INSTRUCTION: Assign at least one post per high-priority update (priority 1–3). "
        "Use the provided 'Angle' as the creative direction. "
        "Remaining posts can cover other pillars."
    )
    return "\n".join(lines)


def build_date_range(period: str):
    today = date.today()
    end = today + timedelta(days=6 if period == "weekly" else 29)
    return today.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")


def posts_count(period: str) -> int:
    return {"weekly": 6, "monthly": 24}.get(period, 6)


def build_system_prompt(updates: list, trends: dict, hooks_data: dict, learnings: dict) -> str:
    updates_block   = format_updates_block(updates)
    trends_block    = format_trends_block(trends)
    hooks_block     = format_hooks_block(hooks_data)
    learnings_block = format_learnings_block(learnings)

    priority_section  = f"\n\n{updates_block}"   if updates_block   else ""
    learnings_section = f"\n\n{learnings_block}"  if learnings_block else ""
    trends_section    = f"\n\n{trends_block}"     if trends_block    else ""
    hooks_section     = f"\n\n{hooks_block}"      if hooks_block     else ""

    return f"""You are the Content Strategist for Noble — a SaaS booking platform for barbershops.

{NOBLE_BRAND_CONTEXT}{learnings_section}{priority_section}{trends_section}{hooks_section}

Your job: produce actionable, platform-specific content plans that a social media manager can execute immediately.
Every post idea must be concrete — not "post about features" but "show a screen recording of the booking page loading on a phone, caption: Your client books at 11pm. You're already asleep. ✅".

If performance learnings are provided above, they represent REAL data from this account. Weight your post_type and pillar choices accordingly — not on assumptions.

Always output valid JSON. No markdown fences, no extra text — just the JSON object."""


def build_user_prompt(platform: str, period: str, focus: str, start_date: str, end_date: str, updates: list) -> str:
    fmt = PLATFORM_FORMATS[platform]
    focus_desc = CONTENT_FOCUS_DESCRIPTIONS[focus]
    count = posts_count(period)

    update_names = [u["feature_name"] for u in updates[:3]]
    priority_note = ""
    if update_names:
        priority_note = (
            f"\nPRIORITY: The first {min(len(update_names), 3)} posts should cover these recent Noble updates "
            f"(in order): {', '.join(update_names)}. "
            f"Tie each update post to the 'product' content pillar. "
            f"Remaining posts follow the '{focus}' focus.\n"
        )

    return f"""Create a {period} content plan for Noble on {platform.upper()}.

Period: {start_date} to {end_date}
Posts to plan: {count}
Content focus: {focus} — {focus_desc}
{priority_note}
Platform format rules for {platform}:
- Post types available: {', '.join(fmt['post_types'])}
- Caption length: {fmt['caption_length']}
- Hashtags: {fmt['hashtags']}
- Best posting times: {fmt['best_times']}
- Tone note: {fmt['tone_note']}

Return a JSON object with this exact structure:
{{
  "plan_meta": {{
    "platform": "{platform}",
    "period": "{period}",
    "focus": "{focus}",
    "start_date": "{start_date}",
    "end_date": "{end_date}",
    "total_posts": {count},
    "priority_updates_used": {json.dumps([u["feature_name"] for u in updates[:3]])}
  }},
  "posts": [
    {{
      "post_number": 1,
      "post_date": "YYYY-MM-DD",
      "post_type": "carousel | single image | reel | text post | ...",
      "content_pillar": "education | product | social_proof | engagement | promotional",
      "feature_update": "feature name if this post covers a noble_update, else null",
      "hook": "The opening line — must stop the scroll",
      "concept": "What this post shows or demonstrates (2–3 sentences)",
      "caption_outline": "Key points the caption should cover",
      "visual_direction": "What to show visually (mockup, screen recording, text card, etc.)",
      "animation_concept": "For 'animated post' type only: 2–3 sentences on what animates, the motion sequence, and why it fits this content. null for all other post types.",
      "cta": "Specific call to action for this post",
      "hashtags": ["tag1", "tag2"],
      "notes": "Any production notes or tips"
    }}
  ],
  "strategy_notes": "2–3 sentences on the overall approach for this plan"
}}"""


def generate_plan(platform: str, period: str, focus: str, updates: list) -> dict:
    client = get_client()
    start_date, end_date = build_date_range(period)
    trends     = load_latest_trends()
    hooks_data = load_latest_hooks()
    learnings  = load_learnings()

    print(f"Generating {period} content plan for {platform} (focus: {focus})...")
    print(f"Period: {start_date} → {end_date}")
    if updates:
        print(f"Priority updates injected: {len(updates)} ({', '.join(u['feature_name'] for u in updates[:3])}...)")
    if learnings:
        print(f"Learnings injected: {learnings.get('updated','?')} ({learnings.get('total_posts_analyzed',0)} posts analyzed)")
        print(f"  Top types:   {learnings.get('top_content_types',[])}")
        print(f"  Top pillars: {learnings.get('top_pillars',[])}")
    else:
        print("Learnings: none — run: python analyzer/post_audit.py to log post performance")
    if trends:
        print(f"Trends injected: {trends.get('collected_date', 'unknown date')}")
    if hooks_data:
        print(f"Hooks injected: {hooks_data.get('generated_date', 'unknown date')} ({len(hooks_data.get('hooks', []))} days)")
    else:
        print("Hooks: none found — run hook_writer.py first for better hooks")
    print()

    max_tokens = 16000 if period == "monthly" else 8192

    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=max_tokens,
        system=build_system_prompt(updates, trends, hooks_data, learnings),
        messages=[
            {
                "role": "user",
                "content": build_user_prompt(platform, period, focus, start_date, end_date, updates),
            }
        ],
    ) as stream:
        response_text = ""
        for text in stream.text_stream:
            print(text, end="", flush=True)
            response_text += text

    print("\n")
    text = response_text.strip()
    # Extract JSON from markdown code fences or find first { ... }
    import re as _re
    fence = _re.search(r"```(?:json)?\s*\n([\s\S]+?)\n```", text)
    if fence:
        text = fence.group(1).strip()
    elif text.startswith("{"):
        pass  # raw JSON, use as-is
    else:
        # Find outermost { ... } block
        start = text.find("{")
        end   = text.rfind("}") + 1
        if start != -1 and end > start:
            text = text[start:end]
    return json.loads(text)


def save_plan(plan: dict, output_dir: Path) -> Path:
    meta = plan["plan_meta"]
    filename = f"plan_{meta['platform']}_{meta['period']}_{meta['start_date']}.json"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / filename
    output_path.write_text(json.dumps(plan, indent=2, ensure_ascii=False))
    return output_path


def print_summary(plan: dict) -> None:
    meta = plan["plan_meta"]
    posts = plan.get("posts", [])
    notes = plan.get("strategy_notes", "")
    used = meta.get("priority_updates_used", [])

    print("=" * 60)
    print(f"CONTENT PLAN: {meta['platform'].upper()} / {meta['period'].upper()}")
    print(f"Period : {meta['start_date']} → {meta['end_date']}")
    print(f"Focus  : {meta['focus']} | Posts: {meta['total_posts']}")
    if used:
        print(f"Updates: {', '.join(used)}")
    print("=" * 60)

    for post in posts:
        update_tag = f" [UPDATE: {post['feature_update']}]" if post.get("feature_update") else ""
        print(f"\n[{post['post_date']}] Post #{post['post_number']} — {post['post_type'].upper()}{update_tag}")
        print(f"  Pillar : {post['content_pillar']}")
        print(f"  Hook   : {post['hook']}")
        print(f"  Concept: {post['concept'][:120]}...")
        print(f"  CTA    : {post['cta']}")

    if notes:
        print(f"\nStrategy: {notes}")

    print("=" * 60)


def main() -> None:
    parser = argparse.ArgumentParser(description="Noble SMM Strategist — content plan generator")
    parser.add_argument("--platform", choices=["instagram", "tiktok", "telegram"], default="instagram")
    parser.add_argument("--period", choices=["weekly", "monthly"], default="weekly")
    parser.add_argument("--focus", choices=list(CONTENT_FOCUS_DESCRIPTIONS.keys()), default="mixed")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).parent.parent / "output",
    )
    parser.add_argument("--no-save", action="store_true")
    parser.add_argument(
        "--no-updates",
        action="store_true",
        help="Ignore noble_updates.json and generate plan without priority topics",
    )

    args = parser.parse_args()

    updates = [] if args.no_updates else load_noble_updates()
    if updates and not args.no_updates:
        print(f"Loaded {len(updates)} Noble updates from data/noble_updates.json")

    plan = generate_plan(args.platform, args.period, args.focus, updates)
    print_summary(plan)

    if not args.no_save:
        saved_path = save_plan(plan, args.output)
        print(f"\nPlan saved to: {saved_path}")


if __name__ == "__main__":
    import os as _os
    if not _os.environ.get("_NOBLE_ORCHESTRATED"):
        print("\n  Run via orchestrator: python orchestrator.py --mode create")
        print("  Direct execution is allowed but not recommended.\n")
    main()
