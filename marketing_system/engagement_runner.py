#!/usr/bin/env python3
"""
Noble Engagement Runner — runs 3x/day via launchd (9am, 2pm, 7pm EDT)
All safety limits enforced inside instagram_api.py:
  - Hard daily caps: 8 comments, 10 follows, 15 likes, 6 replies
  - Auto cooldown on any action block (2 days)
  - 20% session skip for human variance
  - Startup jitter: 0-8 min random delay per session
"""
import os
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT / "mcp_instagram"))

from dotenv import load_dotenv
load_dotenv(ROOT / "mcp_instagram" / ".env")
load_dotenv(ROOT / ".env")

from instagram_api import InstagramAPI

LOG_FILE   = ROOT / "output" / "engagement_run.log"
PAUSE_FILE = ROOT / "output" / "engagement" / "PAUSED"
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)


def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def main():
    tz = ZoneInfo("America/New_York")
    hour = datetime.now(tz).hour
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "")
    username = os.environ.get("INSTAGRAM_USERNAME", "")

    if not anthropic_key:
        log("ERROR: ANTHROPIC_API_KEY not set")
        return

    # Kill switch — create output/engagement/PAUSED to stop all activity
    if PAUSE_FILE.exists():
        log(f"⏸ PAUSED — delete {PAUSE_FILE.name} to resume")
        return

    log(f"Engagement run — {datetime.now(tz).strftime('%H:%M EDT')}")

    api = InstagramAPI(
        username=username,
        password=os.environ["INSTAGRAM_PASSWORD"],
    )

    # All sessions: reply to incoming comments first (high value, low risk)
    log("Checking for new comments to reply to...")
    replies = api.reply_to_comments(anthropic_key, username)
    if replies:
        log(f"Replied to {len(replies)} comments")
        for r in replies:
            log(f"  @{r['commenter']} [{r['account_type']}]: \"{r['our_reply']}\"")
    else:
        log("No new comments.")

    # Morning and afternoon only: outbound engagement
    if hour < 18:
        log("Starting small barber engagement...")
        summary = api.engage_small_barbers(
            anthropic_key,
            comment_limit=4,
            follow_limit=4,    # 8/day across 2 sessions
            like_limit=8,      # 15/day across 2 sessions
            max_followers=5000,
        )
        skipped = summary.get("skipped")
        if skipped:
            log(f"  Session skipped: {skipped}")
        else:
            log(f"  Done — comments: {summary['comments']}, follows: {summary['follows']}, likes: {summary['likes']}")
            for r in summary.get("results", []):
                actions = []
                if r.get("comment"): actions.append(f'"{r["comment"]}"')
                if r.get("followed"): actions.append("followed")
                if r.get("liked"): actions.append("liked")
                log(f"  @{r['username']} ({r['followers']} flw) — {' | '.join(actions)}")
    else:
        log("Evening session — replies only (no outbound engagement)")


if __name__ == "__main__":
    main()
