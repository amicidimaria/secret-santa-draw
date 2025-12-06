import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const GMAIL_USER = Deno.env.get("GMAIL_USER");
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Assignment {
  giver: { name: string; email: string };
  receiver: { name: string };
}

interface EmailRequest {
  assignments: Assignment[];
  eventName?: string;
  deadline?: string;
}

async function sendEmail(to: string, subject: string, htmlContent: string) {
  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: {
        username: GMAIL_USER!,
        password: GMAIL_APP_PASSWORD!,
      },
    },
  });

  // Codifica l'HTML in base64 per evitare problemi quoted-printable
  const htmlBase64 = base64Encode(new TextEncoder().encode(htmlContent));

  const boundary = `----=_Part_${Date.now()}`;
  const rawEmail = [
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    htmlBase64.match(/.{1,76}/g)?.join("\r\n") || htmlBase64,
    ``,
    `--${boundary}--`,
  ].join("\r\n");

  try {
    await client.send({
      from: GMAIL_USER!,
      to: to,
      subject: subject,
      content: rawEmail,
      mimeContent: [
        {
          mimeType: "text/html",
          content: htmlContent,
          transferEncoding: "base64",
        },
      ],
    });
    console.log(`Email sent to ${to}`);
    return { id: `gmail-${Date.now()}` };
  } finally {
    await client.close();
  }
}

function buildEmailHtml(
  giverName: string,
  receiverName: string,
  eventName: string,
  deadline?: string
): string {
  const deadlineRow = deadline
    ? `<tr>
<td align="center" style="padding:10px 20px;">
<p style="font-size:14px;color:#666666;margin:0;">
&#128197; Data limite: ${deadline}
</p>
</td>
</tr>`
    : "";

  // Template con righe corte (<76 chars) per evitare =20
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
</head>
<body style="margin:0;padding:0;background:#1a1a2e;">
<table width="100%" cellspacing="0" cellpadding="0">
<tr>
<td align="center" style="padding:40px 20px;">
<table width="400" cellspacing="0" cellpadding="0"
style="background:#2d1b1b;border-radius:16px;
border:2px solid #c9a227;">
<tr>
<td align="center" style="padding:30px 20px 10px;">
<span style="font-size:48px;">&#127873;</span>
</td>
</tr>
<tr>
<td align="center" style="padding:10px 20px;">
<h1 style="color:#c9a227;font-size:28px;margin:0;">
${eventName}
</h1>
</td>
</tr>
<tr>
<td align="center" style="padding:20px;">
<p style="color:#fff;font-size:18px;margin:0;">
Ciao <span style="color:#c9a227;">${giverName}</span>!
&#127876;
</p>
</td>
</tr>
<tr>
<td align="center" style="padding:10px 20px 30px;">
<table width="100%" cellspacing="0" cellpadding="0">
<tr>
<td style="background:rgba(139,69,69,0.4);
border-radius:12px;padding:20px;text-align:center;
border:1px solid rgba(201,162,39,0.3);">
<p style="color:#999;font-size:12px;margin:0 0 10px;
text-transform:uppercase;letter-spacing:2px;">
Dovrai fare un regalo a:
</p>
<p style="color:#c9a227;font-size:24px;margin:0;">
&#10024; ${receiverName} &#10024;
</p>
</td>
</tr>
</table>
</td>
</tr>
${deadlineRow}
<tr>
<td align="center" style="padding:0 20px 30px;">
<p style="font-size:14px;color:#888;margin:0;">
Ricorda: è un segreto! Non dirlo a nessuno &#129323;
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      assignments,
      eventName = "Secret Santa 2025",
      deadline,
    }: EmailRequest = await req.json();

    console.log(`Sending ${assignments.length} emails via Gmail...`);
    const results = [];

    for (const assignment of assignments) {
      const { giver, receiver } = assignment;
      console.log(`Sending to ${giver.name} (${giver.email})`);

      const html = buildEmailHtml(
        giver.name,
        receiver.name,
        eventName,
        deadline
      );

      const emailResponse = await sendEmail(
        giver.email,
        `🎄 ${eventName} - Il tuo abbinamento segreto!`,
        html
      );

      results.push({
        email: giver.email,
        success: true,
        id: emailResponse.id,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${results.length} email inviate!`,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
