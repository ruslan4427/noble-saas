#!/usr/bin/env python3
"""
Noble Instagram Scheduled Publisher
Reads the current week schedule and posts content when it's time.
Run by launchd every 30 minutes — idempotent (checks published.json before posting).
"""
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).parent
WEEK_CONTENT = ROOT / "week_content"  # local week_content/ (auto-synced from Desktop)
SCHEDULE_FILE = ROOT / "week_content" / "schedule.json"
SCHEDULE_DIR  = ROOT / "output" / "schedule"  # legacy fallback
LOG_FILE      = ROOT / "output" / "publish_run.log"

sys.path.insert(0, str(ROOT / "mcp_instagram"))
from dotenv import load_dotenv
load_dotenv(ROOT / "mcp_instagram" / ".env")
from instagram_api import InstagramAPI

DAY_FOLDERS = [
    "Day01_Monday", "Day02_Tuesday", "Day03_Wednesday", "Day04_Thursday",
    "Day05_Friday", "Day06_Saturday", "Day07_Sunday",
]

POST_WINDOW_HOURS = 3  # post if within 3 hours past scheduled time


def log(msg: str):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def get_latest_schedule() -> dict | None:
    # Primary: week_content/schedule.json
    if SCHEDULE_FILE.exists():
        data = json.loads(SCHEDULE_FILE.read_text())
        # Normalize old format {posts: [...]} → {schedule: [...], timezone: ...}
        if "posts" in data and "schedule" not in data:
            data["schedule"] = [
                {
                    "day": p["day"],
                    "type": "Reel" if p.get("type", "reel").lower() == "reel" else "Feed",
                    "post_date": p["post_at_utc"][:10],
                    "post_time": p["post_at_utc"][11:16],
                }
                for p in data["posts"]
            ]
            data.setdefault("timezone", "UTC")
        return data
    # Fallback: output/schedule/schedule_*.json (legacy)
    files = sorted(SCHEDULE_DIR.glob("schedule_*.json"), reverse=True)
    return json.loads(files[0].read_text()) if files else None


def is_approved(day: int) -> bool:
    folder = WEEK_CONTENT / DAY_FOLDERS[day - 1]
    return (folder / "approved.json").exists()


def is_published(day: int, kind: str) -> bool:
    folder = WEEK_CONTENT / DAY_FOLDERS[day - 1]
    log_path = folder / "published.json"
    if not log_path.exists():
        return False
    data = json.loads(log_path.read_text())
    return kind in data


def save_published(day: int, kind: str, media_id: str):
    folder = WEEK_CONTENT / DAY_FOLDERS[day - 1]
    log_path = folder / "published.json"
    data = {}
    if log_path.exists():
        try:
            data = json.loads(log_path.read_text())
        except Exception:
            pass
    data[kind] = media_id
    log_path.write_text(json.dumps(data, indent=2))


def find_file(folder: Path, pattern: str) -> Path | None:
    files = sorted(folder.glob(pattern), key=lambda p: p.stat().st_mtime, reverse=True)
    return files[0] if files else None


def read_caption(folder: Path) -> str:
    f = folder / "caption.txt"
    return f.read_text(encoding="utf-8").strip() if f.exists() else "Book your next cut online → noblelink.app"


def main():
    schedule = get_latest_schedule()
    if not schedule:
        log("No schedule found — nothing to do.")
        return

    tz = ZoneInfo(schedule.get("timezone", "America/New_York"))
    now = datetime.now(tz)

    pending = []
    for entry in schedule["schedule"]:
        day       = entry["day"]
        post_type = entry["type"]  # "Reel" or "Feed"
        kind      = "reel" if post_type == "Reel" else "feed"
        scheduled = datetime.strptime(
            f"{entry['post_date']} {entry['post_time']}", "%Y-%m-%d %H:%M"
        ).replace(tzinfo=tz)

        if now < scheduled:
            continue  # not yet time
        if now > scheduled + timedelta(hours=POST_WINDOW_HOURS):
            continue  # missed the window
        if is_published(day, kind):
            continue  # already posted
        # Approval check disabled for automated server posting
        # Uncomment to re-enable manual approval gate:
        # if not is_approved(day):
        #     log(f"  Day {day} skipped — not approved yet")
        #     continue

        pending.append((day, kind, post_type, scheduled))

    if not pending:
        log("Nothing to post right now.")
        return

    api = InstagramAPI(
        username=os.environ["INSTAGRAM_USERNAME"],
        password=os.environ["INSTAGRAM_PASSWORD"],
    )

    for day, kind, post_type, scheduled in pending:
        folder  = WEEK_CONTENT / DAY_FOLDERS[day - 1]
        caption = read_caption(folder)

        log(f"Posting Day {day} {post_type} (scheduled {scheduled.strftime('%H:%M')})...")

        try:
            if post_type == "Reel":
                video = find_file(folder, "*.mp4")
                if not video:
                    log(f"  ERROR: no .mp4 in {folder}")
                    continue
                media_id = api.post_reel(video, caption)
            else:
                image = find_file(folder, "*.png")
                if not image:
                    log(f"  ERROR: no .png in {folder}")
                    continue
                media_id = api.post_image(image, caption)

            save_published(day, kind, media_id)
            log(f"  ✓ {post_type} published — media_id: {media_id}")

        except Exception as e:
            log(f"  ✗ Failed: {e}")


if __name__ == "__main__":
    main()
