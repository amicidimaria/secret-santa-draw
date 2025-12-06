import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const GMAIL_USER = Deno.env.get("GMAIL_USER");
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
      to,
      subject,
      html,
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
  deadline?: string,
): string {
  const deadlineHtml = deadline
    ? `<p style="margin:16px 0 0 0;font-size:14px;color:#ffe8e8;">
📅 Data limite: ${deadline}
</p>`
    : "";

  // Template estremamente semplice, righe corte, pochi stili
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${eventName}</title>
</head>
<body style="margin:0;padding:0;background-color:#3b0f0f;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#3b0f0f;">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#8b1a1a;border-radius:12px;">
          <tr>
            <td align="center" style="padding:24px 16px 8px 16px;">
              <span style="font-size:40px;">🎁</span>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 16px;">
              <h1 style="margin:0;font-size:24px;color:#ffffff;font-weight:bold;">
                ${eventName}
              </h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 16px 8px 16px;">
              <p style="margin:0;font-size:16px;color:#ffffff;">
                Ciao <strong>${giverName}</strong>! 🎄
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 16px 16px 16px;">
              <div style="background-color:#b02222;border-radius:10px;padding:16px;">
                <p style="margin:0 0 6px 0;font-size:12px;color:#ffe8e8;letter-spacing:1px;text-transform:uppercase;">
                  Dovrai fare un regalo a:
                </p>
                <p style="margin:0;font-size:20px;color:#ffffff;font-weight:bold;">
                  ✨ ${receiverName} ✨
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 16px 20px 16px;">
              ${deadlineHtml}
              <p style="margin:12px 0 0 0;font-size:13px;color:#ffe8e8;">
                Ricorda: è un segreto! Non dirlo a nessuno 🤫
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
    const { assignments, eventName = "Secret Santa 2025", deadline } =
      (await req.json()) as EmailRequest;

    console.log(
      `Sending ${assignments.length} Secret Santa emails via Gmail...`,
    );

    const results: { email: string; success: boolean; id: string }[] = [];

    for (const assignment of assignments) {
      const { giver, receiver } = assignment;
      console.log(
        `Sending email to ${giver.name} (${giver.email}) -> recipient: ${receiver.name}`,
      );

      const html = buildEmailHtml(
        giver.name,
        receiver.name,
        eventName,
        deadline,
      );

      const emailResponse = await sendEmail(
        giver.email,
        `🎄 ${eventName} - Il tuo abbinamento segreto!`,
        html,
      );

      results.push({
        email: giver.email,
        success: true,
        id: emailResponse.id,
      });
    }

    console.log("All emails sent successfully!");

    return new Response(
      JSON.stringify({
        success: true,
        message: `${results.length} email inviate con successo!`,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("Error sending Secret Santa emails:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
};

serve(handler);
