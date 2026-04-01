import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const PRACTITIONER_EMAILS = [
  "nic@coachnictuck.com",
];

const RATE_LIMIT_MAP = new Map();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW = 3600000;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = RATE_LIMIT_MAP.get(ip);
  if (!entry) {
    RATE_LIMIT_MAP.set(ip, { count: 1, start: now });
    return false;
  }
  if (now - entry.start > RATE_LIMIT_WINDOW) {
    RATE_LIMIT_MAP.set(ip, { count: 1, start: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

function scoreColor(score) {
  if (score <= 3) return "#E24B4A";
  if (score <= 5) return "#EF9F27";
  if (score <= 7) return "#5DCAA5";
  return "#1D9E75";
}

function scoreLabel(score) {
  if (score <= 3) return "Needs attention";
  if (score <= 5) return "Room to grow";
  if (score <= 7) return "Solid foundation";
  return "Thriving";
}

function buildPractitionerEmail(email, scores, insights) {
  const scoreRows = Object.entries(scores)
    .map(([key, val]) => {
      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
      const color = scoreColor(val);
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #1a1a24;color:#EBE1D2;font-size:14px;">${label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #1a1a24;color:${color};font-weight:600;font-size:14px;text-align:center;">${val}/10</td>
          <td style="padding:8px 12px;border-bottom:1px solid #1a1a24;color:#888;font-size:12px;">${scoreLabel(val)}</td>
        </tr>`;
    })
    .join("");

  const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]);
  const lowest = sorted.slice(0, 2).map(([k, v]) => `${k} (${v})`).join(", ");
  const highest = sorted.slice(-2).map(([k, v]) => `${k} (${v})`).join(", ");

  return `
    <div style="background:#0D0D12;padding:32px;font-family:Georgia,serif;max-width:600px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="color:rgba(212,165,116,0.5);font-size:12px;letter-spacing:4px;text-transform:uppercase;">Helios Insight Engine</span>
      </div>
      <h1 style="color:#D4A574;font-size:22px;font-weight:300;margin:0 0 8px;">New Assessment Opt-In</h1>
      <p style="color:#EBE1D2;font-size:15px;margin:0 0 24px;">A prospective client has completed the Life Diagnostic and wants to connect.</p>

      <div style="background:#13131a;border:1px solid #1a1a24;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="color:rgba(212,165,116,0.6);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Contact</p>
        <p style="color:#D4A574;font-size:18px;margin:0;">
          <a href="mailto:${email}" style="color:#D4A574;text-decoration:none;">${email}</a>
        </p>
      </div>

      <div style="background:#13131a;border:1px solid #1a1a24;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="color:rgba(212,165,116,0.6);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Life Diagnostic Scores</p>
        <table style="width:100%;border-collapse:collapse;">
          ${scoreRows}
        </table>
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid #1a1a24;">
          <p style="color:#E24B4A;font-size:13px;margin:0 0 4px;">⬇ Lowest: ${lowest}</p>
          <p style="color:#1D9E75;font-size:13px;margin:0;">⬆ Highest: ${highest}</p>
        </div>
      </div>

      <div style="background:#13131a;border:1px solid #1a1a24;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="color:rgba(212,165,116,0.6);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Generated Insights</p>
        <div style="color:#EBE1D2;font-size:14px;line-height:1.7;opacity:0.8;">
          ${insights.replace(/\n/g, "<br>")}
        </div>
      </div>

      <div style="text-align:center;padding:16px 0;">
        <a href="mailto:${email}?subject=Your%20Helios%20Life%20Diagnostic%20Results"
           style="display:inline-block;padding:12px 32px;border:1px solid #D4A574;color:#D4A574;text-decoration:none;font-size:14px;letter-spacing:2px;text-transform:uppercase;">
          Reply to Client
        </a>
      </div>

      <p style="color:rgba(212,165,116,0.25);font-size:11px;text-align:center;margin-top:24px;">
        Submitted ${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })} PT
      </p>
    </div>
  `;
}

function buildUserConfirmationEmail(scores, insights) {
  const scoreRows = Object.entries(scores)
    .map(([key, val]) => {
      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
      const color = scoreColor(val);
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #1a1a24;color:#EBE1D2;font-size:14px;">${label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #1a1a24;color:${color};font-weight:600;font-size:14px;text-align:center;">${val}/10</td>
          <td style="padding:8px 12px;border-bottom:1px solid #1a1a24;color:#888;font-size:12px;">${scoreLabel(val)}</td>
        </tr>`;
    })
    .join("");

  const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]);
  const lowest = sorted.slice(0, 2).map(([k, v]) => `${k} (${v})`).join(", ");
  const highest = sorted.slice(-2).map(([k, v]) => `${k} (${v})`).join(", ");

  return `
    <div style="background:#0D0D12;padding:32px;font-family:Georgia,serif;max-width:600px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="color:rgba(212,165,116,0.5);font-size:12px;letter-spacing:4px;text-transform:uppercase;">Helios</span>
      </div>
      <h1 style="color:#D4A574;font-size:24px;font-weight:300;margin:0 0 8px;text-align:center;">Your Life Diagnostic</h1>
      <p style="color:rgba(235,225,210,0.6);font-size:15px;text-align:center;margin:0 0 32px;">Thank you for taking the time to look inward. Here are your full results.</p>

      <div style="background:#13131a;border:1px solid #1a1a24;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="color:rgba(212,165,116,0.6);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Life Diagnostic Scores</p>
        <table style="width:100%;border-collapse:collapse;">
          ${scoreRows}
        </table>
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid #1a1a24;">
          <p style="color:#E24B4A;font-size:13px;margin:0 0 4px;">⬇ Lowest: ${lowest}</p>
          <p style="color:#1D9E75;font-size:13px;margin:0;">⬆ Highest: ${highest}</p>
        </div>
      </div>

      <div style="background:#13131a;border:1px solid #1a1a24;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="color:rgba(212,165,116,0.6);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Your Insights</p>
        <div style="color:#EBE1D2;font-size:14px;line-height:1.7;opacity:0.8;">
          ${insights.replace(/\n/g, "<br>")}
        </div>
      </div>

      <p style="color:rgba(235,225,210,0.6);font-size:14px;line-height:1.7;text-align:center;margin:0 0 32px;">
        A member of our team will reach out within 24 hours to schedule a complimentary consultation.
        If you'd prefer to book now, you can choose a time below.
      </p>

      <div style="text-align:center;padding:16px 0;">
        <a href="https://calendly.com/nicholastucker/30min"
           style="display:inline-block;padding:14px 40px;border:1px solid #D4A574;color:#D4A574;text-decoration:none;font-size:14px;letter-spacing:2px;text-transform:uppercase;">
          Book a Consultation
        </a>
      </div>

      <p style="color:rgba(212,165,116,0.2);font-size:11px;text-align:center;margin-top:32px;line-height:1.6;">
        Helios Integrative Health<br>
        You're receiving this because you requested your Life Diagnostic results.
      </p>
    </div>
  `;
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { email, scores, insights, honeypot } = body;

    if (honeypot) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    if (!email || !email.includes("@") || !email.includes(".")) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid email" }) };
    }

    if (!scores || typeof scores !== "object") {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid scores" }) };
    }

    const ip = event.headers["x-forwarded-for"] || event.headers["client-ip"] || "unknown";
    if (isRateLimited(ip)) {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: "Too many submissions. Please try again later." }),
      };
    }

    await resend.emails.send({
      from: "Helios Insight Engine <no-reply@heliosintegrativehealth.com>",
      to: PRACTITIONER_EMAILS,
      subject: `New Life Diagnostic Opt-In: ${email}`,
      html: buildPractitionerEmail(email, scores, insights || ""),
    });

    await resend.emails.send({
      from: "Helios <no-reply@heliosintegrativehealth.com>",
      to: [email],
      subject: "Your Life Diagnostic Results — Helios",
      html: buildUserConfirmationEmail(scores, insights || ""),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Submit error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong. Please try again." }),
    };
  }
};
