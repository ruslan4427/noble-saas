#!/usr/bin/env python3
"""
Noble Instagram Poster — standalone, no MCP needed.
Reads content from marketing_system/week_content/DayXX/ and posts to Instagram.

Usage:
  python poster.py --day 1 --type reel
  python poster.py --day 2 --type feed
  python poster.py --day 7 --type reel

Environment variables (set as GitHub Secrets or in .env):
  IG_USERNAME       — Instagram login
  IG_PASSWORD       — Instagram password
  IG_SESSION_JSON   — contents of session.json (optional, avoids re-login)
"""

import argparse
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).parent
load_dotenv(ROOT.parent / ".env")

DAY_FOLDERS = [
    "Day01_Monday", "Day02_Tuesday", "Day03_Wednesday", "Day04_Thursday",
    "Day05_Friday", "Day06_Saturday", "Day07_Sunday",
]

# Content lives in marketing_system/week_content/ (committed to repo)
WEEK_CONTENT = ROOT / "week_content"
SESSION_FILE = ROOT / "mcp_instagram" / "session.json"


def get_day_folder(day_number: int) -> Path:
    folder = WEEK_CONTENT / DAY_FOLDERS[day_number - 1]
    if not folder.exists():
        print(f"ERROR: {folder} does not exist")
        sys.exit(1)
    return folder


def find_file(folder: Path, pattern: str) -> Path | None:
    files = sorted(folder.glob(pattern), key=lambda p: p.stat().st_mtime, reverse=True)
    return files[0] if files else None


def read_caption(folder: Path) -> str:
    caption_file = folder / "caption.txt"
    if caption_file.exists():
        return caption_file.read_text(encoding="utf-8").strip()
    return "Book your next cut online. Fast, simple, professional.\n\nnoblelink.app"


def login() -> object:
    from instagrapi import Client

    username = os.environ.get("IG_USERNAME")
    password = os.environ.get("IG_PASSWORD")
    session_json = os.environ.get("IG_SESSION_JSON")

    if not username or not password:
        print("ERROR: IG_USERNAME and IG_PASSWORD must be set")
        sys.exit(1)

    cl = Client()

    # Try loading session from env var (GitHub Secret) or file
    if session_json:
        tmp_session = ROOT / "_session_tmp.json"
        tmp_session.write_text(session_json)
        try:
            cl.load_settings(tmp_session)
            cl.login(username, password)
            cl.dump_settings(SESSION_FILE)
            tmp_session.unlink(missing_ok=True)
            print("  Logged in via session (env)")
            return cl
        except Exception as e:
            print(f"  Session login failed ({e}), trying fresh login...")
            tmp_session.unlink(missing_ok=True)

    if SESSION_FILE.exists():
        try:
            cl.load_settings(SESSION_FILE)
            cl.login(username, password)
            cl.dump_settings(SESSION_FILE)
            print("  Logged in via session (file)")
            return cl
        except Exception:
            SESSION_FILE.unlink(missing_ok=True)

    cl.login(username, password)
    SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
    cl.dump_settings(SESSION_FILE)
    print("  Fresh login successful")
    return cl


def post_reel(day_number: int):
    folder = get_day_folder(day_number)
    video = find_file(folder, "reel_video_bg.mp4") or find_file(folder, "*.mp4")
    if not video:
        print(f"ERROR: no .mp4 found in {folder}")
        sys.exit(1)

    caption = read_caption(folder)
    print(f"Posting REEL — Day {day_number} ({DAY_FOLDERS[day_number-1]})")
    print(f"  File: {video.name} ({video.stat().st_size // 1024}KB)")

    cl = login()
    media = cl.clip_upload(video, caption)
    media_id = str(media.pk)

    # Save published marker
    published = {"reel": media_id}
    (folder / "published.json").write_text(json.dumps(published, indent=2))

    print(f"  ✓ Reel published — media_id: {media_id}")
    return media_id


def post_feed(day_number: int):
    folder = get_day_folder(day_number)
    image = find_file(folder, "feed_post.png") or find_file(folder, "*.png")
    if not image:
        print(f"ERROR: no .png found in {folder}")
        sys.exit(1)

    caption = read_caption(folder)
    print(f"Posting FEED IMAGE — Day {day_number} ({DAY_FOLDERS[day_number-1]})")
    print(f"  File: {image.name} ({image.stat().st_size // 1024}KB)")

    cl = login()
    media = cl.photo_upload(image, caption)
    media_id = str(media.pk)

    published = {"feed": media_id}
    (folder / "published.json").write_text(json.dumps(published, indent=2))

    print(f"  ✓ Feed image published — media_id: {media_id}")
    return media_id


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Noble Instagram Poster")
    parser.add_argument("--day",  type=int, required=True, choices=range(1, 8))
    parser.add_argument("--type", required=True, choices=["reel", "feed"])
    args = parser.parse_args()

    if args.type == "reel":
        post_reel(args.day)
    else:
        post_feed(args.day)
