# ⚓ Anchor

**A Biometric Grounding Companion for Psychiatric Service Dog Access Gaps**

CBC Hackathon · Track 2: Social Impact · March 21, 2025

---

## The Problem

3.5 million people in North America have schizophrenia. There are approximately 500,000 psychiatric service dogs. The waitlist for a trained PSD is 2–5 years. One costs $50,000 or more. The gap is not a niche edge case — it is the default experience for the overwhelming majority of people who need this support.

| Stat | Figure |
|---|---|
| People with schizophrenia in North America | 3.5M |
| Psychiatric service dogs available | ~500K |
| Average waitlist for a trained PSD | 2–5 years |
| Cost of a fully trained PSD | $50,000+ |

PSDs provide grounding, reality-testing, and physiological calming during dissociative or psychotic episodes. For the people waiting years to receive one, there is nothing filling that role. Anchor is not a replacement. It is a bridge.

---

## What Anchor Does

Anchor is a Next.js web application with five interconnected capabilities.

### 2.1 Passive Biometric Monitoring

Anchor reads heart rate and HRV data from a Garmin wearable via the Garmin Health API. In the hackathon prototype, this is replaced by a clinically-informed biometric simulation engine that generates realistic HR + HRV time series, including pre-episode anomaly signatures. The trigger logic is identical — the data source differs.

### 2.2 Episode Trigger Detection

Anchor continuously compares live biometrics against a rolling personal baseline. When HR exceeds baseline by 20+ BPM and HRV drops 15+ ms below baseline, sustained for 3 or more consecutive readings (~2–3 minutes), a trigger fires.

```
Trigger condition:
HR > (baseline_hr + 20 bpm) AND HRV < (baseline_hrv - 15 ms)
for 3+ consecutive readings
```

### 2.3 Claude Grounding Companion

On trigger, Anchor opens a grounding conversation with Claude. The system prompt is engineered for three non-negotiable constraints:

- Never diagnose, never recommend medication changes
- Never contradict or dismiss the user's perceptual experience
- Never make a determination about whether an episode is occurring — only offer to check in

Claude guides the user through grounding exercises: 5-4-3-2-1 sensory grounding, box breathing, safe place visualization, and physical anchoring. The tone is warm, simple, and non-clinical throughout.

### 2.4 Episode Logging and Learning Loop

When a user reports an episode via conversation ("I just had an episode in the last hour"), Anchor captures and stores the prior hour's biometric data alongside the episode log. Over time, this builds a personal pre-episode biometric signature — the app learns what the user's body does before an episode starts, not just during one.

### 2.5 Self-Notification System

Anchor can send the user a templated email notification to their own registered email address if an episode trigger persists beyond a configurable threshold. This is opt-in, user-controlled, and clearly framed as a personal awareness tool — not a surveillance system.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| UI Components | shadcn/ui component library |
| Charts | Recharts — biometric timeline and episode insights |
| AI | Claude API — claude-sonnet-4-20250514 |
| Database | Supabase — episode log, baseline, settings |
| Deployment | Vercel — continuous deployment from GitHub |
| Biometrics (demo) | Custom TypeScript simulation engine |
| Biometrics (production) | Garmin Health API |
| Self-Notifications | EmailJS — no backend required |
| Auth | None — prototype scope |

> **Note on Garmin API:** The Garmin Health API requires enterprise approval and cannot be integrated within hackathon timeframes. The prototype uses a simulation engine that generates realistic HR + HRV time series including pre-episode anomaly windows. The trigger architecture is production-ready — only the data source changes in a real deployment. This will be stated transparently to judges.

---

## Database Schema (Supabase)

### episodes

| Column | Type | Description | Constraint |
|---|---|---|---|
| id | uuid | Primary key | DEFAULT gen_random_uuid() |
| created_at | timestamptz | When episode was logged | DEFAULT now() |
| user_label | text | User-provided description | nullable |
| hr_data | jsonb | Array of {timestamp, value} HR readings | NOT NULL |
| hrv_data | jsonb | Array of {timestamp, value} HRV readings | NOT NULL |
| triggered_by | text | "biometric" \| "manual" | NOT NULL |
| duration_minutes | integer | Estimated episode duration | nullable |
| resolved | boolean | Whether episode has ended | DEFAULT false |

### baseline

| Column | Type | Description | Constraint |
|---|---|---|---|
| id | uuid | Primary key | DEFAULT gen_random_uuid() |
| avg_hr | float8 | Rolling average resting HR | NOT NULL |
| avg_hrv | float8 | Rolling average HRV (rMSSD ms) | NOT NULL |
| sample_count | integer | Number of readings in baseline | DEFAULT 0 |
| updated_at | timestamptz | Last recalculation timestamp | DEFAULT now() |
| established | boolean | Enough data to trust baseline | DEFAULT false |

