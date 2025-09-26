export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json()

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      })
    }

    const toEmail = process.env.CONTACT_TO || "danishwork29@gmail.com"

    // Try EmailJS if configured
    const serviceId = process.env.EMAILJS_SERVICE_ID
    const templateId = process.env.EMAILJS_TEMPLATE_ID
    const userId = process.env.EMAILJS_PUBLIC_KEY // EmailJS "public" key, but kept server-side

    if (serviceId && templateId && userId) {
      const payload = {
        service_id: serviceId,
        template_id: templateId,
        user_id: userId,
        template_params: {
          from_name: name,
          from_email: email,
          subject: "Lost & Found Contact",
          message,
          to_email: toEmail,
        },
      }

      const resp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!resp.ok) {
        let detail = ""
        try {
          detail = await resp.text()
        } catch {}
        // Log the EmailJS failure
        console.error("EmailJS send failed:", resp.status, detail)
        // In development return the provider response so the client can show the error for debugging
        if (process.env.NODE_ENV !== "production") {
          return new Response(JSON.stringify({ error: "EmailJS send failed", status: resp.status, detail }), {
            status: 502,
            headers: { "content-type": "application/json" },
          })
        }
      } else {
        return new Response(JSON.stringify({ ok: true, via: "emailjs" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      }
    }

    // Fallback to SMTP via nodemailer if EmailJS wasn't used or failed
    // Requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS env vars
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      try {
        // Dynamically import nodemailer to avoid bundling if not used
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nodemailer = require("nodemailer")
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass },
        })

        const info = await transporter.sendMail({
          from: `${name} <${email}>`,
          to: toEmail,
          subject: "Lost & Found Contact",
          text: message,
          html: `<p>${message.replace(/\n/g, "<br/>")}</p><p>From: ${name} &lt;${email}&gt;</p>`,
        })

        return new Response(JSON.stringify({ ok: true, via: "smtp", info }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      } catch (smtpErr: any) {
        console.error("SMTP send failed:", smtpErr)
        return new Response(JSON.stringify({ error: smtpErr?.message || "SMTP send failed" }), {
          status: 502,
          headers: { "content-type": "application/json" },
        })
      }
    }

    // If running locally (not production), simulate success so devs can test the contact form
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("Contact API: email not configured — simulating send in development.")
      // Log the message for debugging
      // eslint-disable-next-line no-console
      console.log({ name, email, message })
      return new Response(JSON.stringify({ ok: true, via: "dev-simulated" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({ error: "Email is not configured. Set EmailJS env vars or SMTP_HOST/SMTP_USER/SMTP_PASS." }),
      { status: 500, headers: { "content-type": "application/json" } },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Unexpected error." }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  }
}
