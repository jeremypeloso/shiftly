import { supabase } from "./supabase";

export async function sendNotificationEmail({ userId, title, message, type }) {
  if (!userId || !title || !message) return;

  const { error } = await supabase.functions.invoke("send-notification-email", {
    body: {
      userId,
      title,
      message,
      type,
    },
  });

  if (error) {
    console.error("Erreur envoi notification email :", error);
  }
}

export async function sendAdminNotificationEmail({ title, message, type }) {
  if (!title || !message) return;

  const { error } = await supabase.functions.invoke("send-notification-email", {
    body: {
      adminOnly: true,
      title,
      message,
      type,
    },
  });

  if (error) {
    console.error("Erreur envoi notification email admin :", error);
  }
}
