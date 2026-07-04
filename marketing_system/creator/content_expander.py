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

try:
    import anthropic
except ImportError:  # pragma: no cover - optional dependency in local runs
    anthropic = None
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent.parent))
from creator.prompts import (
    CREATOR_SYSTEM_PROMPT,
    EXPANSION_PROMPT_TEMPLATE,
    VISUAL_SCHEMA_DEFAULT,
    REELS_SCHEMA_DEFAULT,
    ANIMATION_SCHEMA_DEFAULT,
)
from creator.creative_enhancer import build_creative_enhancements

load_dotenv(Path(__file__).parent.parent / ".env")

IS_REEL      = {"reel", "reels", "short video", "video"}
IS_ANIMATED  = {"animated post", "animated", "animation", "motion graphic", "gif", "animated_post"}
IS_CAROUSEL  = {"carousel"}
IS_STORY     = {"story", "stories"}


def get_client():
    if anthropic is None:
        return None
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    return anthropic.Anthropic(api_key=api_key)


def build_local_fallback(post: dict, platform: str, index: int, total: int) -> dict:
    post_type = (post.get("post_type") or "").lower()
    hook = post.get("hook") or "A clear, practical post for barbershop owners."
    concept = post.get("concept") or ""
    caption_outline = post.get("caption_outline") or "Keep it practical and direct."
    cta = post.get("cta") or "Start free → noblelink.app"
    hashtags = post.get("hashtags") or ["#NobleApp", "#BarberBusiness"]

    caption_lines = [hook]
    if concept:
        caption_lines.append("")
        caption_lines.append(concept)

    if any(token in post_type for token in IS_REEL):
        caption_lines.append("")
        caption_lines.append(caption_outline)
        caption_lines.append("")
        caption_lines.append(f"CTA: {cta}")
        caption_lines.append("")
        caption_lines.append("Send this to a barber who needs to hear it.")
    elif any(token in post_type for token in IS_CAROUSEL):
        caption_lines.append("")
        caption_lines.append("Swipe through the full breakdown.")
        caption_lines.append("")
        caption_lines.append(f"CTA: {cta}")
        caption_lines.append("")
        caption_lines.append("Follow @noble.booking for weekly tips on running a tighter shop.")
    elif any(token in post_type for token in IS_STORY):
        caption_lines.append("")
        caption_lines.append("Quick reminder for your next post.")
        caption_lines.append("")
        caption_lines.append(f"CTA: {cta}")
    else:
        caption_lines.append("")
        caption_lines.append("Short, practical, and easy to save.")
        caption_lines.append("")
        caption_lines.append(f"CTA: {cta}")

    caption_lines.append("")
    caption_lines.append(" ".join(hashtags))
    caption = "\n".join(caption_lines)

    result = {
        "post_number": post.get("post_number", index + 1),
        "post_date": post.get("post_date"),
        "platform": platform,
        "post_type": post.get("post_type"),
        "content_pillar": post.get("content_pillar", ""),
        "caption": caption,
        "visual_description": None,
        "reels_script": None,
        "animation_brief": None,
        "fallback_mode": "local",
    }
    result["creative_enhancements"] = build_creative_enhancements(post)

    if any(token in post_type for token in IS_REEL):
        result["reels_script"] = {
            "total_duration": "12s",
            "sections": [
                {"section": "Hook", "timestamp": "0–3s", "on_screen_text": hook, "action": "Bold text on dark brand background", "voiceover": hook},
                {"section": "Problem", "timestamp": "3–8s", "on_screen_text": "Missed bookings cost real money", "action": "Show a calendar with gaps and missed follow-ups", "voiceover": "Small problems become expensive ones."},
                {"section": "Solution", "timestamp": "8–12s", "on_screen_text": cta, "action": "Overlay Noble CTA and booking link", "voiceover": "Use a booking link that works while you work."},
            ],
            "audio_note": "minimal upbeat music",
            "production_note": "Use phone camera or screen recording",
        }
    elif any(token in post_type for token in IS_ANIMATED):
        result["animation_brief"] = {
            "total_duration": "5s",
            "canvas": "1080×1350px portrait 4:5",
            "background": "#1a1208",
            "loop": True,
            "frames": [
                {
                    "frame": 1,
                    "start_time": "0s",
                    "duration": "5s",
                    "elements": [
                        {"type": "text", "content": hook, "animation": "fade-in", "delay": "0s", "style": "bold gold text"},
                    ],
                    "transition_out": "fade",
                }
            ],
            "ambient": "slow pulse",
            "audio_note": "no audio",
            "production_note": "Keep the motion minimal and readable.",
        }
    elif any(token in post_type for token in IS_CAROUSEL):
        result["visual_description"] = {
            "format": "carousel",
            "slides": [
                {
                    "slide_number": 1,
                    "background": "#1a1208",
                    "text_elements": [{"text": hook, "size": "large", "weight": "bold", "color": "#f5f0e8"}],
                    "layout_notes": "Hero slide with bold hook and gold accent line.",
                    "brand_elements": "Noble logo in the corner.",
                }
            ],
        }
    elif any(token in post_type for token in IS_STORY):
        result["visual_description"] = {
            "format": "single image",
            "slides": [
                {
                    "slide_number": 1,
                    "background": "#f5f0e8",
                    "text_elements": [{"text": hook, "size": "medium", "weight": "bold", "color": "#1a1208"}],
                    "layout_notes": "Simple story card with one clear CTA at the bottom.",
                    "brand_elements": "Add a subtle gold divider.",
                }
            ],
        }
    else:
        result["visual_description"] = {
            "format": "single image",
            "slides": [
                {
                    "slide_number": 1,
                    "background": "#1a1208",
                    "text_elements": [{"text": hook, "size": "large", "weight": "bold", "color": "#f5f0e8"}],
                    "layout_notes": "Keep the message simple and direct.",
                    "brand_elements": "Use gold CTA accent.",
                }
            ],
        }

    return result


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


