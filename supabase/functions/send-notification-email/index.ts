const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getUserEmail(userId: string, supabaseUrl: string, serviceRoleKey: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) return null;

  const user = await response.json();
  return user?.email || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { adminOnly, userId, title, message, type } = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const mailFrom = Deno.env.get("MAIL_FROM") || "Shiftly <notifications@app-shiftly.com>";
    const adminEmails = Deno.env.get("ADMIN_EMAILS") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!resendApiKey) throw new Error("RESEND_API_KEY manquant");

    let recipients: string[] = [];

    if (adminOnly) {
      recipients = adminEmails
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);
    } else if (userId) {
      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant");
      }

      const email = await getUserEmail(userId, supabaseUrl, serviceRoleKey);
      if (email) recipients = [email];
    }

    if (!recipients.length) {
      throw new Error("Aucun destinataire trouvé");
    }

    const actionUrl = adminOnly
      ? "https://app-shiftly.com/admin-notifications"
      : "https://app-shiftly.com/notifications";

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: mailFrom,
        to: recipients,
        subject: title || "Notification Shiftly",
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
            <h2>${title || "Notification Shiftly"}</h2>
            <p>${message || ""}</p>
            <p style="color:#64748b;font-size:13px">Type : ${type || "notification"}</p>
            <a href="${actionUrl}" style="display:inline-block;margin-top:14px;padding:12px 18px;border-radius:999px;background:#2563eb;color:white;text-decoration:none;font-weight:700">
              Ouvrir Shiftly
            </a>
          </div>
        `,
      }),
    });

    const resendText = await resendResponse.text();

    if (!resendResponse.ok) {
      throw new Error(`Erreur Resend: ${resendText}`);
    }

    return new Response(JSON.stringify({ success: true, recipients }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error?.message || error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
