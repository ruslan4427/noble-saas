#!/usr/bin/env python3
"""
Noble Week Reels Generator
Generates 7 Reels + 7 Feed posts for a full Instagram week.

Usage:
  python generate_week_reels.py
  python generate_week_reels.py --reels-only
  python generate_week_reels.py --posts-only
"""

import argparse
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

ROOT        = Path(__file__).parent
DESIGNER    = ROOT / "designer"
sys.path.insert(0, str(ROOT))

from config import NOBLE_IMAGES_DIR, DESKTOP_WEEK_CONTENT, MARKETING_WEEK_CONTENT

OUTPUT_VIDEOS  = ROOT / "output" / "videos"
OUTPUT_IMAGES  = ROOT / "output" / "images"
LAPTOP_DIR     = NOBLE_IMAGES_DIR
WEEK_CONTENT   = DESKTOP_WEEK_CONTENT
MARKETING_WEEK = MARKETING_WEEK_CONTENT

# ── Week Content Plan — loaded from week_plan.json ───────────────────────────
# Edit week_plan.json to change content without touching this file.

_WEEK_PLAN_FILE = ROOT / "week_plan.json"

def _load_week_plan() -> list:
    if _WEEK_PLAN_FILE.exists():
        try:
            return json.loads(_WEEK_PLAN_FILE.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"[WARNING] Could not load {_WEEK_PLAN_FILE.name}: {e} — using fallback")
    # Fallback: minimal 7-day plan so the script doesn't crash if JSON is missing
    return [
        {"day": i, "weekday": d, "content_type": "reel",
         "reel_type": "reel_typewriter_bokeh",
         "reel_overrides": {"line1": "Noble", "line2": "Booking", "line3": "Platform.",
                            "eyebrow": "Noble", "subtext": "Book online.", "cta": "Try Free"},
         "post_type": "a",
         "post_overrides": {"hook": "Noble", "eyebrow": "Noble", "body": "Noble booking.", "cta": "Try Free"},
         "music": ""}
        for i, d in enumerate(
            ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], start=1)
    ]

WEEK_PLAN = _load_week_plan()