### settings

| Column | Type | Description | Constraint |
|---|---|---|---|
| id | uuid | Primary key | DEFAULT gen_random_uuid() |
| notification_email | text | User's own alert email | nullable |
| notification_consent | boolean | User has opted in to self-alerts | DEFAULT false |
| alert_threshold_min | integer | Minutes before self-notification fires | DEFAULT 10 |
| sensitivity | text | "low" \| "medium" \| "high" | DEFAULT 'medium' |

---

## File Structure

```
anchor/
├── app/
│   ├── page.tsx                      # Dashboard — biometric feed + trigger status
│   ├── chat/page.tsx                 # Claude grounding conversation
│   ├── log/page.tsx                  # Episode history + insights chart
│   ├── settings/page.tsx             # Notification setup + sensitivity
│   ├── layout.tsx                    # Root layout, font, metadata
│   └── api/
│       └── chat/route.ts             # Claude API proxy (keeps key server-side)
│
├── components/
│   ├── biometrics/
│   │   ├── BiometricChart.tsx        # Recharts HR+HRV line chart
│   │   ├── TriggerBanner.tsx         # Alert UI when trigger fires
│   │   └── StatusIndicator.tsx       # Live pulse dot (calm/elevated/alert)
│   ├── chat/
│   │   ├── ChatWindow.tsx            # Message thread UI
│   │   ├── MessageBubble.tsx         # Individual message component
│   │   └── GroundingPrompt.tsx       # Exercise cards (5-4-3-2-1, box breath)
│   ├── log/
│   │   ├── EpisodeCard.tsx           # Single episode summary card
│   │   └── InsightsChart.tsx         # Baseline vs episode comparison
│   └── ui/                           # shadcn/ui generated components
│
├── hooks/
│   ├── useBiometrics.ts              # Simulation polling, trigger logic
│   ├── useClaudeChat.ts              # Claude API, message history, streaming
│   ├── useBaseline.ts                # Baseline CRUD, establishment check
│   └── useEpisodeLog.ts              # Episode fetch, create, update
│
├── lib/
│   ├── biometrics/
│   │   ├── simulate.ts               # generateBiometrics() — time series engine
│   │   ├── trigger.ts                # detectTrigger(readings, baseline): boolean
│   │   └── baseline.ts               # calculateBaseline(readings): Baseline
│   ├── claude/
│   │   └── systemPrompt.ts           # System prompt + grounding toolkit
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   └── server.ts                 # Server-side client for API routes
│   └── email/
│       └── notification.ts           # EmailJS self-alert dispatch
│
├── types/
│   ├── biometrics.ts                 # BiometricReading, Baseline, TriggerState
│   ├── episode.ts                    # Episode, EpisodeCreate
│   └── chat.ts                       # Message, ChatState
│
├── .env.local                        # ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
└── supabase/migrations/001_init.sql
```

---

## Claude System Prompt

```
SYSTEM PROMPT — ANCHOR GROUNDING COMPANION

You are Anchor, a grounding companion for people managing psychosis-spectrum
experiences. You are calm, warm, and non-clinical. You speak simply and clearly.
Short sentences. No medical jargon.

ABSOLUTE RULES — never break these:
- Never diagnose. Never suggest medication changes. Never imply you know what
  is happening medically.
- Never contradict or dismiss what the user says they are experiencing. If they
  say they hear or see something, do not say 'that is not real.' Instead, stay
  present and grounding: 'Let's look around together.'
- Never make a determination about whether an episode is occurring. You offer
  to help. The user decides.
- If the user seems in sustained distress for more than 10 minutes, gently
  surface crisis resources. Do not alarm them. Just make it available.
- You are a bridge tool during a wait for a psychiatric service dog. You are
  not a replacement for clinical care, medication, or a trained animal.

YOUR GROUNDING TOOLKIT:
1. 5-4-3-2-1 sensory: 'Name 5 things you can see right now. Then 4 things you can touch.'
2. Box breathing: 'Breathe in for 4 counts. Hold for 4. Out for 4. Hold for 4.'
3. Physical anchoring: 'Feel your feet on the floor. Press them down gently.'
4. Safe place: Guide a brief visualization of a calm, known place.
5. Presence check: 'Can you tell me one thing you can smell or hear right now?'

TONE: You are not a medical device. You are not a chatbot. You are the calm
voice a good friend would use. Warm. Present. Not performatively cheerful.

TRIGGER OPENING (when biometric trigger fires):
"Hey — I noticed some changes in how your body's doing. Want to take a minute together?"
```

