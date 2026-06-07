#!/usr/bin/env python3
"""
Noble SMM Orchestrator
Single entry point for the full content pipeline.
Run all agents through this file — never call agents directly.

Agents:
  Strategist     → strategist/plan_generator.py
  Creator        → creator/content_expander.py
  Designer       → designer/asset_generator.py   (Figma/Canva briefs)
  Design Agent   → designer/design_agent.py      (AI image prompt via Claude)
  Gemini         → designer/gemini_generator.py  (image generation via Gemini)
  CSS Animator   → designer/css_animator.py      (HTML/CSS → MP4 animations)
  Reels Gen      → generate_week_reels.py        (7 Reels + 7 posts week set)
  Analyzer       → analyzer/metrics_check.py
  Moderator      → moderator/comment_responder.py
  Publisher      → publisher/instagram_agent.py

Modes:
  create      Strategist + Creator
  animate     Strategist (animated posts) + Creator + Animation Agent (HTML/CSS per post)
  week        Full week pipeline: plan → posts → templates (A-H) → drafts + animations
  reels       Generate full week Reels set (7 Reels 1080×1920 + 7 Feed posts 1080×1080)
  reels-only  Generate only the 7 Reels (no Feed posts)
  posts-only  Generate only the 7 Feed posts (no Reels)
  template    Generate HTML/CSS template for a single post (--post N, --type a-h)
  reel-brief  Print a formatted Reel production checklist for --post N (no AI call needed)
  reel-animate  Generate HTML/CSS animated Reel from reels_script for --post N
  design      Asset briefs (Figma/Canva)
  visual      Design Agent → AI image prompt (Claude)
  gemini      Design Agent → Gemini image (Claude prompt + Noble screenshot → Gemini)
  publish     Instagram Agent → publish image to IG
  analyze     Analyzer
  moderate    Moderator
  full        All agents end-to-end

Feed post templates (--type a-h):
  a  Bold text dark background
  b  Photo background (requires --bg)
  c  iPhone mockup dark
  d  Review cards
  e  Checklist
  f  MacBook dashboard light
  g  MacBook + iPhone desk (requires --bg)
  h  Product shot iPad (requires --bg)

Reel templates (used automatically in --mode reels):
  reel_notification  Phone + booking notification animation (12s)
  reel_counter       Animated stats counter (10s)
  reel_typewriter    Typewriter headline (11s)
  reel_calendar      Calendar filling up (9s)

Instagram Content Types (all production-ready):
  reel           1080×1920 MP4, 7–15s — highest reach, new audience
                 Generator: generate_week_reels.py → video_bg_agent.py
  feed_post      1080×1080 PNG, static — saves, evergreen, profile grid
                 Generator: generate_week_reels.py → template_renderer.py
  carousel       1080×1080 PNG × 2–10 slides — education, saves, swipeable
                 Generator: generate_week_reels.py generate_carousel()
                 Define slides=[...] array in WEEK_PLAN
  story          1080×1920 PNG/MP4, 24h — engagement, polls, existing followers
                 Generator: print_story_brief() → .txt brief → MANUAL POST via app
  animated_post  1080×1350 MP4, 3–7s loop — product demo, feed video
                 Generator: css_animator.py via --mode animate

To add a new content type: update content_types.py → propagates to all agents.
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path
from typing import Optional

ROOT   = Path(__file__).parent
_py311 = ROOT / "mcp_instagram" / ".venv" / "bin" / "python3"
PYTHON = str(_py311) if _py311.exists() else str(ROOT / "venv" / "bin" / "python")

# Mark all child processes as orchestrated so agents skip their direct-run warning
os.environ["_NOBLE_ORCHESTRATED"] = "1"


def run(label: str, script: Path, extra_args: list, stop_on_error: bool = True) -> int:
    print(f"\n{'─' * 60}")
    print(f"  {label}")
    print(f"  {script.relative_to(ROOT)} {' '.join(extra_args)}")
    print(f"{'─' * 60}")

    result = subprocess.run([str(PYTHON), str(script), *extra_args], cwd=ROOT)

    if result.returncode != 0:
        print(f"\n[ERROR] {label} failed (exit {result.returncode}).")
        if stop_on_error:
            print("Pipeline stopped.")
            sys.exit(result.returncode)
    else:
        print(f"\n[OK] {label} complete.")

    return result.returncode


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Noble SMM Pipeline Orchestrator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Modes:
  create      Strategist + Creator                    (default)
  animate     Animated pipeline: plan (animated posts) → expand → HTML/CSS per post
  week        Full week pipeline: plan → posts → templates (A-E) → drafts (auto)
  template    Generate HTML/CSS template for a single post (--post N, --type a/b/c/d/e)
  reel-brief  Print a formatted Reel production checklist for --post N (no AI call needed)
  reel-animate  Generate HTML/CSS animated Reel from reels_script for --post N
  design      Asset briefs for Figma/Canva
  visual      Design Agent → AI image prompt + capture
  gemini      Design Agent → Gemini Imagen (prompt + auto-generate image)
  draft       Save ready post as local draft (open in Finder)
  publish   Instagram Agent → publish image to IG
  analyze   Analyzer (run after posts go live)
  moderate  Moderator (run daily)
  full      All agents end-to-end

Examples:
  python orchestrator.py --mode week
  python orchestrator.py --mode week --focus mixed
  python orchestrator.py --mode template --post 1 --type c
  python orchestrator.py --mode template --post 1 --type b --bg designer/assets/backgrounds/barber_chairs.jpg
  python orchestrator.py --mode gemini --post 1
  python orchestrator.py --mode draft --image output/images/noble_post1_typec_....png --post 1
  python orchestrator.py --mode publish --image output/images/hero.png --post 3 --schedule "2026-05-10 10:00"
  python orchestrator.py --mode analyze --mock
  python orchestrator.py --mode moderate --dry-run
        """,
    )

    # ── Mode ──
    parser.add_argument(
        "--mode",
        choices=["create", "week", "reels", "reels-only", "posts-only",
                 "template", "animate", "reel-brief", "reel-animate",
                 "analyze", "moderate", "design", "visual", "gemini",
                 "publish", "draft", "full"],
        default="create",
    )

    # ── Content pipeline args ──
    parser.add_argument("--platform", choices=["instagram", "tiktok", "telegram"], default="instagram")
    parser.add_argument("--period",   choices=["weekly", "monthly"], default="monthly")
    parser.add_argument("--focus",    default="features",
                        choices=["features", "testimonials", "education", "promotional", "engagement", "mixed"])
    parser.add_argument("--posts",    default="all",
                        help="Posts to expand: 'all', '1', '1,3,5', or '1-5' (default: all)")
    parser.add_argument("--design-posts", default="all", dest="design_posts")

    # ── Visual / Design Agent args ──
    parser.add_argument("--topic",    default=None,
                        help="[visual] Post topic for the Design Agent (e.g. 'Автозапис')")
    parser.add_argument("--post",     type=int, default=None,
                        help="[visual/publish] Post number from content_final JSON")
    parser.add_argument("--model",    default="generic",
                        choices=["midjourney", "dalle", "flux", "ideogram", "generic"],
                        help="[visual] Target image generation model (default: generic)")
    parser.add_argument("--capture",  action="store_true",
                        help="[visual] Run capture.py before generating prompt")
    parser.add_argument("--capture-url", default="http://localhost:3000/salon/demo",
                        dest="capture_url",
                        help="[visual] URL for capture.py (default: localhost demo)")
    parser.add_argument("--selector", default=None,
                        help="[visual] CSS selector for capture.py")
    parser.add_argument("--format",   default="portrait",
                        choices=["portrait", "square", "landscape"], dest="fmt",
                        help="[gemini] Instagram image format: portrait 4:5 (default), square 1:1, landscape 1.91:1")

    # ── Template args ──
    parser.add_argument("--type",     default=None,
                        choices=["a","b","c","d","e","f","g","h",
                                 "notification","counter","typewriter","calendar",
                                 "reel_notification","reel_counter","reel_typewriter","reel_calendar"],
                        help="[template/anim] Template type a-h or animation type")
    parser.add_argument("--bg",       default=None,
                        help="[template] Background image path for type-B template")

    # ── Publisher args ──
    parser.add_argument("--image",    type=Path, default=None,
                        help="[publish] Local image file to publish to Instagram")
    parser.add_argument("--image-url", default=None, dest="image_url",
                        help="[publish] Pre-hosted public image URL")
    parser.add_argument("--caption",  default=None,
                        help="[publish] Override caption (default: loaded from content_final)")
    parser.add_argument("--schedule", default=None,
                        help="[publish] Schedule time UTC: 'YYYY-MM-DD HH:MM'")

    # ── Shared flags ──
    parser.add_argument("--dry-run",  action="store_true", dest="dry_run",
                        help="Moderator/Publisher: generate output but do not send/publish")
    parser.add_argument("--mock",     action="store_true",
                        help="Analyzer: simulate metrics without API credentials")
    parser.add_argument("--scan-posts", type=int, default=10, dest="scan_posts",
                        help="Moderator: recent posts to scan (default: 10)")

    args = parser.parse_args()

    print("=" * 60)
    print("  NOBLE SMM PIPELINE")
    print(f"  Mode     : {args.mode.upper()}")
    print(f"  Platform : {args.platform.upper()}")
    if args.mode in ("create", "full"):
        print(f"  Period   : {args.period}")
        print(f"  Focus    : {args.focus}")
        print(f"  Posts    : {args.posts}")
    print("=" * 60)

    run_trends      = args.mode in ("create", "week", "reels", "full")
    run_hooks       = args.mode in ("create", "week", "reels", "full")
    run_hashtags    = args.mode in ("create", "week", "reels", "full")
    run_schedule    = args.mode in ("create", "week", "reels", "full")
    run_create      = args.mode in ("create", "full")
    run_week        = args.mode in ("week",)
    run_reels       = args.mode in ("reels", "reels-only", "posts-only")
    run_template    = args.mode in ("template",)
    run_animate     = args.mode in ("animate",)
    run_reel_brief   = args.mode in ("reel-brief",)
    run_reel_animate = args.mode in ("reel-animate",)
    run_design   = args.mode in ("design", "full")
    run_visual   = args.mode in ("visual",)
    run_gemini   = args.mode in ("gemini",)
    run_publish  = args.mode in ("publish",)
    run_draft    = args.mode in ("draft",)
    run_analyze   = args.mode in ("analyze", "full")
    run_optimize  = args.mode in ("analyze", "full")
    run_report    = args.mode in ("analyze", "full")
    run_engage    = args.mode in ("moderate", "full")
    run_moderate  = args.mode in ("moderate", "full")

    # ── Step 0: Intelligence Layer ───────────────────────────
    if run_trends:
        print("\nStarting TrendScout...")
        run("TrendScout", ROOT / "strategist" / "trend_scout.py", [],
            stop_on_error=False)

        # Quality gate: warn if TrendScout produced empty trends
        import json as _json
        _trend_files = sorted((ROOT / "output" / "trends").glob("trends_*.json"), reverse=True)
        if _trend_files:
            try:
                with open(_trend_files[0]) as _f:
                    _t = _json.load(_f)
                _empty = (
                    not _t.get("trending_audio") and
                    not _t.get("trending_hooks") and
                    not _t.get("trending_topics")
                )
                if _empty:
                    print("\n[WARNING] TrendScout returned empty trends — content will use hardcoded defaults.")
                    print("         Check internet connection or run: python strategist/trend_scout.py --force\n")
                else:
                    _counts = (
                        f"audio={len(_t.get('trending_audio', []))} "
                        f"hooks={len(_t.get('trending_hooks', []))} "
                        f"topics={len(_t.get('trending_topics', []))}"
                    )
                    print(f"[OK] Trends quality check passed ({_counts})")
            except Exception:
                print("\n[WARNING] Could not read trends file for quality check.\n")

    if run_hooks:
        print("\nStarting HookWriter...")
        run("HookWriter", ROOT / "strategist" / "hook_writer.py", [],
            stop_on_error=False)

    if run_hashtags:
        print("\nStarting HashtagResearcher...")
        run("HashtagResearcher", ROOT / "strategist" / "hashtag_researcher.py", [],
            stop_on_error=False)

    if run_schedule:
        print("\nStarting Scheduler...")
        run("Scheduler", ROOT / "strategist" / "scheduler.py", [],
            stop_on_error=False)

    # ── Step 1: Strategist ────────────────────────────────────
    if run_create:
        print("\nStarting Strategist...")
        run("Strategist", ROOT / "strategist" / "plan_generator.py",
            ["--platform", args.platform, "--period", args.period, "--focus", args.focus])

    # ── Step 2: Creator ───────────────────────────────────────
    if run_create:
        print("\nStarting Creator...")
        run("Creator", ROOT / "creator" / "content_expander.py",
            ["--posts", args.posts])

    # ── ANIMATE mode: plan (animated focus) → expand → HTML/CSS per post ──
    if run_animate:
        import json as _json

        print("\n" + "=" * 60)
        print("  ANIMATE PIPELINE")
        print(f"  Platform : {args.platform.upper()}")
        print(f"  Focus    : {args.focus}")
        print("=" * 60)

        # Step A1: Strategist — weekly plan, animated-friendly focus
        print("\n[A1] Strategist — generating plan with animated posts...")
        run("Strategist", ROOT / "strategist" / "plan_generator.py",
            ["--platform", args.platform, "--period", "weekly", "--focus", args.focus])

        # Step A2: Creator — expand all posts (animated posts get animation_brief)
        print("\n[A2] Creator — expanding posts...")
        run("Creator", ROOT / "creator" / "content_expander.py", ["--posts", "all"])

        # Step A3: Find animated posts in the latest content_final
        candidates = sorted(
            (ROOT / "output").glob("content_final_*.json"),
            key=lambda p: p.stat().st_mtime, reverse=True,
        )
        if not candidates:
            print("Error: content_final_*.json not found after Creator step.")
            sys.exit(1)

        with open(candidates[0]) as f:
            content = _json.load(f)

        IS_ANIMATED = {"animated post", "animated", "animation", "motion graphic", "gif"}
        animated_posts = [
            p for p in content.get("posts", [])
            if any(a in p.get("post_type", "").lower() for a in IS_ANIMATED)
            and p.get("animation_brief")
        ]

        if not animated_posts:
            print("\n  [!] No animated posts with animation_brief found in content_final.")
            print("      Re-run with --focus mixed or check the plan includes 'animated post' types.")
        else:
            print(f"\n  Found {len(animated_posts)} animated post(s): "
                  f"{[p['post_number'] for p in animated_posts]}")

            # Step A4: Animation Agent — HTML/CSS for each animated post
            failed = []
            for p in animated_posts:
                pnum = p["post_number"]
                label = f"Animation Agent — post #{pnum}"
                rc = run(label, ROOT / "designer" / "animation_agent.py",
                         ["--post", str(pnum)], stop_on_error=False)
                if rc != 0:
                    failed.append(pnum)

            print(f"\n{'=' * 60}")
            print(f"  ANIMATE PIPELINE COMPLETE")
            print(f"{'=' * 60}")
            print(f"  Animated posts processed : {len(animated_posts)}")
            print(f"  Animations saved         : {len(animated_posts) - len(failed)}")
            if failed:
                print(f"  Failed                   : {failed}")
            print(f"  Drafts folder            : {ROOT / 'output' / 'drafts'}")
            print(f"  Desktop folder           : {Path.home() / 'Desktop' / 'Noble Images'}")
            print(f"{'=' * 60}\n")

    # ── REELS mode: generate full week Reels + Feed posts ────────
    if run_reels:
        print("\n" + "=" * 60)
        print("  REELS WEEK PIPELINE")
        print(f"  Mode: {args.mode.upper()}")
        print("=" * 60)

        reels_args = []
        if args.mode == "reels-only":
            reels_args.append("--reels-only")
        elif args.mode == "posts-only":
            reels_args.append("--posts-only")

        run("Week Reels Generator", ROOT / "generate_week_reels.py", reels_args)

    # ── TEMPLATE mode: generate HTML/CSS template for a single post ──
    if run_template:
        if not args.post:
            print("Error: --mode template requires --post N")
            sys.exit(1)
        if not args.type:
            print("Error: --mode template requires --type a/b/c/d/e")
            sys.exit(1)
        t_args = ["--type", args.type, "--post", str(args.post)]
        if args.bg:
            t_args += ["--bg", args.bg]
        run(f"Template type-{args.type.upper()} post#{args.post}",
            ROOT / "designer" / "template_renderer.py",
            t_args)

    # ── REEL-BRIEF mode: print Reel production checklist for --post N ──
    if run_reel_brief:
        import json as _json

        if not args.post:
            print("Error: --mode reel-brief requires --post N")
            sys.exit(1)

        candidates = sorted(
            (ROOT / "output").glob("content_final_*.json"),
            key=lambda p: p.stat().st_mtime, reverse=True,
        )
        if not candidates:
            print("Error: no content_final_*.json found. Run --mode create first.")
            sys.exit(1)

        with open(candidates[0]) as f:
            content = _json.load(f)

        post = next((p for p in content.get("posts", []) if p.get("post_number") == args.post), None)
        if not post:
            print(f"Error: post #{args.post} not found in {candidates[0].name}")
            sys.exit(1)

        script = post.get("reels_script")
        if not script:
            print(f"Error: post #{args.post} has no reels_script. It may not be a Reel type post.")
            print(f"  post_type: {post.get('post_type')}")
            sys.exit(1)

        border = "=" * 64
        thin   = "─" * 64
        print(f"\n{border}")
        print(f"  REEL PRODUCTION BRIEF — Post #{args.post}")
        print(f"  {candidates[0].name}")
        print(f"{border}")
        print(f"\n  HOOK    : {post.get('hook', '')}")
        print(f"  CAPTION :\n")
        for line in (post.get("caption") or "").split("\n")[:6]:
            print(f"    {line}")
        print(f"\n{thin}")
        print(f"  SHOT LIST")
        print(f"{thin}")
        for sec in script.get("sections", []):
            print(f"\n  [{sec['timestamp']}]  {sec['section'].upper()}")
            print(f"  ON SCREEN : {sec['on_screen_text']}")
            print(f"  ACTION    : {sec['action']}")
            if sec.get("voiceover"):
                print(f"  VOICEOVER : \"{sec['voiceover']}\"")
        print(f"\n{thin}")
        print(f"  AUDIO     : {script.get('audio_note', '—')}")
        print(f"{thin}")
        print(f"  PRODUCTION NOTES:")
        for line in (script.get("production_note") or "").split(". "):
            if line.strip():
                print(f"    • {line.strip().rstrip('.')}.")
        print(f"\n{border}")
        print(f"  DURATION  : {script.get('total_duration', '?')}")
        print(f"  FORMAT    : Vertical 9:16 Reel — film in portrait mode")
        print(f"  EQUIPMENT : iPhone (screen record built-in + second phone for reaction shot)")
        print(f"{border}\n")

        # Save as txt for reference
        brief_path = ROOT / "output" / f"reel_brief_post{args.post}.txt"
        lines = [
            f"REEL BRIEF — Post #{args.post}",
            f"Hook: {post.get('hook', '')}",
            "",
        ]
        for sec in script.get("sections", []):
            lines += [
                f"[{sec['timestamp']}] {sec['section'].upper()}",
                f"ON SCREEN: {sec['on_screen_text']}",
                f"ACTION: {sec['action']}",
            ]
            if sec.get("voiceover"):
                lines.append(f"VOICEOVER: {sec['voiceover']}")
            lines.append("")
        lines += [
            f"AUDIO: {script.get('audio_note', '')}",
            "",
            f"PRODUCTION: {script.get('production_note', '')}",
        ]
        brief_path.write_text("\n".join(lines), encoding="utf-8")
        print(f"  Brief saved: {brief_path}\n")

    # ── REEL-ANIMATE mode: generate HTML/CSS animated Reel for --post N ──
    if run_reel_animate:
        if not args.post:
            print("Error: --mode reel-animate requires --post N")
            sys.exit(1)
        run("Reel Animator", ROOT / "designer" / "reel_animator.py",
            ["--post", str(args.post)])

    # ── WEEK mode: plan → expand all → HTML/CSS templates → drafts ──
    if run_week:
        import json, shutil as _shutil

        print("\n" + "=" * 60)
        print("  WEEK PIPELINE")
        print(f"  Platform : {args.platform.upper()}")
        print(f"  Focus    : {args.focus}")
        print("=" * 60)

        # Step W1: Strategist (weekly)
        print("\n[W1] Strategist — generating weekly plan...")
        run("Strategist", ROOT / "strategist" / "plan_generator.py",
            ["--platform", args.platform, "--period", "weekly", "--focus", args.focus])

        # Step W2: Creator — expand all posts
        print("\n[W2] Creator — expanding all posts...")
        run("Creator", ROOT / "creator" / "content_expander.py", ["--posts", "all"])

        # Step W3: Load posts from latest content_final
        candidates = sorted(
            (ROOT / "output").glob("content_final_*.json"),
            key=lambda p: p.stat().st_mtime, reverse=True,
        )
        if not candidates:
            print("Error: content_final_*.json not found after Creator step.")
            sys.exit(1)

        with open(candidates[0]) as f:
            content = json.load(f)
        posts = content.get("posts", [])
        post_nums = [p["post_number"] for p in posts]

        print(f"\n  Found {len(post_nums)} posts: {post_nums}")

        # Background images for Type B (rotate through available)
        bg_dir = ROOT / "designer" / "assets" / "backgrounds"
        backgrounds = sorted(bg_dir.glob("*.jpg")) + sorted(bg_dir.glob("*.png"))

        # Template type selection by content pillar
        PILLAR_TYPES = {
            "product":      ["g", "f", "b"],
            "features":     ["g", "f", "e"],
            "education":    ["e", "a", "b"],
            "testimonials": ["d", "a", "b"],
            "social_proof": ["d", "g", "b"],
            "promotional":  ["a", "f", "b"],
            "engagement":   ["g", "e", "b"],
        }
        DEFAULT_TYPES = ["g", "f", "b"]

        # Posts 1, 3, 5 (indices 0, 2, 4) get animations — ~3 per week
        animate_indices = set(range(0, len(post_nums), 2))

        # Step W4+: For each post — 3 template types → Draft → Animation
        failed = []
        anim_ok = []

        for i, pdict in enumerate(posts):
            pnum = pdict["post_number"]
            pillar = pdict.get("content_pillar", "product").lower()
            types_for_post = PILLAR_TYPES.get(pillar, DEFAULT_TYPES)
            do_anim = i in animate_indices  # animate every other post regardless of type

            print(f"\n{'─' * 60}")
            print(f"  [{i+1}/{len(post_nums)}] Post #{pnum} — {pillar}" +
                  (" 🎬 +animation" if do_anim else ""))
            print(f"  Templates: {types_for_post}")
            print(f"{'─' * 60}")

            generated_imgs = []

            for t in types_for_post:
                t_args = ["--type", t, "--post", str(pnum)]
                if t in ("b", "g") and backgrounds:
                    bg = backgrounds[i % len(backgrounds)]
                    t_args += ["--bg", str(bg)]
                rc = run(f"Template type-{t.upper()} post#{pnum}",
                         ROOT / "designer" / "template_renderer.py",
                         t_args, stop_on_error=False)
                if rc == 0:
                    imgs = sorted(
                        (ROOT / "output" / "images").glob(f"noble_post{pnum}_type{t}_*.png"),
                        key=lambda p: p.stat().st_mtime, reverse=True,
                    )
                    if imgs:
                        generated_imgs.append((imgs[0], t))

            if not generated_imgs:
                print(f"  [!] All templates failed for post #{pnum} — skipping draft")
                failed.append(pnum)
                continue

            primary_img, _ = generated_imgs[0]

            # Save draft with primary image
            draft_args = ["--draft", "--image", str(primary_img), "--post", str(pnum)]
            run(f"Draft post#{pnum}",
                ROOT / "publisher" / "instagram_agent.py",
                draft_args, stop_on_error=False)

            # Copy extra template variations into the draft folder
            draft_dirs = sorted(
                (ROOT / "output" / "drafts").glob(f"post{pnum}_*"),
                key=lambda p: p.stat().st_mtime, reverse=True,
            )
            if draft_dirs:
                draft_dir = draft_dirs[0]
                if len(generated_imgs) > 1:
                    for img_path, ttype in generated_imgs[1:]:
                        _shutil.copy(img_path, draft_dir / f"image_type{ttype}.png")
                        print(f"  → Saved {draft_dir.name}/image_type{ttype}.png")

                # CSS animation for every other post — uses the primary template type
                if do_anim:
                    primary_type = types_for_post[0]
                    print(f"\n  [🎬] Animating type-{primary_type.upper()} for post #{pnum}...")
                    anim_args = ["--type", primary_type, "--post", str(pnum)]
                    # Pass background for types that need it
                    if primary_type in ("b", "g") and backgrounds:
                        anim_args += ["--bg", str(backgrounds[i % len(backgrounds)])]
                    rc_anim = run(f"CSS Animation post#{pnum}",
                                  ROOT / "designer" / "css_animator.py",
                                  anim_args, stop_on_error=False)
                    if rc_anim == 0:
                        mp4s = sorted(
                            (ROOT / "output" / "videos").glob(
                                f"noble_post{pnum}_type{primary_type}_anim_*.mp4"),
                            key=lambda p: p.stat().st_mtime, reverse=True,
                        )
                        if mp4s:
                            _shutil.copy(mp4s[0], draft_dir / "animation.mp4")
                            print(f"  → Saved {draft_dir.name}/animation.mp4")
                            anim_ok.append(pnum)

        anim_posts = [post_nums[j] for j in animate_indices if j < len(post_nums)]
        print(f"\n{'=' * 60}")
        print(f"  WEEK PIPELINE COMPLETE")
        print(f"{'=' * 60}")
        print(f"  Posts processed : {len(post_nums)}")
        print(f"  Drafts saved    : {len(post_nums) - len(failed)}")
        print(f"  Animations done : {len(anim_ok)}/{len(anim_posts)} " +
              f"(posts {anim_posts})")
        if failed:
            print(f"  Failed          : {failed}")
        print(f"  Drafts folder   : {ROOT / 'output' / 'drafts'}")
        print(f"  Desktop folder  : {Path.home() / 'Desktop' / 'Noble Images'}")
        print(f"{'=' * 60}\n")

    # ── Step 3: Asset Designer (briefs) ───────────────────────
    if run_design:
        print("\nStarting Asset Designer...")
        run("Asset Designer", ROOT / "designer" / "asset_generator.py",
            ["--posts", args.design_posts])

    # ── Step 3b: Design Agent (AI image prompt) ───────────────
    if run_visual:
        if not args.topic and not args.post:
            print("Error: --mode visual requires --topic 'some topic' and/or --post N")
            sys.exit(1)

        agent_args = ["--model", args.model]
        if args.topic:
            agent_args += ["--topic", args.topic]
        if args.post:
            agent_args += ["--post", str(args.post)]
        if args.capture:
            agent_args.append("--capture")
            agent_args += ["--url", args.capture_url]
            if args.selector:
                agent_args += ["--selector", args.selector]

        print("\nStarting Design Agent...")
        run("Design Agent", ROOT / "designer" / "design_agent.py", agent_args)

        print("\n  ── Waiting for you ─────────────────────────────────")
        print("  1. Copy the prompt above.")
        print("  2. Generate the image in Midjourney / DALL-E / Flux.")
        print("  3. Save the result to:  output/images/ai_<post>.png")
        print("  4. Run:  python orchestrator.py --mode publish --image output/images/ai_<post>.png" +
              (f" --post {args.post}" if args.post else ""))
        print("  ─────────────────────────────────────────────────────\n")

    # ── Step 3b-2: Gemini Imagen (screenshot + prompt → image) ──
    if run_gemini:
        if not args.topic and not args.post:
            print("Error: --mode gemini requires --topic 'some topic' and/or --post N")
            sys.exit(1)

        agent_args = ["--model", "generic", "--generate", "--format", args.fmt]
        if args.topic:
            agent_args += ["--topic", args.topic]
        if args.post:
            agent_args += ["--post", str(args.post)]
        # Pass capture settings — design_agent will forward to gemini_generator
        if args.capture:
            agent_args.append("--capture")
            agent_args += ["--url", args.capture_url]
            if args.selector:
                agent_args += ["--selector", args.selector]

        print("\nStarting Design Agent + Gemini Imagen...")
        print("  Noble UI screenshot will be used as visual reference.")
        run("Design Agent → Gemini Imagen", ROOT / "designer" / "design_agent.py", agent_args)

        print("\n  ── Image generated ─────────────────────────────────")
        print(f"  Images saved to: output/images/  and  ~/Desktop/Noble Images/")
        print("  Next: python orchestrator.py --mode publish --image output/images/<file>.png" +
              (f" --post {args.post}" if args.post else ""))
        print("  ─────────────────────────────────────────────────────\n")

    # ── Step 3c: Publisher (Instagram) ────────────────────────
    if run_publish:
        if not args.image and not args.image_url:
            print("Error: --mode publish requires --image <path> or --image-url <url>")
            sys.exit(1)

        pub_args = []
        if args.image:
            pub_args += ["--image", str(args.image)]
        if args.image_url:
            pub_args += ["--image-url", args.image_url]
        if args.post:
            pub_args += ["--post", str(args.post)]
        if args.caption:
            pub_args += ["--caption", args.caption]
        if args.schedule:
            pub_args += ["--schedule", args.schedule]
        if args.dry_run:
            pub_args.append("--dry-run")

        print("\nStarting Instagram Publisher...")
        run("Instagram Publisher", ROOT / "publisher" / "instagram_agent.py", pub_args)

    # ── Step 3d: Draft (Instagram Content Planner) ────────────
    if run_draft:
        if not args.image and not args.image_url:
            print("Error: --mode draft requires --image <path> or --image-url <url>")
            sys.exit(1)

        draft_args = ["--draft"]
        if args.image:
            draft_args += ["--image", str(args.image)]
        if args.image_url:
            draft_args += ["--image-url", args.image_url]
        if args.post:
            draft_args += ["--post", str(args.post)]
        if args.caption:
            draft_args += ["--caption", args.caption]

        print("\nSaving post as Instagram draft...")
        run("Instagram Draft", ROOT / "publisher" / "instagram_agent.py", draft_args)

    # ── Step 4: Analytics Layer ───────────────────────────────
    if run_analyze:
        analyzer_args = ["--mock"] if args.mock else []
        label = "PerformanceTracker" + (" [MOCK]" if args.mock else "")
        print(f"\nStarting {label}...")
        run(label, ROOT / "analyzer" / "performance_tracker.py", analyzer_args, stop_on_error=False)

    if run_optimize:
        print("\nStarting ContentOptimizer...")
        run("ContentOptimizer", ROOT / "analyzer" / "content_optimizer.py", [],
            stop_on_error=False)

    if run_report:
        print("\nStarting GrowthReporter...")
        run("GrowthReporter", ROOT / "analyzer" / "growth_reporter.py", [],
            stop_on_error=False)

    # ── Step 5: Engagement + Moderation ───────────────────────
    if run_engage:
        engage_args = ["--dry-run"] if not os.environ.get("INSTAGRAM_ACCESS_TOKEN") else []
        print("\nStarting ProactiveEngager...")
        run("ProactiveEngager", ROOT / "publisher" / "proactive_engager.py",
            engage_args, stop_on_error=False)

    if run_moderate:
        mod_args = ["--posts", str(args.scan_posts)]
        if args.dry_run:
            mod_args.append("--dry-run")
        print("\nStarting Moderator...")
        run("Moderator", ROOT / "moderator" / "comment_responder.py", mod_args)

    print(f"\n{'=' * 60}")
    print("  Pipeline finished!")
    print(f"  Output → {ROOT / 'output'}")
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    main()
