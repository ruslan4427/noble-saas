"""
Noble Weekly Content Refresh System
====================================
Every week = new THEME + new MUSIC + new PHOTOS/VIDEOS + new content around that theme.

WHY:
- Returning audience gets bored if the visual style never changes
- New theme = new hook angle = new reason to stop scrolling
- Fresh music keeps the reel energy feeling current
- Rotating visual style prevents "ad blindness" from repeat visitors

RULE: Every Monday when starting a new week cycle, run generate_week_theme() first.
      All other agents (designer, creator, reel gen) read the active theme from ACTIVE_WEEK_THEME.

Import from here:
  from strategist.weekly_refresh import WEEK_THEMES, generate_week_theme, CONTENT_FUNNEL
"""

from pathlib import Path
from datetime import date

# ── Content Funnel — how the weekly content moves audience toward conversion ──
#
# Every week's 7 posts must hit all 4 funnel stages in sequence.
# This is not optional — skipping a stage loses conversions.
#
CONTENT_FUNNEL = {
    "stages": [
        {
            "stage":     1,
            "name":      "ATTRACT",
            "goal":      "Stop the scroll. Get someone who has never heard of Noble to pause.",
            "emotion":   "Recognition — 'this is exactly my problem'",
            "tone":      "Relatable, peer-level, no selling. Mirror their frustration back at them.",
            "best_types":["reel", "reel_animation_only", "portrait (video+animated)"],
            "day_of_week": "Monday or Tuesday",
            "hook_style": "Problem-first. 'Most barbers get this wrong.' / 'You're losing clients and don't know it.'",
            "cta":        "None or very soft: 'Save this' / 'Sound familiar?'",
        },
        {
            "stage":     2,
            "name":      "ENGAGE",
            "goal":      "Get them to interact — saves, comments, shares, replies. Build algorithm trust.",
            "emotion":   "Curiosity + value — 'I learned something useful'",
            "tone":      "Educational, specific numbers, practical advice they can use TODAY without Noble.",
            "best_types":["carousel", "feed_post (type E checklist)", "story (poll/question)", "portrait (image+static)"],
            "day_of_week": "Tuesday or Wednesday",
            "hook_style": "List/how-to: '5 signs your barbershop needs booking software' / 'How top barbers cut no-shows in half'",
            "cta":        "Soft: 'Save for later' / 'Tag a barber who needs this'",
        },
        {
            "stage":     3,
            "name":      "CONVINCE",
            "goal":      "Show proof that Noble works. Overcome skepticism with real results.",
            "emotion":   "Trust — 'other shops like mine are doing this'",
            "tone":      "Social proof, specific numbers (47 bookings, $3,240/month), before/after contrast.",
            "best_types":["feed_post (type D reviews)", "reel (stats counter)", "portrait (video+animated)", "animated_post (counter)"],
            "day_of_week": "Thursday or Friday",
            "hook_style": "Result-first: '47 bookings. $3,240 revenue. Zero phone calls.' / 'Before Noble: 12 DMs a day. After: 0.'",
            "cta":        "Medium: 'See how at noblelink.app' / 'Link in bio'",
        },
        {
            "stage":     4,
            "name":      "CONVERT",
            "goal":      "Direct push to sign up. Audience is warm — now ask them to act.",
            "emotion":   "Urgency + low-risk: 'I can try this for free'",
            "tone":      "Direct, specific offer, remove friction: free trial, 5-min setup, no credit card.",
            "best_types":["reel (notification/calendar demo)", "feed_post (type A bold)", "portrait (image+animated)", "animated_post"],
            "day_of_week": "Saturday (day 6 ONLY — NEVER Sunday)",
            "hook_style": "CTA-first: 'Your booking page is ready in 5 minutes.' / '14 days free. No excuses.'",
            "cta":        "Strong: 'Start free → noblelink.app' / 'Try free for 14 days — link in bio'",
        },
    ],
    # W23 data: promotional Sunday Reel hit 25.94% ER (worst); Saturday Engagement Feed 56.46% ER.
    # Barbers are mentally off on Sundays — community content only, never CONVERT.
    "sunday_rule": "ENGAGE",
    "weekly_arc": (
        "Mon → ATTRACT (reel, problem hook) → "
        "Tue/Wed → ENGAGE (carousel or feed, education) → "
        "Thu → CONVINCE (stats/proof, reel or feed) → "
        "Fri/Sat → CONVERT (demo or bold CTA) → "
        "Sun → ENGAGE ONLY (story poll or portrait — NO selling, NO CTA)"
    ),
    "rule": "At least 1 post per funnel stage per week. Never 3+ consecutive ATTRACT posts — that's awareness without conversion.",
}