# Legacy list kept for reference only — actual plan is in week_plan.json
_WEEK_PLAN_LEGACY = [
    {
        "day": 1, "weekday": "Monday",
        "content_type": "reel",
        "pillar": "Awareness",
        "goal": "Hook new audience — show the problem barbers face",
        "reel_type": "reel_typewriter_bokeh",
        "reel_overrides": {
            "line1":   "Most barbers",
            "line2":   "get this",
            "line3":   "wrong.",
            "eyebrow": "Noble Booking Platform",
            "subtext": "Your shop should book itself — automatically.",
            "cta":     "Try Free for 14 Days",
        },
        "post_type": "a",
        "post_overrides": {
            "hook":    "Stop chasing clients. Let them come to you.",
            "eyebrow": "Booking Automation",
            "body":    "With Noble, your barbershop gets a booking page that works 24/7. Clients pick their slot, get a confirmation, and show up — no DMs, no calls.",
            "cta":     "Start Free Trial",
        },
        "music": "Money Maker — Ludacris ft. Pharrell",
    },
    {
        "day": 2, "weekday": "Tuesday",
        "content_type": "carousel",
        "pillar": "Education",
        "goal": "Teach barbers 5 signs they need booking software — saves & shares",
        "slides": [
            {"title": "5 signs your barbershop needs booking software", "body": "Swipe to see if this is you →"},
            {"title": "1. You take bookings by DM", "body": "Clients message you, you reply hours later. You lose bookings while you're cutting."},
            {"title": "2. You have no-shows every week", "body": "No reminder system = clients forget. Noble sends automatic SMS reminders."},
            {"title": "3. You work late answering texts", "body": "Your evenings belong to you. Not to managing a calendar."},
            {"title": "4. Double-bookings happen", "body": "Two clients, same slot. Noble prevents this automatically in real time."},
            {"title": "5. You have no idea what you made this month", "body": "Noble tracks every booking and payment. Dashboard always ready."},
            {"title": "If you nodded at 2+", "body": "Try Noble free for 14 days. noblelink.app", "cta": True},
        ],
        "reel_type": "reel_counter",
        "reel_overrides": {
            "headline_line1": "Numbers",
            "headline_line2": "don't lie.",
            "eyebrow": "This Month's Stats",
            "subtext": "Noble tracks every booking, payment, and no-show automatically.",
            "cta":     "See Your Numbers Free",
        },
        "post_type": "d",
        "post_overrides": {
            "hook":    "47 bookings. $3,240 revenue. 0 no-shows. This month.",
            "eyebrow": "Monthly Report",
            "body":    "Noble gives you a live dashboard with every metric that matters. Bookings, revenue, retention — all in one place.",
            "cta":     "Start Free Trial",
        },
        "music": "EVERYTHING HALLELUJAH — Trending Audio",
    },
    {
        "day": 3, "weekday": "Wednesday",
        "content_type": "reel",
        "pillar": "Product Demo",
        "goal": "Show how Noble works in real time — demo converts",
        "reel_type": "reel_notification",
        "reel_overrides": {
            "headline_line1": "Clients book",
            "headline_line2": "while you work.",
            "eyebrow": "Automated Booking",
            "subtext": "Instant confirmation. SMS reminder. Zero no-shows.",
            "cta":     "Start Booking Today",
        },
        "post_type": "c",
        "post_overrides": {
            "hook":    "You're in the middle of a cut. A client just booked for tomorrow.",
            "eyebrow": "Auto Confirmations",
            "body":    "Noble sends booking confirmations and SMS reminders automatically. Your clients never forget their appointment.",
            "cta":     "Try for Free",
        },
        "music": "Material Lover — Sienna Spiro",
    },
    {
        "day": 4, "weekday": "Thursday",
        "content_type": "feed_post",
        "pillar": "Social Proof",
        "goal": "Single strong testimonial — trust builder for mid-week",
        "reel_type": "reel_calendar",
        "reel_overrides": {
            "headline_line1": "Your calendar,",
            "headline_line2": "always full.",
            "eyebrow": "Noble Calendar",
            "subtext": "Spots fill automatically. No phone calls. No DMs.",
            "cta":     "Fill Your Calendar",
        },
        "post_type": "e",
        "post_overrides": {
            "hook":    "What does a full calendar feel like? Ask Noble users.",
            "eyebrow": "Calendar Management",
            "body":    "Noble manages your schedule in real time. Clients see only open slots — no double bookings, no gaps, no stress.",
            "cta":     "Start Free Trial",
        },
        "music": "Money Maker — Ludacris ft. Pharrell",
    },
    {
        "day": 5, "weekday": "Friday",
        "content_type": "reel",
        "pillar": "Promotional",
        "goal": "Friday energy — push free trial CTA hard",
        "reel_type": "reel_typewriter_bokeh",
        "reel_overrides": {
            "line1":   "Your shop",
            "line2":   "never",
            "line3":   "sleeps.",
            "eyebrow": "24/7 Online Booking",
            "subtext": "If you own a barbershop, your booking page should never sleep.",
            "cta":     "Go Live in Minutes",
        },
        "post_type": "b",
        "post_overrides": {
            "hook":    "Your shop is open. Even when you're not.",
            "eyebrow": "24/7 Booking",
            "body":    "Noble gives you a custom booking page at noblelink.app/yourshop. Share it once — clients book anytime, day or night.",
            "cta":     "Get Your Page",
        },
        "music": "Dracula (JENNIE Remix) — Tame Impala",
    },
    {
        "day": 6, "weekday": "Saturday",
        "content_type": "reel",
        "pillar": "Weekend Stats",
        "goal": "Saturday reach peak — high traffic day for barbers",
        "reel_type": "reel_counter",
        "reel_overrides": {
            "headline_line1": "Zero calls.",
            "headline_line2": "47 bookings.",
            "eyebrow": "Weekend Report",
            "subtext": "Saturday. You cut hair. Noble handled the schedule.",
            "cta":     "Try Free for 14 Days",
        },
        "post_type": "f",
        "post_overrides": {
            "hook":    "It's Saturday. You cut 12 heads. Took zero phone calls.",
            "eyebrow": "Weekend Wins",
            "body":    "Noble's automated scheduling means your weekends are for cutting — not managing a calendar. Let the software do the admin.",
            "cta":     "Start Free Trial",
        },
        "music": "EVERYTHING HALLELUJAH — Trending Audio",
    },
    {
        "day": 7, "weekday": "Sunday",
        "content_type": "story",
        "pillar": "Engagement",
        "goal": "Sunday poll / question sticker — warm up existing followers",
        "story_brief": {
            "format":   "1080x1920 PNG",
            "duration": "5-7 sec static",
            "elements": [
                "Background: dark brown #1a1208",
                "Question sticker: 'Do you take bookings by DM or have a booking page?'",
                "Options: 'DM 📱' / 'Booking page ✅'",
                "Noble logo top-left",
                "CTA at bottom: 'Link in bio → noblelink.app'",
            ],
            "note": "Post manually via Instagram app — use poll sticker for engagement",
        },
        "reel_type": "reel_notification",
        "reel_overrides": {
            "headline_line1": "14 days free.",
            "headline_line2": "No excuses.",
            "eyebrow": "Free Trial — No Card Needed",
            "subtext": "Start today. Your booking page goes live in under 5 minutes.",
            "cta":     "Start Free Trial Now",
        },
        "post_type": "a",
        "post_overrides": {
            "hook":    "14 days. No credit card. No risk. Just a full calendar.",
            "eyebrow": "Free Trial",
            "body":    "Try Noble free for 14 days. Set up your booking page in minutes, invite your first client, and watch the calendar fill itself.",
            "cta":     "Start Free Trial Now",
        },
        "music": "Material Lover — Sienna Spiro",
    },
]


