#!/usr/bin/env python3
"""
Noble Make Reel — full pipeline for a single day.

1. Generate alpha .mov animation (bokeh visible, transparent bg)
2. Composite over barbershop video (70% darkening)
3. Mix voiceover + music
4. Save as reel_final.mp4 in the day folder

Usage:
  python make_reel.py --day 1
  python make_reel.py --day 3 --preview
  python make_reel.py --day 1 --no-composite   # animation only
"""

import argparse
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))

from config import DESKTOP_WEEK_CONTENT
WEEK_CONTENT = DESKTOP_WEEK_CONTENT
VENV_PYTHON  = ROOT / "venv" / "bin" / "python"

DAY_FOLDERS = [
    "Day01_Monday", "Day02_Tuesday", "Day03_Wednesday", "Day04_Thursday",
    "Day05_Friday",  "Day06_Saturday", "Day07_Sunday",
]

# Per-day animation config — loaded from week_plan.json (shared with generate_week_reels.py)
def _load_day_config() -> dict:
    plan_file = ROOT / "week_plan.json"
    if plan_file.exists():
        try:
            week_plan = json.loads(plan_file.read_text(encoding="utf-8"))
            return {
                entry["day"]: {
                    "template": entry["reel_type"],
                    "overrides": entry["reel_overrides"],
                }
                for entry in week_plan
            }
        except Exception as e:
            print(f"[WARNING] Could not load week_plan.json: {e} — using defaults")
    # Minimal fallback
    return {
        i: {"template": "reel_typewriter_bokeh",
            "overrides": {"line1": "Noble", "line2": "Booking", "line3": "Platform.",
                          "eyebrow": "Noble", "subtext": "Book online.", "cta": "Try Free"}}
        for i in range(1, 8)
    }

DAY_CONFIG = _load_day_config()

ANIM_STEM = {
    "reel_typewriter_bokeh": "reel_reel_typewriter",
    "reel_counter":          "reel_reel_counter",
    "reel_notification":     "reel_reel_notification",
    "reel_calendar":         "reel_reel_calendar",
}


def generate_animation(day: int, day_folder: Path) -> Path:
    from designer import css_animator
    from designer.template_factory import get_week_template

    cfg      = DAY_CONFIG[day]
    template = get_week_template(cfg["template"])  # rotate variant each week
    overrides = cfg["overrides"]

    if template != cfg["template"]:
        print(f"  Template rotation: {cfg['template']} → {template}")
    print(f"  Generating alpha animation: {template}")
    path = css_animator.generate(
        template_type=template,
        post_number=None,
        overrides=overrides,
        alpha=True,
    )

    stem = ANIM_STEM.get(template, "reel_reel_typewriter")
    dest = day_folder / f"{stem}{path.suffix}"
    shutil.copy(path, dest)
    print(f"  ✓ Animation saved → {dest.name}  ({dest.stat().st_size // 1024} KB)")
    return dest


def composite_video(day: int, preview: bool = False) -> bool:
    import subprocess, sys as _sys
    cmd = [
        _sys.executable if Path(_sys.executable).name != "python" else "python3",
        str(ROOT / "video_bg_agent.py"),
        "--day", str(day),
        "--force",
    ]
    if preview:
        cmd.append("--preview")
    result = subprocess.run(cmd)
    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(description="Noble Make Reel — single day full pipeline")
    parser.add_argument("--day",          type=int, required=True, choices=range(1, 8))
    parser.add_argument("--preview",      action="store_true", help="Open result in QuickTime")
    parser.add_argument("--no-composite", action="store_true", help="Generate animation only, skip composite")
    args = parser.parse_args()

    day        = args.day
    day_folder = WEEK_CONTENT / DAY_FOLDERS[day - 1]

    if not day_folder.exists():
        print(f"ERROR: {day_folder} does not exist")
        sys.exit(1)

    print("=" * 56)
    print(f"  NOBLE MAKE REEL — Day {day} ({DAY_FOLDERS[day - 1]})")
    print("=" * 56)

    # Step 1 — animation
    anim_path = generate_animation(day, day_folder)

    if args.no_composite:
        print(f"\n  [--no-composite] Skipping video composite.")
        print(f"  Animation: {anim_path}")
        return

    # Step 2 — composite
    print(f"\n  Compositing with barbershop video (70% darkening)...")
    ok = composite_video(day, preview=args.preview)

    if not ok:
        print("  ✗ Composite failed")
        sys.exit(1)

    # Step 3 — copy to reel_final.mp4
    src  = day_folder / "reel_video_bg.mp4"
    dest = day_folder / "reel_final.mp4"
    shutil.copy(src, dest)
    print(f"  ✓ reel_final.mp4 saved ({dest.stat().st_size // 1024} KB)")

    if args.preview:
        import subprocess
        subprocess.Popen(["open", str(dest)])

    print("\n" + "=" * 56)
    print(f"  DONE → {dest}")
    print("=" * 56 + "\n")


if __name__ == "__main__":
    main()
