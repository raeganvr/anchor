import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Anchor <alerts@aillustrate.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export interface EpisodeEmailData {
  episodeId: string
  triggeredAt: string
  triggerReason: string | null
  triggerHrValue: number | null
  triggerStressValue: number | null
}

export async function sendCaregiverAlert(
  caregiverEmail: string,
  caregiverName: string | null,
  episode: EpisodeEmailData
) {
  const name = caregiverName ?? 'Caregiver'
  const time = new Date(episode.triggeredAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })

  const reasonText = buildReasonText(episode)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 24px; }
    .card { background: #fff; border-radius: 12px; max-width: 520px; margin: 0 auto; padding: 36px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .badge { display: inline-block; background: #fef3cd; color: #856404; font-size: 12px; font-weight: 600; letter-spacing: .5px; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; margin-bottom: 20px; }
    h1 { font-size: 22px; font-weight: 600; color: #111; margin: 0 0 8px; }
    p { font-size: 15px; color: #444; line-height: 1.6; margin: 0 0 16px; }
    .metric { background: #f9f9f9; border-radius: 8px; padding: 14px 18px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
    .metric-label { font-size: 13px; color: #888; }
    .metric-value { font-size: 16px; font-weight: 600; color: #111; }
    .cta { display: inline-block; background: #111; color: #fff; text-decoration: none; font-size: 15px; font-weight: 500; padding: 12px 28px; border-radius: 8px; margin: 8px 0 24px; }
    .footer { font-size: 12px; color: #aaa; text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Check-in requested</div>
    <h1>Hi ${name}, your person may need support</h1>
    <p>Anchor detected a potential episode at <strong>${time}</strong> and thought you should know.</p>

    ${reasonText ? `<p>${reasonText}</p>` : ''}

    ${episode.triggerHrValue ? `
    <div class="metric">
      <span class="metric-label">Heart rate at trigger</span>
      <span class="metric-value">${episode.triggerHrValue} bpm</span>
    </div>` : ''}

    ${episode.triggerStressValue ? `
    <div class="metric">
      <span class="metric-label">Stress level at trigger</span>
      <span class="metric-value">${episode.triggerStressValue} / 100</span>
    </div>` : ''}

    <p>If you're able to, consider reaching out to check in. Even a short message can help ground someone during a difficult moment.</p>

    <a href="${APP_URL}" class="cta">Open Anchor</a>

    <div class="footer">
      Sent by Anchor - grounding companion. You received this because you were added as a caregiver contact.
    </div>
  </div>
</body>
</html>`

  return resend.emails.send({
    from: FROM,
    to: caregiverEmail,
    subject: `Anchor: check-in requested (${time})`,
    html,
  })
}

export async function sendUserCheckIn(
  userEmail: string,
  episode: EpisodeEmailData
) {
  const time = new Date(episode.triggeredAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 24px; }
    .card { background: #fff; border-radius: 12px; max-width: 520px; margin: 0 auto; padding: 36px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .badge { display: inline-block; background: #e8f4fd; color: #1a6fa3; font-size: 12px; font-weight: 600; letter-spacing: .5px; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; margin-bottom: 20px; }
    h1 { font-size: 22px; font-weight: 600; color: #111; margin: 0 0 8px; }
    p { font-size: 15px; color: #444; line-height: 1.6; margin: 0 0 16px; }
    .cta { display: inline-block; background: #111; color: #fff; text-decoration: none; font-size: 15px; font-weight: 500; padding: 12px 28px; border-radius: 8px; margin: 8px 0 24px; }
    .grounding { background: #f9f9f9; border-radius: 8px; padding: 18px; margin-bottom: 20px; }
    .grounding p { margin: 0; font-size: 14px; color: #555; }
    .footer { font-size: 12px; color: #aaa; text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Want to check in?</div>
    <h1>Anchor noticed something at ${time}</h1>
    <p>Your biometrics showed some elevated readings. It might be nothing, but if you're feeling off, Anchor is here.</p>

    <div class="grounding">
      <p><strong>Quick grounding:</strong> Try naming 5 things you can see right now. Take one slow breath. You're okay.</p>
    </div>

    <p>If you'd like to talk it through, open Anchor and start a chat. Sometimes just putting it into words helps.</p>

    <a href="${APP_URL}/grounding" class="cta">Open Anchor</a>

    <div class="footer">
      Sent by Anchor - grounding companion. This was sent because your biometrics exceeded your personal threshold.
    </div>
  </div>
</body>
</html>`

  return resend.emails.send({
    from: FROM,
    to: userEmail,
    subject: 'Anchor: want to check in?',
    html,
  })
}

function buildReasonText(episode: EpisodeEmailData): string {
  switch (episode.triggerReason) {
    case 'hr_spike':
      return 'Their heart rate spiked significantly above their personal baseline.'
    case 'combined_hr_stress':
      return 'Their heart rate and stress levels both elevated at the same time.'
    case 'stress_only':
      return 'Their stress levels elevated significantly above their personal baseline.'
    default:
      return ''
  }
}