# ── Generators ────────────────────────────────────────────────────────────────

DAY_FOLDERS = [
    "Day01_Monday", "Day02_Tuesday", "Day03_Wednesday", "Day04_Thursday",
    "Day05_Friday", "Day06_Saturday", "Day07_Sunday",
]

# Maps reel_type → filename stem stored in day folder
REEL_STEM = {
    "reel_typewriter":       "reel_reel_typewriter",
    "reel_typewriter_bokeh": "reel_reel_typewriter",
    "reel_counter":          "reel_reel_counter",
    "reel_notification":     "reel_reel_notification",
    "reel_calendar":         "reel_reel_calendar",
}


def generate_reel(day_plan: dict, ts: str, alpha: bool = False):
    from designer import css_animator
    from designer.template_factory import get_week_template
    try:
        overrides = day_plan["reel_overrides"]
        resolved_type = get_week_template(day_plan["reel_type"])
        if resolved_type != day_plan["reel_type"]:
            print(f"  Template rotation: {day_plan['reel_type']} → {resolved_type}")
        path = css_animator.generate(
            template_type=resolved_type,
            post_number=None,
            overrides=overrides,
            alpha=alpha,
        )
        # Rename to include weekday
        weekday = day_plan["weekday"].lower()
        ext = path.suffix  # .mp4 or .webm
        new_name = path.parent / f"noble_week_{day_plan['day']}_{weekday}_{day_plan['reel_type']}_{ts}{ext}"
        path.rename(new_name)
        laptop = LAPTOP_DIR / new_name.name
        shutil.copy(new_name, laptop)

        # Copy to Desktop day folder (used by video_bg_agent.py)
        day_folder = WEEK_CONTENT / DAY_FOLDERS[day_plan["day"] - 1]
        if day_folder.exists():
            stem = REEL_STEM.get(day_plan["reel_type"], "reel_reel_typewriter")
            day_dest = day_folder / f"{stem}{ext}"
            for old_ext in (".mp4", ".webm"):
                old_file = day_folder / f"{stem}{old_ext}"
                if old_file.exists() and old_file != day_dest:
                    old_file.unlink()
            shutil.copy(new_name, day_dest)

        # Copy to marketing_system/week_content/ as reel_video_bg.mp4 (read by poster.py)
        mkt_folder = MARKETING_WEEK / DAY_FOLDERS[day_plan["day"] - 1]
        mkt_folder.mkdir(parents=True, exist_ok=True)
        mkt_dest = mkt_folder / f"reel_video_bg{ext}"
        shutil.copy(new_name, mkt_dest)
        print(f"  [REEL ✓] Day {day_plan['day']} {day_plan['weekday']}: {new_name.name}")
        print(f"           → {mkt_dest}")

        return new_name
    except Exception as e:
        import traceback; traceback.print_exc()
        print(f"  [REEL ✗] Day {day_plan['day']}: {e}")
        return None


