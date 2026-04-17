import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getAccessToken(serviceAccount: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const header = encode({ alg: "RS256", typ: "JWT" });
  const payload = encode({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  });

  const signingInput = `${header}.${payload}`;

  const privateKey = serviceAccount.private_key.replace(/\\n/g, "\n");
  const keyData = privateKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");

  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signingInput),
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${signingInput}.${sigB64}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const data = await res.json();
  console.log("OAuth token response:", JSON.stringify(data));
  return data.access_token;
}

async function sendToToken(
  accessToken: string,
  projectId: string,
  token: string,
  title: string,
  body: string,
) {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          android: {
            priority: "high",
            notification: { sound: "default", channel_id: "default" },
          },
        },
      }),
    },
  );
  const result = await res.json();
  console.log("FCM response:", JSON.stringify(result));
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Payload recebido:", JSON.stringify(body));
    const { titulo, corpo, tokens, email, role } = body;

    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!serviceAccountJson) throw new Error("FIREBASE_SERVICE_ACCOUNT não configurado");

    const serviceAccount = JSON.parse(serviceAccountJson);
    console.log("Service account project_id:", serviceAccount.project_id);

    let resolvedTokens: string[] = tokens ?? [];

    if (resolvedTokens.length === 0 && (email || role)) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const admin = createClient(supabaseUrl, supabaseServiceKey);

      if (email) {
        console.log("Buscando token por email:", email);
        const { data: usuario, error: errUsuario } = await admin
          .from("usuarios")
          .select("fcm_token")
          .eq("email", email)
          .single();
        console.log("Usuario encontrado:", usuario, "erro:", errUsuario?.message);
        if (usuario?.fcm_token) resolvedTokens = [usuario.fcm_token];
      } else if (role) {
        console.log("Buscando tokens por role:", role);
        const { data: usuarios, error } = await admin
          .from("usuarios")
          .select("fcm_token")
          .eq("role", role)
          .not("fcm_token", "is", null);
        console.log("Usuarios encontrados:", usuarios?.length, "erro:", error?.message);
        resolvedTokens = (usuarios ?? []).map((u: { fcm_token: string }) => u.fcm_token).filter(Boolean);
      }
    }

    console.log("Tokens resolvidos:", resolvedTokens.length);

    if (resolvedTokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, total: 0, motivo: "nenhum token encontrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken(serviceAccount);

    const results = await Promise.allSettled(
      resolvedTokens.map((token) =>
        sendToToken(accessToken, serviceAccount.project_id, token, titulo, corpo)
      ),
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;

    return new Response(JSON.stringify({ sent, total: resolvedTokens.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro na função:", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
