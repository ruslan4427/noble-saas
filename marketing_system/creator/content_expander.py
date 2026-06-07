#!/usr/bin/env python3
"""
Noble SMM Creator Agent
Expands strategist plan items into publish-ready captions, visual descriptions, and Reels scripts.
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

import anthropic
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent.parent))
from creator.prompts import (
    CREATOR_SYSTEM_PROMPT,
    EXPANSION_PROMPT_TEMPLATE,
    VISUAL_SCHEMA_DEFAULT,
    REELS_SCHEMA_DEFAULT,
    ANIMATION_SCHEMA_DEFAULT,
)

load_dotenv(Path(__file__).parent.parent / ".env")

IS_REEL      = {"reel", "reels", "short video", "video"}
IS_ANIMATED  = {"animated post", "animated", "animation", "motion graphic", "gif", "animated_post"}
IS_CAROUSEL  = {"carousel"}
IS_STORY     = {"story", "stories"}


def get_client() -> anthropic.Anthropic:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY not set in marketing_system/.env")
        sys.exit(1)
    return anthropic.Anthropic(api_key=api_key)


def build_expansion_prompt(post: dict, platform: str) -> str:
    post_type = post.get("post_type", "").lower()
    is_reel     = any(r in post_type for r in IS_REEL)
    is_animated = any(a in post_type for a in IS_ANIMATED)
    is_carousel = any(c in post_type for c in IS_CAROUSEL)
    is_story    = any(s in post_type for s in IS_STORY)

    # carousel and story still get visual_description (slide layouts / story layout)
    visual_schema    = "null" if (is_reel or is_animated) else VISUAL_SCHEMA_DEFAULT
    reels_schema     = REELS_SCHEMA_DEFAULT if is_reel else "null"
    animation_schema = ANIMATION_SCHEMA_DEFAULT if is_animated else "null"

    return EXPANSION_PROMPT_TEMPLATE.format(
        platform=platform,
        post_type=post.get("post_type", ""),
        content_pillar=post.get("content_pillar", ""),
        hook=post.get("hook", ""),
        concept=post.get("concept", ""),
        caption_outline=post.get("caption_outline", ""),
        visual_direction=post.get("visual_direction", ""),
        animation_concept=post.get("animation_concept") or "n/a",
        cta=post.get("cta", ""),
        hashtags=", ".join(post.get("hashtags", [])),
        post_number=post.get("post_number", ""),
        post_date=post.get("post_date", ""),
        visual_description_schema=visual_schema,
        reels_script_schema=reels_schema,
        animation_brief_schema=animation_schema,
    )


def expand_post(client: anthropic.Anthropic, post: dict, platform: str, index: int, total: int) -> dict:
    label = f"[{post.get('post_date', '?')}] Post #{post.get('post_number', index + 1)} — {post.get('post_type', '').upper()}"
    print(f"\n{'─' * 60}")
    print(f"  {index + 1}/{total} {label}")
    print(f"  Hook: {(post.get('hook') or '')[:70]}...")
    print(f"{'─' * 60}")

    prompt = build_expansion_prompt(post, platform)
    post_type   = post.get("post_type", "").lower()
    is_carousel = any(c in post_type for c in IS_CAROUSEL)
    is_story    = any(s in post_type for s in IS_STORY)
    is_animated = any(a in post_type for a in IS_ANIMATED)
    if is_carousel:
        max_tokens = 4096  # multiple slides need more tokens
    elif is_story:
        max_tokens = 1024  # story brief is short
    elif is_animated:
        max_tokens = 3000  # animation_brief with frames
    else:
        max_tokens = 2048
    response_text = ""

    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=max_tokens,
        system=CREATOR_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            response_text += text

    print()

    # Strip markdown fences if present
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", response_text)
    cleaned = match.group(1).strip() if match else response_text.strip()

    try:
        result = json.loads(cleaned)
        # Always carry over source fields the LLM might omit
        for field in ("hook", "concept", "visual_direction", "animation_concept", "notes", "feature_update"):
            if field in post and field not in result:
                result[field] = post[field]
        return result
    except json.JSONDecodeError:
        print(f"  Warning: JSON parse failed for post #{post.get('post_number')}. Storing raw text.")
        return {
            "post_number": post.get("post_number"),
            "post_date": post.get("post_date"),
            "hook": post.get("hook", ""),
            "error": "json_parse_failed",
            "raw": response_text,
        }


def load_plan(plan_path: Path) -> dict:
    if not plan_path.exists():
        print(f"Error: Plan file not found: {plan_path}")
        sys.exit(1)
    with open(plan_path) as f:
        return json.load(f)


def save_output(expanded: list[dict], meta: dict, output_dir: Path) -> Path:
    start_date = meta.get("start_date", "unknown")
    platform = meta.get("platform", "unknown")
    filename = f"content_final_{platform}_{start_date}.json"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / filename

    result = {
        "meta": {
            **meta,
            "expanded_posts": len(expanded),
        },
        "posts": expanded,
    }

    output_path.write_text(json.dumps(result, indent=2, ensure_ascii=False))
    return output_path


def print_final_summary(expanded: list[dict]) -> None:
    print(f"\n{'=' * 60}")
    print("EXPANDED CONTENT SUMMARY")
    print(f"{'=' * 60}")
    for post in expanded:
        if "error" in post:
            print(f"\n  ❌ Post #{post.get('post_number')} — parse error")
            continue
        caption = post.get("caption", "")
        first_line = caption.split("\n")[0][:80] if caption else "—"
        post_type = post.get("post_type", "").upper()
        has_visual    = post.get("visual_description") is not None
        has_script    = post.get("reels_script") is not None
        has_animation = post.get("animation_brief") is not None
        print(f"\n  [{post.get('post_date')}] #{post.get('post_number')} {post_type}")
        print(f"  Caption: {first_line}")
        print(f"  Assets:  {'visual ✓' if has_visual else ''} {'script ✓' if has_script else ''} {'animation_brief ✓' if has_animation else ''}")
    print(f"\n{'=' * 60}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Noble SMM Creator — expands plan into publish-ready content")
    parser.add_argument(
        "--plan",
        type=Path,
        help="Path to strategist plan JSON (default: latest plan in output/)",
    )
    parser.add_argument(
        "--posts",
        type=str,
        default="all",
        help="Post numbers to expand: 'all', '1', '1,3,5', or '1-5' (default: all)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).parent.parent / "output",
        help="Output directory (default: marketing_system/output/)",
    )

    args = parser.parse_args()

    output_dir = args.output

    # Auto-find latest plan if not specified
    if args.plan is None:
        plans = sorted(output_dir.glob("plan_*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
        if not plans:
            print("Error: No plan files found in output/. Run strategist/plan_generator.py first.")
            sys.exit(1)
        plan_path = plans[0]
        print(f"Using latest plan: {plan_path.name}")
    else:
        plan_path = args.plan

    plan = load_plan(plan_path)
    meta = plan.get("plan_meta", {})
    all_posts = plan.get("posts", [])
    platform = meta.get("platform", "instagram")

    # Filter posts by --posts argument
    if args.posts == "all":
        posts_to_expand = all_posts
    elif "-" in args.posts:
        start, end = map(int, args.posts.split("-"))
        posts_to_expand = [p for p in all_posts if start <= p.get("post_number", 0) <= end]
    else:
        numbers = {int(n) for n in args.posts.split(",")}
        posts_to_expand = [p for p in all_posts if p.get("post_number") in numbers]

    if not posts_to_expand:
        print("Error: No posts matched the filter. Check --posts argument.")
        sys.exit(1)

    print(f"\nNOBLE CONTENT CREATOR")
    print(f"Plan   : {plan_path.name}")
    print(f"Platform: {platform.upper()}")
    print(f"Posts  : {len(posts_to_expand)} of {len(all_posts)} total")

    client = get_client()
    expanded = []

    for i, post in enumerate(posts_to_expand):
        try:
            result = expand_post(client, post, platform, i, len(posts_to_expand))
            expanded.append(result)
        except Exception as e:
            print(f"\n  ⚠ Post #{post.get('post_number', i+1)} failed: {e} — skipping")

    print_final_summary(expanded)

    if expanded:
        saved_path = save_output(expanded, meta, output_dir)
        print(f"\nSaved to: {saved_path}")
    else:
        print("\nNo posts expanded — nothing saved.")


if __name__ == "__main__":
    import os as _os
    if not _os.environ.get("_NOBLE_ORCHESTRATED"):
        print("\n  Run via orchestrator: python orchestrator.py --mode create")
        print("  Direct execution is allowed but not recommended.\n")
    main()
