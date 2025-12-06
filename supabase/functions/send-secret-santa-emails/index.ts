import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const GMAIL_USER = Deno.env.get("GMAIL_USER");
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Assignment {
  giver: {
    name: string;
    email: string;
  };
  receiver: {
    name: string;
  };
}

interface EmailRequest {
  assignments: Assignment[];
  eventName?: string;
  deadline?: string;
}

async function sendEmail(to: string, subject: string, html: string) {
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

  try {
    await client.send({
      from: GMAIL_USER!,
      to: to,
      subject: subject,
      html: html,
    });
    console.log(`Email sent to ${to}`);
    return { id: `gmail-${Date.now()}` };
  } finally {
    await client.close();
  }
}

function buildEmailHtml(giverName: string, receiverName: string, eventName: string, deadline?: string): string {
  const deadlineHtml = deadline
    ? `<p style="font-size:14px;color:#666666;margin:16px 0 0 0;">📅 Data limite: ${deadline}</p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${eventName}</title>
</head>
<body style="margin:0;padding:0;background-color:#1a1a2e;font-family:Georgia,serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#1a1a2e;">
<tr>
<td align="center" style="padding:40px 20px;">
<table role="presentation" width="400" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#2d1b1b 0%,#1a1a2e 100%);border-radius:16px;border:2px solid #c9a227;">
<tr>
<td align="center" style="padding:30px 20px 10px 20px;">
<span style="font-size:48px;">🎁</span>
</td>
</tr>
<tr>
<td align="center" style="padding:10px 20px;">
<h1 style="color:#c9a227;font-size:28px;margin:0;font-weight:normal;">${eventName}</h1>
</td>
</tr>
<tr>
<td align="center" style="padding:20px;">
<p style="color:#ffffff;font-size:18px;margin:0;">Ciao <span style="color:#c9a227;">${giverName}</span>! 🎄</p>
</td>
</tr>
<tr>
<td align="center" style="padding:10px 20px 30px 20px;">
<div style="background-color:rgba(139,69,69,0.4);border-radius:12px;padding:20px;border:1px solid rgba(201,162,39,0.3);">
<p style="color:#999999;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px 0;">Dovrai fare un regalo a:</p>
<p style="color:#c9a227;font-size:24px;margin:0;">✨ ${receiverName} ✨</p>
</div>
</td>
</tr>
<tr>
<td align="center" style="padding:0 20px 30px 20px;">
${deadlineHtml}
<p style="font-size:14px;color:#888888;margin:16px 0 0 0;">Ricorda: è un segreto! Non dirlo a nessuno 🤫</p>
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
    const { assignments, eventName = "Secret Santa 2025", deadline }: EmailRequest = await req.json();
    console.log(`Sending ${assignments.length} Secret Santa emails via Gmail...`);

    const results = [];

    for (const assignment of assignments) {
      const { giver, receiver } = assignment;
      console.log(`Sending email to ${giver.name} (${giver.email}) -> recipient: ${receiver.name}`);

      const html = buildEmailHtml(giver.name, receiver.name, eventName, deadline);

      const emailResponse = await sendEmail(
        giver.email,
        `🎄 ${eventName} - Il tuo abbinamento segreto!`,
        html
      );

      console.log(`Email sent to ${giver.email}:`, emailResponse);
      results.push({ email: giver.email, success: true, id: emailResponse.id });
    }

    console.log("All emails sent successfully!");

    return new Response(
      JSON.stringify({
        success: true,
        message: `${results.length} email inviate con successo!`,
        results
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending Secret Santa emails:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
