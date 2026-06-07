#!/usr/bin/env python3
"""
Noble SMM Analyzer Agent
Fetches Instagram Insights for published posts, tags them with performance labels,
and writes a performance report that the Strategist uses on the next run.

Use --mock for demo mode (no Instagram API needed).
"""

import argparse
import json
import os
import random
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

GRAPH_API = "https://graph.facebook.com/v20.0"
THRESHOLDS = {"high": 0.05, "medium": 0.02}
MEDIA_INSIGHTS = ["impressions", "reach", "likes", "comments", "shares", "saved"]


def get_env(key: str) -> str:
    val = os.environ.get(key)
    if not val:
        print(f"Error: {key} not set in .env")
        sys.exit(1)
    return val


# ── Real Instagram API ────────────────────────────────────────────────────────

def ig_get(path: str, params: dict) -> dict:
    import requests
    resp = requests.get(f"{GRAPH_API}{path}", params=params, timeout=15)
    data = resp.json()
    if "error" in data:
        print(f"  API error: {data['error'].get('message', data['error'])}")
    return data


def fetch_recent_media(account_id: str, token: str, limit: int) -> list:
    data = ig_get(
        f"/{account_id}/media",
        {"fields": "id,caption,timestamp,media_type,permalink", "limit": limit, "access_token": token},
    )
    return data.get("data", [])


def fetch_insights(media_id: str, token: str) -> dict:
    data = ig_get(
        f"/{media_id}/insights",
        {"metric": ",".join(MEDIA_INSIGHTS), "access_token": token},
    )
    result = {}
    for item in data.get("data", []):
        result[item["name"]] = item["values"][0]["value"] if item.get("values") else item.get("value", 0)
    return result


def match_post_to_media(post: dict, media_list: list) -> Optional[dict]:
    hook = post.get("hook", "").lower()[:40]
    caption_first = (post.get("caption", "").split("\n")[0]).lower()[:40]
    for media in media_list:
        ig_caption = (media.get("caption") or "").lower()
        if hook and hook in ig_caption:
            return media
        if caption_first and caption_first in ig_caption:
            return media
    return None


# ── Mock / Demo mode ─────────────────────────────────────────────────────────

# Realistic engagement distributions per content pillar and post type
MOCK_PROFILES = {
    ("product", "reel"):        {"reach": (1800, 4500), "er": (0.06, 0.12)},
    ("product", "carousel"):    {"reach": (900, 2200),  "er": (0.04, 0.09)},
    ("product", "single image"):{"reach": (600, 1400),  "er": (0.02, 0.05)},
    ("education", "carousel"):  {"reach": (1200, 3000), "er": (0.05, 0.11)},
    ("education", "reel"):      {"reach": (2000, 5000), "er": (0.05, 0.10)},
    ("education", "single image"):{"reach": (700, 1600),"er": (0.02, 0.06)},
    ("social_proof", "reel"):   {"reach": (1500, 3500), "er": (0.05, 0.09)},
    ("social_proof", "carousel"):{"reach": (800, 2000), "er": (0.04, 0.08)},
    ("social_proof", "single image"):{"reach": (600, 1500),"er": (0.03, 0.07)},
    ("engagement", "carousel"): {"reach": (1000, 2500), "er": (0.07, 0.15)},
    ("engagement", "single image"):{"reach": (800, 2000),"er": (0.06, 0.13)},
    ("promotional", "single image"):{"reach": (500, 1200),"er": (0.01, 0.03)},
    ("promotional", "carousel"):{"reach": (600, 1400),  "er": (0.02, 0.04)},
}
DEFAULT_PROFILE = {"reach": (500, 1000), "er": (0.02, 0.05)}


def mock_insights(post: dict) -> dict:
    pillar = post.get("content_pillar", "")
    post_type = post.get("post_type", "").lower()
    profile = MOCK_PROFILES.get((pillar, post_type), DEFAULT_PROFILE)

    reach = random.randint(*profile["reach"])
    impressions = int(reach * random.uniform(1.1, 1.5))
    er = random.uniform(*profile["er"])
    total_engaged = int(reach * er)

    # Split engaged actions
    saved = int(total_engaged * random.uniform(0.30, 0.45))
    shares = int(total_engaged * random.uniform(0.10, 0.20))
    comments = int(total_engaged * random.uniform(0.08, 0.18))
    likes = total_engaged - saved - shares - comments

    return {
        "impressions": impressions,
        "reach": reach,
        "likes": max(0, likes),
        "comments": max(0, comments),
        "shares": max(0, shares),
        "saved": max(0, saved),
    }