def expand_post(post: dict, platform: str, index: int, total: int, client=None, offline: bool = False) -> dict:
    label = f"[{post.get('post_date', '?')}] Post #{post.get('post_number', index + 1)} — {post.get('post_type', '').upper()}"
    print(f"\n{'─' * 60}")
    print(f"  {index + 1}/{total} {label}")
    print(f"  Hook: {(post.get('hook') or '')[:70]}...")
    print(f"{'─' * 60}")

    if offline or client is None:
        print("  Using local fallback generator (no API key required).")
        return build_local_fallback(post, platform, index, total)

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
        result["creative_enhancements"] = build_creative_enhancements(post)
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
    parser.add_argument(
        "--offline",
        action="store_true",
        help="Use the built-in local fallback generator instead of Anthropic API",
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
    use_offline = args.offline or client is None
    if use_offline:
        print("Using local fallback mode (no Anthropic API required).")

    for i, post in enumerate(posts_to_expand):
        try:
            result = expand_post(post, platform, i, len(posts_to_expand), client=client, offline=use_offline)
            expanded.append(result)
        except Exception as e:
            print(f"\n  ⚠ Post #{post.get('post_number', i+1)} failed: {e} — skipping")

    print_final_summary(expanded)

    if expanded:
        enhanced_posts = []
        for post in expanded:
            if "creative_enhancements" not in post:
                post = dict(post)
                post["creative_enhancements"] = build_creative_enhancements(post)
            enhanced_posts.append(post)
        saved_path = save_output(enhanced_posts, meta, output_dir)
        print(f"\nSaved to: {saved_path}")
    else:
        print("\nNo posts expanded — nothing saved.")


if __name__ == "__main__":
    import os as _os
    if not _os.environ.get("_NOBLE_ORCHESTRATED"):
        print("\n  Run via orchestrator: python orchestrator.py --mode create")
        print("  Direct execution is allowed but not recommended.\n")
    main()
