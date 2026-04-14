import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "noreply@seudominio.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { para, assunto, corpo, html } = await req.json();

    if (!para || !assunto) {
      return new Response(
        JSON.stringify({ error: "Campos 'para' e 'assunto' são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Converte texto simples em HTML se não for passado HTML diretamente
    const htmlBody = html ?? `
      <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 16px;background:#f3f4f6;">
        <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 4px 15px rgba(0,0,0,0.06);">
          <h2 style="color:#1e1b4b;font-size:20px;margin:0 0 16px;">
            SanDiego<span style="color:#6366f1;">+</span>
          </h2>
          <p style="color:#374151;font-size:15px;line-height:1.7;white-space:pre-wrap;margin:0 0 24px;">${corpo}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px;" />
          <p style="color:#9ca3af;font-size:12px;margin:0;">SanDiego+ © — Condomínio San Diego</p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [para],
        subject: assunto,
        html: htmlBody,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(
        JSON.stringify({ error: data }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Erro inesperado:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
