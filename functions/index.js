const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.excluirUsuarioTotal = functions.https.onCall(async (data, context) => {
  // 🔹 Suporte para versões novas e antigas do SDK
  const uid = (data && data.uid) || (data && data.data && data.data.uid);

  console.log("🧠 Dados recebidos:", data);
  console.log("🧩 UID recebido:", uid);

  if (!uid) {
    console.error("❌ Nenhum UID recebido!");
    throw new functions.https.HttpsError("invalid-argument", "UID não informado");
  }

  try {
    // 🔐 Exclui usuário do Authentication
    await admin.auth().deleteUser(uid);

    // 🗑️ Exclui do Firestore
    await admin.firestore().collection("usuarios").doc(uid).delete();

    console.log(`✅ Usuário ${uid} removido com sucesso!`);
    return { success: true, uid };
  } catch (error) {
    console.error("❌ Erro ao excluir usuário:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
