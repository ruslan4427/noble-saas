NOBLE_BRAND_CONTEXT = """
Noble is a SaaS online booking platform for barbershops and hair salons.

PRODUCT FACTS:
- Salon owners get a public booking page at noblelink.app/salon/their-name
- Setup takes 5 minutes, zero code required
- Staff management: schedules, breaks, days off, vacation blocks
- Service catalog with pricing and duration
- Automatic SMS reminders 2 hours before appointments (cuts no-shows in half)
- Email confirmations for every booking
- Calendar view for owners to see all upcoming appointments
- 14-day free trial, then $15/month
- Mobile-first: works perfectly on phones (owners and clients)

TARGET AUDIENCE:
- Barbershop and salon owners aged 25–45
- Active on Instagram and TikTok
- Currently taking bookings via DMs, WhatsApp, or phone calls
- Frustrated by no-shows, missed messages, and double-bookings
- Want to look professional without spending money on a website

KEY PAIN POINTS WE SOLVE:
- "I spend 30 minutes a day answering 'are you free at 3pm?' messages"
- "Clients forget and don't show up"
- "I lose clients because I miss DMs while cutting"
- "I want my own link to share on Instagram but can't afford a website"

BRAND VOICE:
- Confident and direct — no corporate fluff
- Speaks like a peer, not a salesperson
- Practical: shows specific benefit, not vague promises
- Uses real barbershop/salon language
- Short sentences. Active voice.

CONTENT PILLARS:
1. Education — how to run a better salon business
2. Product — show what Noble does (screen demos, walkthroughs)
3. Social proof — owner testimonials, before/after (chaos vs. organized)
4. Engagement — questions, polls, relatable barbershop moments
5. Promotional — free trial CTAs, limited offers

CALL TO ACTION:
- Primary: "Start free at noblelink.app"
- Secondary: "Link in bio" / "Try free for 14 days"
- Never: pushy, desperate, or overly salesy language
"""

PLATFORM_FORMATS = {
    "instagram": {
        "post_types": ["reel", "reel_animation_only", "feed_post", "portrait", "carousel", "story", "animated_post"],
        "caption_length": "150–300 words (feed/carousel/portrait); 1–3 sentences (reel); none (story)",
        "hashtags": "20–25 relevant hashtags (not on stories)",
        "best_times": "Tue–Fri, 9–11am or 6–8pm",
        "tone_note": (
            "Visual-first. Hook on line 1 always. "
            "reel = reach/new audience, 1080×1920, 7–15s, trending audio required, Pexels video bg + Noble alpha composite. "
            "reel_animation_only = same as reel but CSS-only dark bg (no Pexels video), faster to produce, + optional voice. "
            "feed_post = saves/evergreen, 1080×1080 PNG, templates A (bold), B (photo), C (iPhone), D (reviews), E (checklist). "
            "portrait = 1080×1350 (4:5), takes more screen space in feed; 4 sub-types: "
            "  (1) image+animated text MP4, (2) video+animated text MP4, (3) video+static text MP4, (4) image+static PNG. "
            "carousel = education/saves, 2–10 slides 1080×1080, one idea per slide. "
            "story = existing followers only, 24h, poll/question sticker, MANUAL POST only. "
            "animated_post = product demo in feed, 5–12s MP4, HTML/CSS via css_animator."
        ),
    },
    "tiktok": {
        "post_types": ["short video (15–30s)", "tutorial (60s)", "POV story"],
        "caption_length": "1–3 sentences max",
        "hashtags": "5–8 trending + niche hashtags",
        "best_times": "Mon–Fri, 7–9am or 7–9pm",
        "tone_note": "Casual, fast, relatable. Hook in first 2 seconds.",
    },
    "telegram": {
        "post_types": ["text post", "image with text", "poll", "announcement"],
        "caption_length": "100–200 words",
        "hashtags": "None (not used on Telegram)",
        "best_times": "Mon/Wed/Fri, 10am or 7pm",
        "tone_note": "Direct and informative. Community-first tone.",
    },
}

CONTENT_TYPE_TO_PILLAR = {
    "reel":                ["Awareness", "Promotional", "Weekend Stats"],
    "reel_animation_only": ["Awareness", "Promotional"],
    "feed_post":           ["Social Proof", "Product", "Education"],
    "portrait":            ["Awareness", "Product", "Social Proof"],
    "carousel":            ["Education", "Engagement"],
    "story":               ["Engagement"],
    "animated_post":       ["Product", "Promotional"],
}

PILLAR_TO_CONTENT_TYPE = {
    "Awareness":     "reel",
    "Education":     "carousel",
    "Product Demo":  "reel",
    "Social Proof":  "feed_post",
    "Promotional":   "reel",
    "Weekend Stats": "reel",
    "Engagement":    "story",
}

CONTENT_FOCUS_DESCRIPTIONS = {
    "features": "Focus on specific Noble features. Show what they do, why they matter.",
    "testimonials": "Focus on real results and social proof from salon owners using Noble.",
    "education": "Focus on tips for running a better salon business (not always about Noble).",
    "promotional": "Focus on trial offers, pricing, and direct conversion.",
    "engagement": "Focus on community, polls, relatable barbershop content to build audience.",
    "mixed": "Balanced mix across all pillars: education, product, social proof, engagement, promo.",
}

# ── Weekly Refresh Context (injected into plan_generator when theme is active) ─
WEEKLY_REFRESH_RULES = """
WEEKLY CONTENT SYSTEM:
Every week has a THEME — a single narrative angle that all 7 posts revolve around.
The theme provides: hook premise, visual mood, photo prompts, music energy.
Read the active theme from: data/active_theme.json  (set via strategist/weekly_refresh.py)

CONTENT FUNNEL — every week must hit all 4 stages in order:
  Day 1     → ATTRACT:  Problem-first hook. Make them recognize their pain. No selling. Soft CTA.
  Day 2–3   → ENGAGE:   Education, list, checklist. Teach something useful. Build save/share. Soft CTA.
  Day 4–5   → CONVINCE: Social proof, stats, real results. Overcome skepticism. Medium CTA.
  Day 6     → CONVERT:  Direct push to sign up. Free trial angle. Remove all friction. Strong CTA.
  Day 7     → ENGAGE:   Story/poll. Community vibe. Ask a question. Warm the algorithm.

NEVER plan: 3+ ATTRACT posts in a row, or a week with no CONVERT post.
NEVER put CONVERT on Sunday (day 7) — W23 data: promotional Sunday Reel 25.94% ER (worst of week).
ALWAYS: Day 7 (Sunday) = ENGAGE only — community poll, story, relatable question. Zero selling.
ALWAYS: the CONVERT post references the weekly theme visual + music (consistent brand feel).

WEEKLY ASSETS TO REFRESH (every Monday):
  1. Background PHOTO — Leonardo AI photo matching theme["leo_prompt"]
  2. Background VIDEO — Pexels video matching theme["pexels_query"]
  3. MUSIC track — .mp3 matching theme["music_mood"] + theme["music_bpm"]
  Use get_active_theme() from strategist.weekly_refresh to get current theme details.
"""
