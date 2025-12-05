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
      content: "auto",
      html: html,
    });
    console.log(`Email sent to ${to}`);
    return { id: `gmail-${Date.now()}` };
  } finally {
    await client.close();
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assignments, eventName = "Secret Santa 2024", deadline }: EmailRequest = await req.json();

    console.log(`Sending ${assignments.length} Secret Santa emails via Gmail...`);

    const results = [];

    for (const assignment of assignments) {
      const { giver, receiver } = assignment;

      console.log(`Sending email to ${giver.name} (${giver.email}) -> recipient: ${receiver.name}`);

      const deadlineText = deadline 
        ? `<p style="margin-top: 20px; color: #666;">📅 <strong>Data limite:</strong> ${deadline}</p>` 
        : '';

      const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #1a0a0a; margin: 0; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(180deg, #2a1515 0%, #1a0a0a 100%); border-radius: 16px; padding: 40px; border: 1px solid #3a2020;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 60px;">🎁</span>
            </div>
            
            <h1 style="color: #f5e6d3; text-align: center; font-size: 28px; margin-bottom: 10px; font-family: Georgia, serif;">
              ${eventName}
            </h1>
            
            <p style="color: #c4a574; text-align: center; font-size: 16px; margin-bottom: 30px;">
              Ciao <strong style="color: #f5e6d3;">${giver.name}</strong>! 🎄
            </p>
            
            <div style="background: linear-gradient(135deg, #8b2e2e 0%, #6b1e1e 100%); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 25px; box-shadow: 0 10px 30px rgba(139, 46, 46, 0.3);">
              <p style="color: #f5e6d3; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">
                Dovrai fare un regalo a:
              </p>
              <p style="color: #ffd700; margin: 0; font-size: 32px; font-weight: bold; font-family: Georgia, serif; text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);">
                ✨ ${receiver.name} ✨
              </p>
            </div>
            
            ${deadlineText}
            
            <div style="border-top: 1px solid #3a2020; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                Ricorda: è un segreto! Non dirlo a nessuno 🤫
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

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