def generate_post(day_plan: dict, ts: str):
    from designer.template_renderer import render_template, FILLERS, TEMPLATE_FILES
    try:
        post_type = day_plan["post_type"]
        overrides = day_plan["post_overrides"]
        variables = FILLERS[post_type](None, overrides)
        html = render_template(TEMPLATE_FILES[post_type], variables)

        from playwright.sync_api import sync_playwright
        OUTPUT_IMAGES.mkdir(parents=True, exist_ok=True)
        LAPTOP_DIR.mkdir(parents=True, exist_ok=True)

        weekday = day_plan["weekday"].lower()
        filename = f"noble_week_{day_plan['day']}_{weekday}_post_{post_type}_{ts}.png"
        out_path    = OUTPUT_IMAGES / filename
        laptop_path = LAPTOP_DIR / filename

        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1080, "height": 1080})
            page.set_content(html, wait_until="networkidle")
            page.screenshot(path=str(out_path), full_page=False)
            browser.close()

        shutil.copy(out_path, laptop_path)

        # Copy to marketing_system/week_content/ as feed_post.png (read by poster.py)
        mkt_folder = MARKETING_WEEK / DAY_FOLDERS[day_plan["day"] - 1]
        mkt_folder.mkdir(parents=True, exist_ok=True)
        shutil.copy(out_path, mkt_folder / "feed_post.png")
        print(f"  [POST ✓] Day {day_plan['day']} {day_plan['weekday']}: {filename}")
        print(f"           → {mkt_folder / 'feed_post.png'}")
        return out_path
    except Exception as e:
        print(f"  [POST ✗] Day {day_plan['day']}: {e}")
        return None


def generate_carousel(day_plan: dict, ts: str) -> list:
    """Render each carousel slide as a 1080x1080 PNG."""
    slides = day_plan.get("slides", [])
    if not slides:
        print(f"  [CAROUSEL ✗] Day {day_plan['day']}: no slides defined")
        return []

    from playwright.sync_api import sync_playwright
    OUTPUT_IMAGES.mkdir(parents=True, exist_ok=True)
    LAPTOP_DIR.mkdir(parents=True, exist_ok=True)

    weekday = day_plan["weekday"].lower()
    out_paths = []

    with sync_playwright() as p:
        browser = p.chromium.launch()
        for i, slide in enumerate(slides, start=1):
            is_cta = slide.get("cta", False)
            bg_color  = "#C9A84C" if is_cta else "#1a1208"
            text_color = "#1a1208" if is_cta else "#f5f0e8"
            body_color = "#1a1208" if is_cta else "#c8b89a"
            html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1080px; height: 1080px; overflow: hidden;
    background: {bg_color};
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    padding: 80px;
    font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
  }}
  .slide-num {{
    position: absolute; top: 48px; right: 60px;
    font-size: 28px; color: {"#1a120880" if is_cta else "#ffffff40"};
    font-weight: 600; letter-spacing: 0.05em;
  }}
  .logo {{
    position: absolute; top: 48px; left: 60px;
    font-size: 32px; font-weight: 800; letter-spacing: 0.08em;
    color: {"#1a1208" if is_cta else "#C9A84C"};
  }}
  h1 {{
    font-size: 72px; font-weight: 800; line-height: 1.1;
    color: {text_color}; text-align: center; margin-bottom: 40px;
  }}
  p {{
    font-size: 38px; line-height: 1.5;
    color: {body_color}; text-align: center; max-width: 860px;
  }}
