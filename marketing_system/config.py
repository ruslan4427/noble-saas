"""
Noble Marketing System — central path config.
All scripts import paths from here instead of hardcoding ~/Desktop/Noble Images/.

Override via environment variables:
  NOBLE_IMAGES_DIR   — default: ~/Desktop/Noble Images
  NOBLE_WEEK_CONTENT — default: ~/Desktop/Noble Images/Week Content
"""
import os
from pathlib import Path

ROOT = Path(__file__).parent

# Desktop working folder (all generated assets go here for review)
NOBLE_IMAGES_DIR = Path(
    os.environ.get("NOBLE_IMAGES_DIR") or
    Path.home() / "Desktop" / "Noble Images"
)

# Subfolder with 7-day content ready for posting
DESKTOP_WEEK_CONTENT = Path(
    os.environ.get("NOBLE_WEEK_CONTENT") or
    NOBLE_IMAGES_DIR / "Week Content"
)

# Templates_Etalon reference folder
TEMPLATES_ETALON = NOBLE_IMAGES_DIR / "Templates_Etalon"

# marketing_system/week_content/ — source of truth for GitHub Actions
MARKETING_WEEK_CONTENT = ROOT / "week_content"

# Day folder names
DAY_FOLDERS = [
    "Day01_Monday", "Day02_Tuesday", "Day03_Wednesday", "Day04_Thursday",
    "Day05_Friday",  "Day06_Saturday", "Day07_Sunday",
]