def mock_permalink(post: dict) -> str:
    return f"https://www.instagram.com/p/mock_{post.get('post_number', 0):03d}/"


# ── Shared logic ──────────────────────────────────────────────────────────────

def engagement_rate(insights: dict) -> float:
    reach = insights.get("reach", 0)
    if reach == 0:
        return 0.0
    engaged = (
        insights.get("likes", 0)
        + insights.get("comments", 0)
        + insights.get("shares", 0)
        + insights.get("saved", 0)
    )
    return engaged / reach


def label_performance(rate: float) -> str:
    if rate >= THRESHOLDS["high"]:
        return "high"
    if rate >= THRESHOLDS["medium"]:
        return "medium"
    return "low"


def load_latest_content(output_dir: Path):
    files = sorted(output_dir.glob("content_final_*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not files:
        print("Error: No content_final_*.json found in output/. Run creator first.")
        sys.exit(1)
    path = files[0]
    print(f"Analyzing: {path.name}")
    with open(path) as f:
        return path, json.load(f)


def save_report(report: dict, output_dir: Path) -> Path:
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    suffix = "_MOCK" if report.get("mock") else ""
    path = output_dir / f"performance_report_{date_str}{suffix}.json"
    path.write_text(json.dumps(report, indent=2, ensure_ascii=False))
    return path


def save_tagged_content(content: dict, source_path: Path) -> None:
    source_path.write_text(json.dumps(content, indent=2, ensure_ascii=False))


def print_report(report: dict) -> None:
    mock = report.get("mock", False)
    print(f"\n{'=' * 60}")
    print(f"PERFORMANCE REPORT{'  [DEMO MODE — simulated data]' if mock else ''}")
    print(f"{'=' * 60}")

    for item in report.get("posts", []):
        label = item.get("performance", "unknown")
        rate = item.get("engagement_rate_pct", 0)
        icon = {"high": "🟢", "medium": "🟡", "low": "🔴"}.get(label, "⚪")
        print(f"\n  {icon} Post #{item['post_number']} — {item['post_type'].upper()} ({item.get('content_pillar', '')})")
        print(f"     Hook      : {item.get('hook', '')[:58]}")
        print(f"     Reach     : {item.get('reach', 'n/a'):,}")
        print(f"     Likes     : {item.get('likes', 0):,}  "
              f"Comments: {item.get('comments', 0)}  "
              f"Saves: {item.get('saved', 0)}  "
              f"Shares: {item.get('shares', 0)}")
        print(f"     Engagement: {rate:.1f}% → {label.upper()}")

    s = report["summary"]
    hints = report.get("strategist_hints", {})
    print(f"\n{'─' * 60}")
    print(f"  🟢 High    : {s['high']}   🟡 Medium: {s['medium']}   🔴 Low: {s['low']}")
    if hints.get("repeat_pillars"):
        print(f"  Best pillars  : {', '.join(set(hints['repeat_pillars']))}")
    if hints.get("best_post_types"):
        print(f"  Best formats  : {', '.join(set(hints['best_post_types']))}")
    if hints.get("avoid_pillars"):
        print(f"  Underperformed: {', '.join(set(hints['avoid_pillars']))}")
    print(f"{'=' * 60}\n")


def build_report_post(post: dict, insights: dict, permalink: str) -> dict:
    rate = engagement_rate(insights)
    label = label_performance(rate)
    return {
        "post_number": post.get("post_number"),
        "post_type": post.get("post_type", ""),
        "content_pillar": post.get("content_pillar", ""),
        "hook": post.get("hook", ""),
        "performance": label,
        "engagement_rate_pct": round(rate * 100, 2),
        "matched": True,
        "permalink": permalink,
        **insights,
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Noble SMM Analyzer — Instagram Insights checker")
    parser.add_argument("--output", type=Path, default=Path(__file__).parent.parent / "output")
    parser.add_argument("--limit", type=int, default=25, help="Posts to fetch from Instagram (default: 25)")
    parser.add_argument("--mock", action="store_true", help="Demo mode: simulate metrics without Instagram API")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducible mock data")
    args = parser.parse_args()

    if args.mock and args.seed is not None:
        random.seed(args.seed)

    content_path, content = load_latest_content(args.output)
    posts = content.get("posts", [])

    report_posts = []
    summary = {"high": 0, "medium": 0, "low": 0, "not_matched": 0}

    if args.mock:
        print(f"\n[DEMO MODE] Simulating Instagram metrics for {len(posts)} posts...\n")
        for post in posts:
            insights = mock_insights(post)
            permalink = mock_permalink(post)
            rate = engagement_rate(insights)
            label = label_performance(rate)

            post["performance"] = label
            post["insights"] = insights
            post["permalink"] = permalink

            summary[label] += 1
            rp = build_report_post(post, insights, permalink)
            report_posts.append(rp)
            icon = {"high": "🟢", "medium": "🟡", "low": "🔴"}.get(label, "⚪")
            print(f"  {icon} Post #{post.get('post_number')} {label.upper()} "
                  f"({rate * 100:.1f}%) — reach {insights['reach']:,}")

    else:
        # Use instagrapi (session-based) — Graph API requires Meta Business verification
        print(f"Fetching published posts via instagrapi session...")
        import warnings; warnings.filterwarnings("ignore")
        try:
            from instagrapi import Client as IgClient
        except ImportError:
            print("ERROR: instagrapi not installed. Run: pip install instagrapi")
            sys.exit(1)

        session_file = Path(__file__).parent.parent / "mcp_instagram" / "session.json"
        if not session_file.exists():
            print(f"ERROR: session.json not found at {session_file}")
            sys.exit(1)

        ig = IgClient()
        ig.load_settings(session_file)
        user_info = ig.user_info_by_username("noble.booking")
        user_id   = str(user_info.pk)

        medias = ig.user_medias(user_id, amount=args.limit)
        print(f"Found {len(medias)} media items.\n")

        media_list = []
        for m in medias:
            media_list.append({
                "id":        str(m.pk),
                "caption":   m.caption_text or "",
                "permalink": str(m.thumbnail_url or ""),
                "media_type": str(m.media_type),
                "like_count":    getattr(m, "like_count", 0),
                "comment_count": getattr(m, "comment_count", 0),
            })

        for post in posts:
            post_number = post.get("post_number")
            hook = post.get("hook", "")
            print(f"  Checking post #{post_number}: {hook[:50]}...")

            media = match_post_to_media(post, media_list)
            if not media:
                print(f"    → Not matched. Skipping.")
                post["performance"] = "not_published"
                summary["not_matched"] += 1
                report_posts.append({
                    "post_number": post_number,
                    "post_type": post.get("post_type", ""),
                    "hook": hook,
                    "performance": "not_published",
                    "matched": False,
                })
                continue

            # instagrapi public counts only (likes + comments)
            insights = {
                "reach":    0,
                "likes":    media.get("like_count", 0),
                "comments": media.get("comment_count", 0),
                "shares":   0,
                "saved":    0,
            }
            rate = engagement_rate(insights)
            label = label_performance(rate)

            post["performance"] = label
            post["instagram_media_id"] = media["id"]
            post["permalink"] = media.get("permalink", "")
            post["insights"] = insights

            summary[label] += 1
            report_posts.append(build_report_post(post, insights, media.get("permalink", "")))
            print(f"    → {label.upper()} (likes: {insights['likes']}, comments: {insights['comments']})")

    save_tagged_content(content, content_path)
    print(f"\nTagged: {content_path.name}")

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_file": content_path.name,
        "mock": args.mock,
        "summary": summary,
        "thresholds": THRESHOLDS,
        "posts": report_posts,
        "strategist_hints": {
            "repeat_pillars": [
                p["content_pillar"] for p in report_posts
                if p.get("performance") == "high" and p.get("content_pillar")
            ],
            "avoid_pillars": [
                p["content_pillar"] for p in report_posts
                if p.get("performance") == "low" and p.get("content_pillar")
            ],
            "best_post_types": [
                p["post_type"] for p in report_posts
                if p.get("performance") == "high"
            ],
        },
    }

    print_report(report)
    report_path = save_report(report, args.output)
    print(f"Report saved: {report_path.name}")


if __name__ == "__main__":
    import os as _os
    if not _os.environ.get("_NOBLE_ORCHESTRATED"):
        print("\n  Run via orchestrator: python orchestrator.py --mode analyze")
        print("  Direct execution is allowed but not recommended.\n")
    main()