</style></head><body>
  <div class="logo">NOBLE</div>
  <div class="slide-num">{i}/{len(slides)}</div>
  <h1>{slide['title']}</h1>
  <p>{slide['body']}</p>
</body></html>"""

            page = browser.new_page(viewport={"width": 1080, "height": 1080})
            page.set_content(html, wait_until="networkidle")
            filename = f"noble_week_{day_plan['day']}_{weekday}_carousel_{i:02d}_{ts}.png"
            out_path = OUTPUT_IMAGES / filename
            page.screenshot(path=str(out_path), full_page=False)
            page.close()
            shutil.copy(out_path, LAPTOP_DIR / filename)

            # Copy to marketing_system/week_content/ as carousel_slide_01.png etc.
            mkt_folder = MARKETING_WEEK / DAY_FOLDERS[day_plan["day"] - 1]
            mkt_folder.mkdir(parents=True, exist_ok=True)
            shutil.copy(out_path, mkt_folder / f"carousel_slide_{i:02d}.png")
            out_paths.append(out_path)

        browser.close()

    print(f"  [CAROUSEL ✓] Day {day_plan['day']} {day_plan['weekday']}: {len(out_paths)} slides")
    for p in out_paths:
        print(f"               → {p.name}")
    return out_paths


def print_story_brief(day_plan: dict, ts: str):
    """Print story brief and save it as a text file for manual posting."""
    brief = day_plan.get("story_brief", {})
    weekday = day_plan["weekday"].lower()
    print(f"  [STORY  ⚠] Day {day_plan['day']} {day_plan['weekday']}: post manually via Instagram app")
    print(f"    Format:   {brief.get('format', '1080x1920 PNG')}")
    print(f"    Duration: {brief.get('duration', '5-7 sec static')}")
    for el in brief.get("elements", []):
        print(f"    • {el}")
    if brief.get("note"):
        print(f"    NOTE: {brief['note']}")

    # Save brief to file
    LAPTOP_DIR.mkdir(parents=True, exist_ok=True)
    brief_file = LAPTOP_DIR / f"noble_week_{day_plan['day']}_{weekday}_story_brief_{ts}.txt"
    lines = [
        f"Day {day_plan['day']} {day_plan['weekday']} — Story Brief",
        f"Pillar: {day_plan.get('pillar', '')}",
        f"Goal: {day_plan.get('goal', '')}",
        f"Format: {brief.get('format', '')}",
        f"Duration: {brief.get('duration', '')}",
        "",
        "Elements:",
    ] + [f"  • {el}" for el in brief.get("elements", [])]
    if brief.get("note"):
        lines += ["", f"Note: {brief['note']}"]
    brief_file.write_text("\n".join(lines))
    print(f"               → {brief_file.name}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reels-only", action="store_true")
    parser.add_argument("--posts-only", action="store_true")
    parser.add_argument("--alpha", action="store_true",
                        help="Render reels with transparent background (ProRes 4444 MOV alpha)")
    args = parser.parse_args()

    do_reels = not args.posts_only
    do_posts = not args.reels_only

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    OUTPUT_VIDEOS.mkdir(parents=True, exist_ok=True)
    OUTPUT_IMAGES.mkdir(parents=True, exist_ok=True)
    LAPTOP_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 64)
    print("  NOBLE WEEK REELS GENERATOR")
    print("=" * 64)

    music_schedule = []
    # task tracking: auto-generated vs manual
    auto_done  = []   # (day, weekday, type, detail)
    manual_todo = []  # (day, weekday, type, note)

    for day in WEEK_PLAN:
        ctype = day.get("content_type", "reel")
        print(f"\n── Day {day['day']} · {day['weekday']} [{ctype.upper()}] ─────────────")
        print(f"   Pillar: {day.get('pillar','')}  |  Goal: {day.get('goal','')}")

        # Always generate the reel animation for every day
        if do_reels:
            result = generate_reel(day, ts, alpha=args.alpha)
            if result:
                auto_done.append((day["day"], day["weekday"], "reel", result.name))

        # Route post-type generation based on content_type
        if do_posts:
            if ctype == "carousel":
                paths = generate_carousel(day, ts)
                if paths:
                    auto_done.append((day["day"], day["weekday"], "carousel", f"{len(paths)} slides"))
                # Also generate the companion feed post
                result = generate_post(day, ts)
                if result:
                    auto_done.append((day["day"], day["weekday"], "feed_post", result.name))

            elif ctype == "story":
                print_story_brief(day, ts)
                manual_todo.append((day["day"], day["weekday"], "story",
                                    "Post manually via Instagram app with poll sticker"))
                # Also generate the companion feed post
                result = generate_post(day, ts)
                if result:
                    auto_done.append((day["day"], day["weekday"], "feed_post", result.name))

            else:
                # reel / feed_post — standard post render
                result = generate_post(day, ts)
                if result:
                    auto_done.append((day["day"], day["weekday"], "feed_post", result.name))

        music_schedule.append(
            f"  Day {day['day']} ({day['weekday']}): {day['music']}"
        )

    # ── Music Schedule ────────────────────────────────────────────────────────
    print("\n" + "=" * 64)
    print("  MUSIC SCHEDULE")
    print("=" * 64)
    for line in music_schedule:
        print(line)

    # ── Weekly Task Summary ───────────────────────────────────────────────────
    print("\n" + "=" * 64)
    print("  WEEKLY TASK SUMMARY")
    print("=" * 64)
    print(f"\n  ✓ Auto-generated ({len(auto_done)} items):")
    for day_num, weekday, ctype, detail in auto_done:
        print(f"    Day {day_num} {weekday:9s}  [{ctype:10s}]  {detail}")

    if manual_todo:
        print(f"\n  ⚠ Manual posting needed ({len(manual_todo)} items):")
        for day_num, weekday, ctype, note in manual_todo:
            print(f"    Day {day_num} {weekday:9s}  [{ctype:10s}]  {note}")

    content_counts = {}
    for _, _, ctype, _ in auto_done:
        content_counts[ctype] = content_counts.get(ctype, 0) + 1
    summary_parts = [f"{v} {k}{'s' if v > 1 else ''}" for k, v in content_counts.items()]
    print(f"\n  Total auto: {', '.join(summary_parts)}")
    if manual_todo:
        mc = {}
        for _, _, ctype, _ in manual_todo:
            mc[ctype] = mc.get(ctype, 0) + 1
        mp = [f"{v} {k}{'s' if v > 1 else ''}" for k, v in mc.items()]
        print(f"  Total manual: {', '.join(mp)}")

    print("\n" + "=" * 64)
    print(f"  Output videos: {OUTPUT_VIDEOS}")
    print(f"  Output images: {OUTPUT_IMAGES}")
    print(f"  Desktop:       {LAPTOP_DIR}")
    print("=" * 64 + "\n")


if __name__ == "__main__":
    main()
