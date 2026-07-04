#!/usr/bin/env python3
"""
Noble TrendScout Agent
Collects Instagram trends for the barbershop/Black business niche
over the last 30 days using Claude + web search.

Saves results to output/trends/trends_YYYY-MM-DD.json
This file is read by Strategist, HookWriter, and HashtagResearcher
before generating any content.

Usage:
  python strategist/trend_scout.py
  python strategist/trend_scout.py --days 14
  python strategist/trend_scout.py --force   # re-run even if today's file exists
"""

import argparse
import json
import os
import sys
from datetime import date, datetime
from pathlib import Path

import anthropic
from dotenv import load_dotenv

ROOT   = Path(__file__).parent.parent
TRENDS_DIR = ROOT / "output" / "trends"
load_dotenv(ROOT / ".env")


SEARCH_QUERIES = [
    "Instagram Reels trending audio barbershop barber 2026",
    "trending Instagram hashtags Black owned barbershop 2026",
    "viral barber content Instagram Reels hooks 2026",
    "barbershop booking software Instagram marketing trends",
    "Black business owners Instagram growth tips 2026",
    "trending topics Black barbershop owners social media",
    "Instagram algorithm changes Reels reach 2026",
    "barber influencer content strategy what works",
]

ANALYSIS_PROMPT = """You are a social media trend analyst for Noble — a booking SaaS targeting Black barbershop owners in the USA.

Based on the web search results below, extract and structure the most relevant Instagram trends from the last 30 days.

Focus on:
1. TRENDING AUDIO — music/sounds used in viral barbershop/Black culture Reels right now
2. TRENDING HOOKS — opening lines/formats that get high retention (first 3 seconds)
3. TRENDING FORMATS — content types going viral (POV, Before/After, Day-in-life, etc.)
4. TRENDING HASHTAGS — tags gaining traction in barbershop + Black business niches
5. TRENDING TOPICS — subjects/pain points resonating with barbershop owners right now
6. ALGORITHM INSIGHTS — any new Instagram algorithm behavior affecting reach

Search results:
{search_results}

Respond in this exact JSON format:
{{
  "collected_date": "{today}",
  "period": "last 30 days",
  "trending_audio": [
    {{"track": "Song Name — Artist", "why": "why it works for our niche", "urgency": "hot/warm/fading"}}
  ],
  "trending_hooks": [
    {{"hook": "opening line or format", "example": "example for Noble/barbershop", "format": "reel/post/story"}}
  ],
  "trending_formats": [
    {{"format": "format name", "description": "what it is", "noble_angle": "how Noble uses it"}}
  ],
  "trending_hashtags": {{
    "niche": ["#tag1", "#tag2"],
    "mid": ["#tag3", "#tag4"],
    "broad": ["#tag5", "#tag6"],
    "geo": ["#Baltimore", "#Maryland"],
    "avoid": ["dead tags to skip"]
  }},
  "trending_topics": [
    {{"topic": "topic name", "pain_point": "what barbers feel about it", "noble_angle": "how Noble addresses it"}}
  ],
  "algorithm_insights": [
    "key insight about Instagram algorithm right now"
  ],
  "weekly_content_recommendations": [
    {{"day": "Monday", "format": "Reel", "topic": "suggested topic", "hook": "suggested hook", "audio": "suggested audio"}}
  ]
}}"""


def search_web(client: anthropic.Anthropic, query: str) -> str:
    """Use Claude with web_search tool to gather trend data."""
    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 1}],
            messages=[{
                "role": "user",
                "content": f"Search for: {query}\n\nSummarize the most relevant findings in 3-5 bullet points. Focus on specific, actionable insights for Instagram content creators in the barbershop niche."
            }],
        )
        # Extract text from response
        result_parts = []
        for block in response.content:
            if hasattr(block, 'text'):
                result_parts.append(block.text)
        return "\n".join(result_parts) if result_parts else "No results"
    except Exception as e:
        return f"Search failed: {e}"