---

## Build Schedule

4 hours of coding. 4 people. Each person owns a lane. No task swapping until 2:30 PM.

| Time | Phase | What Gets Built |
|---|---|---|
| 12:00 | Setup | Repo, Next scaffold, Tailwind, shadcn init, Supabase project, env keys, role assignment |
| 12:20 | Foundation | P1: App shell + routing. P2: Claude hook + system prompt. P3: Biometric engine + trigger. P4: DB schema + episode types |
| 1:00 | Core Build | P1+P2: Grounding chat screen end-to-end. P3: Dashboard biometric chart + trigger banner. P4: Episode logger flow + Supabase writes |
| 2:30 | Integration | Full flow walkthrough. Triage bugs. Cut anything not core. Confirm: trigger fires, Claude responds, episode saves. |
| 3:00 | Polish | P1: UI calm palette + spacing. P2: Refine prompt, add crisis escalation. P3: Insights chart. P4: Self-notification alert + settings screen |
| 4:00 | Bug Squash | 3x end-to-end demo runs. Fix breakage. P4 takes screenshots. |
| 4:45 | Devpost | P4 leads write-up. Record 2–3 min Loom demo. Submit before 5:45 PM — do not wait for 6:30. |
| 5:30 | Pitch Prep | Practice 3-min judge table pitch. Rehearse ethical framing answers cold. |

---

## Team Roles

| Person | Role | Owns |
|---|---|---|
| P1 | Frontend / UI Lead | App shell, routing, visual design, calm aesthetic, Tailwind config, responsive layout |
| P2 | Claude Integration Lead | System prompt, useClaudeChat hook, /api/chat route, message history, crisis escalation path |
| P3 | Data / Biometrics Lead | Simulation engine, trigger detection, baseline calculator, Recharts components, insights screen |
| P4 | Features + Comms Lead | Episode logger, Supabase schema, self-notification alerts, settings screen, Devpost write-up, pitch prep |

---

## Judging Strategy

| Category | Pts | How to Win It |
|---|---|---|
| Impact Potential | 25 | Lead with 3.5M vs 500K. Name the specific person: someone on a 3-year waitlist in a rural area. Make it human. |
| Technical Execution | 30 | Demo the trigger pipeline live: watch biometrics spike, trigger fire, Claude open. Briefly show the simulation code. |
| Ethical Alignment | 25 | Have your framing rehearsed cold. Claude never decides — it offers. User is always in control. No surveillance. Crisis escalation built in. |
| Presentation | 20 | One person speaks at a time. Clean demo, no fumbling. 30 sec problem → 45 sec demo → 30 sec ethics → 15 sec what's next. |

### Mandatory Judge Questions — Have These Cold

**Who are you building this for?**

People on the 2–5 year PSD waitlist, and people who already have a PSD and need supplemental grounding support during off-hours or high-frequency episode periods.

**What could go wrong?**

- **Risk 1: Over-reliance replacing clinical care** — Every screen includes a visible non-clinical disclaimer. Claude surfaces professional resources if distress is prolonged.
- **Risk 2: Biometric false positives causing alert fatigue** — User-configurable sensitivity. Trigger requires 3 sustained readings, not a single spike.
- **Risk 3: Self-notification alerts creating notification fatigue** — Explicit opt-in. User controls their own email, threshold, and can disable instantly.

**How does this help rather than decide for people?**

> "Claude never makes a call about whether an episode is happening. It notices a change in biometrics and offers to check in. The user accepts or dismisses. The app supports human agency — it doesn't override it. Even the self-notification alert requires the user to set it up and opt in first. Every decision stays with the person using the app."

---

## Environment Setup (Do Tonight)

Complete these three steps before you sleep so you hit the ground running at 12:00 PM.

**1. Scaffold the repo**

```bash
npx create-next-app@latest anchor --typescript --tailwind --app --src-dir
cd anchor && npx shadcn@latest init
npm install recharts @supabase/supabase-js emailjs-com
git init && git remote add origin [your-repo] && git push -u origin main
```

**2. Create Supabase project at supabase.com — get URL and anon key**

**3. Add `.env.local` with all three keys so nobody waits at noon:**

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_EMAILJS_SERVICE_ID=...
```

---

*Anchor · CBC Hackathon 2025 · Track 2: Social Impact*

**A bridge tool. Not a replacement. Built for the gap.**
