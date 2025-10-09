import { useEffect } from "react";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getApp, getApps, initializeApp } from "firebase/app";

export default function TesteFirestore() {
  useEffect(() => {
    // ✅ Só inicializa se ainda não existir
    const firebaseConfig = {
      apiKey: "AIzaSyCot5JdiY-QYPGOBJ75UYYu4GkgAUZgSpY",
      authDomain: "votacao-sandiego.firebaseapp.com",
      projectId: "votacao-sandiego",
    };

    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    console.log("🔥 Projeto conectado:", app.options.projectId);

    const db = getFirestore(app);

    const testar = async () => {
      try {
        await setDoc(doc(db, "usuarios", "teste_manual"), { ok: true });
        console.log("✅ Gravou com sucesso!");
      } catch (e) {
        console.error("❌ Erro completo:", e);
        console.log("➡️ Código:", e.code);
        console.log("➡️ Mensagem:", e.message);
      }
    };
    testar();
  }, []);

  return <h1>Teste Firestore</h1>;
}