def analyze_trends(client: anthropic.Anthropic, search_results: str, today: str) -> dict:
    """Use Claude to analyze all search results and extract structured trends."""
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8000,
        messages=[{
            "role": "user",
            "content": ANALYSIS_PROMPT.format(
                search_results=search_results,
                today=today,
            )
        }],
    )
    raw = response.content[0].text.strip()
    # Strip markdown code fences
    if "```" in raw:
        parts = raw.split("```")
        for part in parts:
            p = part.strip()
            if p.startswith("json"):
                p = p[4:].strip()
            if p.startswith("{"):
                raw = p
                break
    # Find JSON boundaries
    start = raw.find("{")
    end   = raw.rfind("}") + 1
    if start != -1 and end > start:
        raw = raw[start:end]
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Return minimal valid structure if parsing fails
        print("  Warning: could not parse full JSON — saving partial trends")
        return {
            "collected_date": today,
            "period": "last 30 days",
            "raw_analysis": raw[:3000],
            "trending_audio": [],
            "trending_hooks": [],
            "trending_formats": [],
            "trending_hashtags": {"niche": [], "mid": [], "broad": [], "geo": []},
            "trending_topics": [],
            "algorithm_insights": [],
            "weekly_content_recommendations": [],
        }


def load_latest_trends():
    """Load the most recent trends file. Returns None if none exist."""
    files = sorted(TRENDS_DIR.glob("trends_*.json"), reverse=True)
    if not files:
        return None
    with open(files[0]) as f:
        return json.load(f)


def main():
    parser = argparse.ArgumentParser(description="Noble TrendScout — collect Instagram trends")
    parser.add_argument("--days",  type=int, default=30, help="Lookback period in days (default: 30)")
    parser.add_argument("--force", action="store_true", help="Re-run even if today's trends already exist")
    args = parser.parse_args()

    today = date.today().isoformat()
    out_path = TRENDS_DIR / f"trends_{today}.json"

    # Skip if already ran today
    if out_path.exists() and not args.force:
        print(f"✓ Trends already collected today: {out_path.name}")
        print("  Use --force to re-collect.")
        return

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY not set in marketing_system/.env")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    TRENDS_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("  NOBLE TREND SCOUT")
    print(f"  Period: last {args.days} days")
    print(f"  Date: {today}")
    print("=" * 60)

    # Step 1: Run web searches
    all_results = []
    for i, query in enumerate(SEARCH_QUERIES, 1):
        print(f"\n[{i}/{len(SEARCH_QUERIES)}] Searching: {query[:55]}...")
        result = search_web(client, query)
        all_results.append(f"QUERY: {query}\n{result}")
        print(f"  ✓ Got results")

    combined = "\n\n---\n\n".join(all_results)

    # Step 2: Analyze and structure
    print(f"\n{'─' * 60}")
    print("  Analyzing trends with Claude...")
    trends = analyze_trends(client, combined, today)

    # Step 3: Save
    out_path.write_text(json.dumps(trends, indent=2, ensure_ascii=False))
    print(f"\n{'=' * 60}")
    print(f"  Trends saved: {out_path.name}")
    print(f"{'=' * 60}")

    # Print summary
    print(f"\n  🎵 Trending audio:   {len(trends.get('trending_audio', []))} tracks")
    print(f"  🪝 Trending hooks:   {len(trends.get('trending_hooks', []))} formats")
    print(f"  📱 Trending formats: {len(trends.get('trending_formats', []))} types")
    tags = trends.get('trending_hashtags', {})
    total_tags = sum(len(v) for v in tags.values() if isinstance(v, list))
    print(f"  #️⃣  Hashtags found:   {total_tags} tags")
    print(f"  💡 Topics:          {len(trends.get('trending_topics', []))} pain points")
    print(f"  📅 Weekly recs:     {len(trends.get('weekly_content_recommendations', []))} days planned")
    print()


if __name__ == "__main__":
    main()