# ── Weekly Theme Library ──────────────────────────────────────────────────────
#
# Each theme has:
#   name        — internal ID (used in file names)
#   title       — the narrative angle for the week (what story are we telling?)
#   hook_premise— the central idea all posts revolve around
#   visual_mood — describes photo/video style for Leonardo AI and Pexels searches
#   leo_prompt  — Leonardo AI photo prompt for feed/portrait templates
#   pexels_query— search keywords for Pexels barbershop video backgrounds
#   music_mood  — describes the energy/vibe for music selection
#   music_bpm   — target BPM range for background tracks
#   color_accent— optional extra accent color (on top of brand gold #C9A84C)
#   week_arc    — 7-post story arc: what each day says, tied to funnel
#
WEEK_THEMES = [

    {
        "name":         "midnight_grind",
        "title":        "The midnight grind — what separates busy shops from empty ones",
        "hook_premise": "The best barbers in your city are getting booked while you sleep. Here's why.",
        "visual_mood":  "Dark, moody, late-night barbershop atmosphere. Gold scissors gleam under shop lights. Lone barber in a neon-lit shop at night.",
        "leo_prompt":   "Professional barbershop at night, warm golden lights inside, dark street outside, dramatic contrast, cinematic photography, photorealism",
        "pexels_query": "barbershop night interior dark moody",
        "music_mood":   "Dark hip-hop instrumental, confident, late-night energy",
        "music_bpm":    "85–95",
        "color_accent": "#C9A84C",
        "week_arc": [
            {"day": 1, "funnel": "ATTRACT",  "angle": "Barbers who get booked at 2am (while you're asleep) — here's their secret"},
            {"day": 2, "funnel": "ENGAGE",   "angle": "5 things top shops do differently on Instagram"},
            {"day": 3, "funnel": "ENGAGE",   "angle": "Your DM inbox is a waiting room. Time to close it."},
            {"day": 4, "funnel": "CONVINCE", "angle": "47 bookings. $3,240 revenue. Zero phone calls. One week."},
            {"day": 5, "funnel": "CONVINCE", "angle": "Before Noble: chaos. After: calendar full. Real numbers."},
            {"day": 6, "funnel": "CONVERT",  "angle": "Your booking page is live in 5 minutes. Tonight."},
            {"day": 7, "funnel": "ENGAGE",   "angle": "Poll: How do you take bookings right now? (DM / WhatsApp / other)"},
        ],
    },

    {
        "name":         "no_show_killer",
        "title":        "No-shows are costing you $800/month — here's the fix",
        "hook_premise": "Every no-show is $30–$50 gone. Noble sends automatic SMS reminders so clients actually show up.",
        "visual_mood":  "Close-up barbershop tools — clippers, combs, cape — sharp, clean, professional. Empty chair = problem. Full shop = solution.",
        "leo_prompt":   "Barbershop tools flat lay, professional clippers and scissors on dark surface, gold and black tones, commercial photography, sharp focus",
        "pexels_query": "barbershop tools clippers close up",
        "music_mood":   "Upbeat trap/R&B, confident energy, medium pace",
        "music_bpm":    "100–115",
        "color_accent": "#C9A84C",
        "week_arc": [
            {"day": 1, "funnel": "ATTRACT",  "angle": "That empty chair at 2pm cost you $45. And it happens 3x a week."},
            {"day": 2, "funnel": "ENGAGE",   "angle": "Why clients ghost: the uncomfortable truth about barbershop no-shows"},
            {"day": 3, "funnel": "ENGAGE",   "angle": "Checklist: 5 things you can do TODAY to cut no-shows in half"},
            {"day": 4, "funnel": "CONVINCE", "angle": "Noble sends SMS 2h before every appointment. No-shows dropped 60% for this shop."},
            {"day": 5, "funnel": "CONVINCE", "angle": "Screenshot: 'I had 8 no-shows last month. This month: 1.' — @FadeKing"},
            {"day": 6, "funnel": "CONVERT",  "angle": "Try Noble free 14 days. If no-shows don't drop — cancel. Zero risk."},
            {"day": 7, "funnel": "ENGAGE",   "angle": "How many no-shows do you get per week? (poll: 0-1 / 2-3 / 4+)"},
        ],
    },

    {
        "name":         "your_link_your_brand",
        "title":        "Your own booking link — your shop looks like a business, not a DM thread",
        "hook_premise": "noblelink.app/salon/yourname — your shop has its own URL. Clients book directly. No app download.",
        "visual_mood":  "Clean, modern barbershop interior — white walls, plants, marble counter, lifestyle photography. Aspirational but achievable.",
        "leo_prompt":   "Modern barbershop interior, clean minimalist design, warm lighting, leather barber chairs, professional atmosphere, lifestyle photography",
        "pexels_query": "modern barbershop interior lifestyle",
        "music_mood":   "Lo-fi hip-hop, smooth, aspirational, chill confidence",
        "music_bpm":    "75–90",
        "color_accent": "#C9A84C",
        "week_arc": [
            {"day": 1, "funnel": "ATTRACT",  "angle": "Your competitor has a booking link. You have a DM inbox. Which one gets more clients?"},
            {"day": 2, "funnel": "ENGAGE",   "angle": "How to get your first 20 online bookings (step by step, with Noble)"},
            {"day": 3, "funnel": "ENGAGE",   "angle": "Share your booking link on your bio, stories, and Google Business. Here's how."},
            {"day": 4, "funnel": "CONVINCE", "angle": "This shop added their Noble link to Instagram bio. Bookings went up 40% in 2 weeks."},
            {"day": 5, "funnel": "CONVINCE", "angle": "What clients see when they book via Noble (clean, fast, mobile-first walkthrough)"},
            {"day": 6, "funnel": "CONVERT",  "angle": "Your shop link is: noblelink.app/salon/[yourname]. Set it up in 5 minutes."},
            {"day": 7, "funnel": "ENGAGE",   "angle": "Do you currently have a booking link? (Yes / No / What's that?)"},
        ],
    },

    {
        "name":         "barber_math",
        "title":        "Barber math: what your chair is actually worth per hour",
        "hook_premise": "If your chair earns $40/cut × 8 cuts/day = $320/day. One missed slot = $40 gone. Noble fills the gaps.",
        "visual_mood":  "Busy barbershop energy — multiple chairs, clients, activity. Cash on counter. Full appointment book. Hustle aesthetic.",
        "leo_prompt":   "Busy barbershop interior with multiple barbers working, clients in chairs, energetic atmosphere, urban style, documentary photography",
        "pexels_query": "busy barbershop multiple chairs clients",
        "music_mood":   "High-energy hip-hop, motivational, confident, fast-paced",
        "music_bpm":    "110–128",
        "color_accent": "#C9A84C",
        "week_arc": [
            {"day": 1, "funnel": "ATTRACT",  "angle": "Your chair makes $40/hour when it's full. What does it make when it's empty?"},
            {"day": 2, "funnel": "ENGAGE",   "angle": "The real cost of a slow Tuesday: barber math most shop owners ignore"},
            {"day": 3, "funnel": "ENGAGE",   "angle": "How to fill your slow days without discounting — 5 strategies"},
            {"day": 4, "funnel": "CONVINCE", "angle": "This shop went from 5 to 8 clients/day in 3 weeks. Here's the only thing that changed."},
            {"day": 5, "funnel": "CONVINCE", "angle": "$3,200 extra in one month. Same shop, same prices. Just added online booking."},
            {"day": 6, "funnel": "CONVERT",  "angle": "Every empty slot is money left on the table. Noble fills it. Start free today."},
            {"day": 7, "funnel": "ENGAGE",   "angle": "What's your average clients per day? (1-5 / 6-10 / 10+)"},
        ],
    },

    {
        "name":         "five_minute_setup",
        "title":        "5 minutes to a fully automated barbershop — no tech skills needed",
        "hook_premise": "Noble setup takes less time than a skin fade. Staff schedules, services, booking link — done in 5 minutes.",
        "visual_mood":  "Hands-on phone screenshots — Noble UI walkthrough, booking page, clean mobile interface. Quick, effortless, modern.",
        "leo_prompt":   "Barber holding smartphone showing booking app interface, close-up hands, barbershop background, professional lifestyle photo",
        "pexels_query": "barber smartphone mobile app booking",
        "music_mood":   "Upbeat pop/electronic, light, quick, energetic setup vibe",
        "music_bpm":    "120–130",
        "color_accent": "#C9A84C",
        "week_arc": [
            {"day": 1, "funnel": "ATTRACT",  "angle": "I set up my entire shop's online booking in the time it takes to do a beard trim."},
            {"day": 2, "funnel": "ENGAGE",   "angle": "Step-by-step: how to set up Noble in 5 minutes (no tech skills needed)"},
            {"day": 3, "funnel": "ENGAGE",   "angle": "3 things most barbers worry about when switching to online booking (and why they're wrong)"},
            {"day": 4, "funnel": "CONVINCE", "angle": "'I thought it would be complicated. I was done in 4 minutes.' — actual Noble user"},
            {"day": 5, "funnel": "CONVINCE", "angle": "What Noble looks like on your phone (full walkthrough video)"},
            {"day": 6, "funnel": "CONVERT",  "angle": "14-day free trial. If it takes more than 10 minutes to set up, tell us. Start → noblelink.app"},
            {"day": 7, "funnel": "ENGAGE",   "angle": "What's stopping you from trying online booking? (Too complicated / Not sure clients will use it / Happy with DMs / Just trying now)"},
        ],
    },

    {
        "name":         "weekend_warrior",
        "title":        "Saturday is your biggest day — are you ready for it?",
        "hook_premise": "Saturday = full shop + walk-ins + DMs + calls. Noble handles all the scheduling so you can focus on the craft.",
        "visual_mood":  "Weekend barbershop energy — packed chairs, waiting area, barbers in flow state. Saturated, warm, golden hour light.",
        "leo_prompt":   "Saturday barbershop scene, full chairs, warm late afternoon sunlight through window, barbers working, cinematic golden hour photography",
        "pexels_query": "barbershop saturday busy weekend haircut",
        "music_mood":   "Weekend vibes — smooth R&B, laid-back confidence, warm and rich",
        "music_bpm":    "90–105",
        "color_accent": "#C9A84C",
        "week_arc": [
            {"day": 1, "funnel": "ATTRACT",  "angle": "On Saturday your shop runs on chaos. Your competitor's runs on a schedule."},
            {"day": 2, "funnel": "ENGAGE",   "angle": "How to prepare your Saturday appointments the night before (takes 5 minutes)"},
            {"day": 3, "funnel": "ENGAGE",   "angle": "Walk-ins vs. appointments: which is actually better for your income?"},
            {"day": 4, "funnel": "CONVINCE", "angle": "This shop took 47 bookings last Saturday. Zero of them came through DM."},
            {"day": 5, "funnel": "CONVINCE", "angle": "Before: Saturday DMs from 7am. After Noble: phone on airplane mode. Calendar full."},
            {"day": 6, "funnel": "CONVERT",  "angle": "This Saturday, let Noble handle the bookings. You just cut hair. Start free → noblelink.app"},
            {"day": 7, "funnel": "ENGAGE",   "angle": "Saturday poll: Do you prefer walk-ins or scheduled appointments? (Walk-ins / Appointments / Mix of both)"},
        ],
    },

    {
        "name":         "client_loyalty",
        "title":        "Regular clients = reliable income — how to keep them coming back",
        "hook_premise": "A regular client is worth $500+/year. Noble's automatic reminders and booking history keep them loyal.",
        "visual_mood":  "Barber-client relationship — genuine conversation, trust, craft close-up. Warm, human, aspirational. Real barbershop moments.",
        "leo_prompt":   "Barber and client conversation, warm relationship, professional barbershop setting, genuine smile, portrait photography, editorial style",
        "pexels_query": "barber client relationship trust haircut",
        "music_mood":   "Smooth soul/jazz-hop, warm, relationship-focused, nostalgic but modern",
        "music_bpm":    "80–95",
        "color_accent": "#C9A84C",
        "week_arc": [
            {"day": 1, "funnel": "ATTRACT",  "angle": "A client who comes every 3 weeks is worth $600/year. Are you making it easy for them to come back?"},
            {"day": 2, "funnel": "ENGAGE",   "angle": "5 ways top barbers build loyalty (beyond just a good cut)"},
            {"day": 3, "funnel": "ENGAGE",   "angle": "The re-booking trick: how to fill next week's slots while you're still cutting"},
            {"day": 4, "funnel": "CONVINCE", "angle": "Noble remembers client history so you can greet them like a regular — even on their 2nd visit"},
            {"day": 5, "funnel": "CONVINCE", "angle": "'My regulars book themselves now. I just see them when they come in.' — Noble user"},
            {"day": 6, "funnel": "CONVERT",  "angle": "Build your loyal client base on autopilot. 14 days free → noblelink.app"},
            {"day": 7, "funnel": "ENGAGE",   "angle": "How many of your clients book 2+ times per month? (Most / Some / Very few)"},
        ],
    },
]


