#!/usr/bin/env python3
"""
Offline creative enhancement tool for Noble content.
Adds stronger hooks, visual directions, CTA variants, and quality tips
for each post without requiring API access.
"""

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List


IS_REEL = {"reel", "reels", "short video", "video"}
IS_ANIMATED = {"animated post", "animated", "animation", "motion graphic", "gif", "animated_post"}
IS_CAROUSEL = {"carousel"}
IS_STORY = {"story", "stories"}


def build_creative_enhancements(post: Dict[str, Any]) -> Dict[str, Any]:
    post_type = (post.get("post_type") or "").lower()
    hook = post.get("hook") or "A clear, practical post for barbershop owners."
    cta = post.get("cta") or "Start free → noblelink.app"
    pillar = (post.get("content_pillar") or "product").lower()

    if any(token in post_type for token in IS_REEL):
        creative_angle = "Fast, story-first, pain-to-solution pacing with a strong payoff frame."
        visual_style = "Dark cinematic background, bold text overlays, gold CTA accent, real phone or screen-recorded motion."
        shot_list = [
            "Open on a strong pain point in the first second.",
            "Show the friction visually before revealing the fix.",
            "End on the clearest payoff and CTA.",
        ]
        quality_tips = [
            "Keep the first 2 seconds punchy and specific.",
            "Use on-screen text instead of long voiceover.",
            "Make the CTA feel like a next step, not a hard sell.",
        ]
    elif any(token in post_type for token in IS_ANIMATED):
        creative_angle = "Make the feature feel premium and tangible through motion, not explanation."
        visual_style = "Minimal motion, premium dark palette, subtle gold pulse, one strong message per frame."
        shot_list = [
            "Animate the key value prop in a single clear loop.",
            "Use one message per screen so the motion stays readable.",
            "Let the final frame feel like a reward or payoff.",
        ]
        quality_tips = [
            "Keep the motion subtle and readable.",
            "Avoid too many words in one frame.",
            "Make the last frame memorable and shareable.",
        ]
    elif any(token in post_type for token in IS_CAROUSEL):
        creative_angle = "Turn the feature into a saveable mini-course with one payoff slide."
        visual_style = "Clean educational layout, strong slide hierarchy, one big takeaway per slide, gold CTA accent."
        shot_list = [
            "Hook slide with the painful problem.",
            "Show the obstacle in a relatable way.",
            "Reveal the solution and end with a practical takeaway.",
        ]
        quality_tips = [
            "Make each slide solve one small question.",
            "Use the final slide as the saveable takeaway.",
            "Keep the language practical and confident.",
        ]
    elif any(token in post_type for token in IS_STORY):
        creative_angle = "Low-friction engagement that feels conversational, not salesy."
        visual_style = "Light story card, one clear question or poll, simple CTA, warm brand colors."
        shot_list = [
            "Start with a direct, low-friction question.",
            "Keep the design uncluttered.",
            "Use a one-tap response CTA.",
        ]
        quality_tips = [
            "Make the question feel relevant to their day-to-day.",
            "Keep the answer options obvious.",
            "Avoid too much copy on the screen.",
        ]
    else:
        creative_angle = "Bold, single-message social proof with a clean saveable takeaway."
        visual_style = "High contrast, strong headline, minimal clutter, clear CTA block."
        shot_list = [
            "Lead with the most useful sentence.",
            "Keep the visual simple and readable.",
            "End with an action-orientated CTA.",
        ]
        quality_tips = [
            "Make the headline feel specific rather than generic.",
            "Use one big idea, not three competing ones.",
            "Make the CTA obvious and easy to act on.",
        ]

    hook_variants = [
        hook,
        f"{hook} Here’s the faster way.",
        f"Stop doing this the hard way. {hook}",
    ]

    cta_variants = [cta, f"Save this for later — {cta}"]

    # Slightly tailor the angle to the main content pillar for better relevance.
    if pillar == "product":
        creative_angle = f"{creative_angle} Focus on everyday workflow pain and the payoff of using Noble."
    elif pillar == "engagement":
        creative_angle = f"{creative_angle} Prioritize community interaction and conversation starters."
    elif pillar == "education":
        creative_angle = f"{creative_angle} Teach one useful habit that feels immediately applicable."

    return {
        "creative_angle": creative_angle,
        "hook_variants": hook_variants,
        "visual_style": visual_style,
        "shot_list": shot_list,
        "cta_variants": cta_variants,
        "quality_tips": quality_tips,
    }


def enhance_post(post: Dict[str, Any]) -> Dict[str, Any]:
    enhanced = dict(post)
    enhanced["creative_enhancements"] = build_creative_enhancements(post)
    return enhanced


def enhance_content(payload: Dict[str, Any]) -> Dict[str, Any]:
    enhanced = dict(payload)
    posts = payload.get("posts", [])
    enhanced["posts"] = [enhance_post(post) for post in posts]
    return enhanced


def enhance_file(input_path: Path, output_path: Path) -> Path:
    with open(input_path, encoding="utf-8") as f:
        payload = json.load(f)

    enhanced = enhance_content(payload)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(enhanced, indent=2, ensure_ascii=False), encoding="utf-8")
    return output_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Enhance generated content with offline creative directions")
    parser.add_argument("--input", type=Path, required=True, help="Path to a content JSON file")
    parser.add_argument("--output", type=Path, help="Optional output path; defaults to input with _creative.json suffix")
    args = parser.parse_args()

    input_path = args.input
    output_path = args.output or input_path.with_name(f"{input_path.stem}_creative.json")
    result_path = enhance_file(input_path, output_path)
    print(f"Enhanced content saved to: {result_path}")


if __name__ == "__main__":
    main()
