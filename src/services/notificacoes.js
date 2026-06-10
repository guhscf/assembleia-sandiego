import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { supabase } from "../supabase";

export async function inicializarNotificacoes(userId, onNotificacaoRecebida) {
  if (!Capacitor.isNativePlatform()) return;

  // Push depende do Firebase (google-services.json). Se nao estiver
  // configurado, falha de forma silenciosa em vez de derrubar o app.
  try {
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== "granted") return;

    await PushNotifications.createChannel({
      id: "default",
      name: "Notificações",
      importance: 5,
      sound: "default",
      vibration: true,
    });

    PushNotifications.addListener("registration", async ({ value: token }) => {
      await supabase
        .from("usuarios")
        .update({ fcm_token: token })
        .eq("id", userId);
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.error("Erro no registro de push:", err);
    });

    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      if (onNotificacaoRecebida) onNotificacaoRecebida(notification);
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      if (onNotificacaoRecebida) onNotificacaoRecebida(action.notification);
    });

    await PushNotifications.register();
  } catch (err) {
    console.error("Notificacoes push indisponiveis:", err);
  }
}

export async function enviarNotificacao({ titulo, corpo, tokens, email, role }) {
  try {
    await supabase.functions.invoke("enviar-notificacao", {
      body: { titulo, corpo, tokens, email, role },
    });
  } catch (err) {
    console.warn("Notificação não enviada:", err);
  }
}