# ── Active Theme Loader ────────────────────────────────────────────────────────

THEME_ROTATION_FILE = Path(__file__).parent.parent / "data" / "active_theme.json"


def get_active_theme() -> dict:
    """
    Returns the current week's active theme dict.
    Reads from data/active_theme.json if it exists; falls back to first theme.
    """
    import json
    if THEME_ROTATION_FILE.exists():
        with open(THEME_ROTATION_FILE) as f:
            data = json.load(f)
        theme_name = data.get("theme_name")
        for t in WEEK_THEMES:
            if t["name"] == theme_name:
                return t
    return WEEK_THEMES[0]


def generate_week_theme(theme_name: str = None, week_number: int = None) -> dict:
    """
    Set the active theme for this week.
    Pass theme_name to pick a specific one, or week_number to auto-rotate.

    Usage:
        theme = generate_week_theme("no_show_killer")
        theme = generate_week_theme(week_number=3)   # cycles through WEEK_THEMES
    """
    import json

    if theme_name:
        theme = next((t for t in WEEK_THEMES if t["name"] == theme_name), None)
        if not theme:
            raise ValueError(f"Theme '{theme_name}' not found. Options: {[t['name'] for t in WEEK_THEMES]}")
    elif week_number is not None:
        theme = WEEK_THEMES[week_number % len(WEEK_THEMES)]
    else:
        theme = WEEK_THEMES[0]

    THEME_ROTATION_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(THEME_ROTATION_FILE, "w") as f:
        json.dump({
            "theme_name": theme["name"],
            "set_on":     str(date.today()),
            "title":      theme["title"],
        }, f, indent=2)

    print(f"\n✓ Active theme set: {theme['name']}")
    print(f"  Title:   {theme['title']}")
    print(f"  Photos:  {theme['leo_prompt'][:60]}...")
    print(f"  Music:   {theme['music_mood']} ({theme['music_bpm']} BPM)")
    print(f"  Pexels:  {theme['pexels_query']}")
    print(f"\n  Weekly arc:")
    for day in theme["week_arc"]:
        print(f"    Day {day['day']} [{day['funnel']:8s}] {day['angle']}")

    return theme


