#!/usr/bin/env python3
"""
Noble Template Factory
Rotates reel visual themes week-by-week so each week looks distinct.

Usage:
  from designer.template_factory import get_week_template

  # Returns the template name for day 1 this ISO week
  template = get_week_template("reel_typewriter_bokeh")
  # e.g. "reel_typewriter_aurora"

  # Or get the full weekly rotation:
  from designer.template_factory import get_week_rotation
  rotation = get_week_rotation()
  # Returns dict: {day: template_name, ...}

Override via env var: NOBLE_WEEK_THEME=bokeh  (always use that theme)
"""

import os
from datetime import date

# Available visual variants per base template type.
# Order matters — we rotate through this list by ISO week number.
TYPEWRITER_VARIANTS = [
    "reel_typewriter_bokeh",     # warm gold bokeh, classic Noble look
    "reel_typewriter_aurora",    # dark gradient, aurora glow
    "reel_typewriter_particles", # floating particles, techy
    "reel_typewriter_geo",       # geometric shapes, modern
    "reel_typewriter_grid3d",    # 3D grid, premium
    "reel_typewriter_blobs",     # liquid blobs, trendy
    "reel_typewriter_barber",    # barbershop-themed background
]

# Types that only have one variant — returned as-is
SINGLE_VARIANT = {
    "reel_counter",
    "reel_notification",
    "reel_calendar",
    "reel_typewriter",  # base (non-bokeh) fallback
}

# Per-day template preference: which base type each day prefers
# (matches week_plan.json defaults — factory only changes the visual variant)
DAY_BASE_TEMPLATE = {
    1: "reel_typewriter_bokeh",
    2: "reel_counter",
    3: "reel_notification",
    4: "reel_calendar",
    5: "reel_typewriter_bokeh",
    6: "reel_counter",
    7: "reel_notification",
}


def _current_iso_week() -> int:
    """Return ISO week number (1-52)."""
    return date.today().isocalendar().week


def get_week_template(base_template: str, week: int | None = None) -> str:
    """
    Given a base template name, return the visual variant to use this week.

    Args:
        base_template: e.g. "reel_typewriter_bokeh", "reel_counter"
        week: ISO week number override (default: current week)

    Returns:
        Template name string, e.g. "reel_typewriter_aurora"
    """
    # Env override: NOBLE_WEEK_THEME=bokeh → always use reel_typewriter_bokeh
    theme_override = os.environ.get("NOBLE_WEEK_THEME")
    if theme_override:
        candidate = f"reel_typewriter_{theme_override}"
        if candidate in TYPEWRITER_VARIANTS:
            return candidate

    # Non-rotating types — return unchanged
    if base_template in SINGLE_VARIANT:
        return base_template

    # All typewriter variants rotate together
    if "typewriter" in base_template:
        w = week if week is not None else _current_iso_week()
        return TYPEWRITER_VARIANTS[w % len(TYPEWRITER_VARIANTS)]

    return base_template


def get_week_rotation(week: int | None = None) -> dict[int, str]:
    """
    Return the full 7-day template rotation for the given week.

    Returns:
        {day_number: template_name, ...}
    """
    w = week if week is not None else _current_iso_week()
    return {
        day: get_week_template(base, week=w)
        for day, base in DAY_BASE_TEMPLATE.items()
    }


def print_week_rotation(week: int | None = None):
    w = week if week is not None else _current_iso_week()
    rotation = get_week_rotation(w)
    from datetime import date as _d
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    print(f"\nWeek {w} template rotation:")
    print(f"{'─' * 52}")
    for day, tmpl in rotation.items():
        print(f"  Day {day} {days[day-1]:12s} → {tmpl}")
    print(f"{'─' * 52}")
    print(f"Override: NOBLE_WEEK_THEME=bokeh python orchestrator.py\n")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Show Noble weekly template rotation")
    parser.add_argument("--week", type=int, default=None, help="ISO week number (default: current)")
    args = parser.parse_args()
    print_week_rotation(args.week)