def get_funnel_stage_for_day(day_number: int) -> dict:
    """Returns the funnel stage dict for a given day position in the week."""
    default_map = {1: "ATTRACT", 2: "ENGAGE", 3: "ENGAGE", 4: "CONVINCE", 5: "CONVINCE", 6: "CONVERT", 7: "ENGAGE"}
    stage_name = default_map.get(day_number, "ENGAGE")
    return next((s for s in CONTENT_FUNNEL["stages"] if s["name"] == stage_name), CONTENT_FUNNEL["stages"][1])


# ── Weekly Refresh Checklist (for human/agent running the cycle) ─────────────

WEEKLY_REFRESH_CHECKLIST = """
NOBLE WEEKLY CONTENT REFRESH — run every Monday before content generation
==========================================================================

STEP 1 — Choose this week's theme
  from strategist.weekly_refresh import generate_week_theme
  generate_week_theme("theme_name")   ← pick from WEEK_THEMES
  OR: generate_week_theme(week_number=N)  ← auto-rotate

  Available themes: midnight_grind, no_show_killer, your_link_your_brand,
                    barber_math, five_minute_setup, weekend_warrior, client_loyalty

STEP 2 — Generate new background PHOTOS (Leonardo AI)
  Use theme["leo_prompt"] as the prompt.
  Generate 3–5 images: 1 square (1080×1080) for feed, 1 portrait (1080×1350) for 4:5 posts.
  Save to: ~/Desktop/Noble Images/

STEP 3 — Download new background VIDEOS (Pexels)
  Use theme["pexels_query"] to search.
  Download 2–3 barbershop videos.
  Save to: ~/Desktop/Noble Images/Week Content/video_backgrounds/

STEP 4 — Select new MUSIC track
  Match theme["music_mood"] and theme["music_bpm"].
  Download from Epidemic Sound, Artlist, or free sources.
  Save as .mp3 to: ~/Desktop/Noble Images/Week Content/music/
  Replace the existing file (only 1 active track at a time).

STEP 5 — Generate content using the theme
  Every post this week uses:
  - theme["leo_prompt"] photos as bg_image in type B/G/H/portrait templates
  - new video from video_backgrounds/ for reel compositing
  - new music track for all MP4 outputs
  - week_arc[day-1]["angle"] as the hook/concept for each day's content

STEP 6 — Follow the funnel arc (non-negotiable)
  Day 1: ATTRACT  → reel or reel_animation_only
  Day 2: ENGAGE   → carousel or checklist feed post
  Day 3: ENGAGE   → education post (different format from Day 2)
  Day 4: CONVINCE → stats/proof reel or feed post
  Day 5: CONVINCE → testimonial or product demo
  Day 6: CONVERT  → direct CTA reel or animated portrait
  Day 7: ENGAGE   → story (poll) — MANUAL POST via app
"""


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        generate_week_theme(sys.argv[1])
    else:
        print(WEEKLY_REFRESH_CHECKLIST)
        print("\nAvailable themes:")
        for t in WEEK_THEMES:
            print(f"  {t['name']:25s} — {t['title']}")
