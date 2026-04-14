import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function RedefinirSenha() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessaoValida, setSessaoValida] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verificar = async () => {
      // Verifica se há sessão ativa (o link de recovery cria uma sessão temporária)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessaoValida(true);
      }
      setVerificando(false);
    };

    // Tenta imediatamente; se o App.js ainda estiver processando o token, aguarda um tick
    verificar();

    // Também escuta caso o evento ainda não tenha sido processado
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setSessaoValida(true);
        setVerificando(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleRedefinir = async (e) => {
    e.preventDefault();

    if (novaSenha.length < 6) {
      Swal.fire("Atenção", "A senha deve ter no mínimo 6 caracteres.", "warning");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      Swal.fire("Atenção", "As senhas não coincidem.", "warning");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({ password: novaSenha });

      if (error) throw error;

      await supabase.auth.signOut();

      await Swal.fire({
        title: "Senha redefinida!",
        text: "Sua senha foi atualizada com sucesso. Faça login com a nova senha.",
        icon: "success",
        confirmButtonColor: "#4f46e5",
      });

      navigate("/", { replace: true });
    } catch (error) {
      console.error(error);
      Swal.fire("Erro", "Não foi possível redefinir a senha. O link pode ter expirado.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!sessaoValida) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white/40 dark:bg-gray-800/50 backdrop-blur-md shadow-lg border border-white/30 dark:border-gray-700/30 text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Link inválido ou expirado</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Este link de redefinição não é mais válido. Solicite um novo.
          </p>
          <button
            onClick={() => navigate("/recuperar-senha")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold text-sm shadow-md hover:opacity-90 transition"
          >
            Solicitar novo link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white/40 dark:bg-gray-800/50 backdrop-blur-md shadow-lg border border-white/30 dark:border-gray-700/30">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">
          Nova senha<span className="text-indigo-500">.</span>
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8 text-sm">
          Escolha uma senha segura para sua conta
        </p>

        <form onSubmit={handleRedefinir} className="flex flex-col gap-5">
          {/* Nova senha */}
          <div className="relative">
            <input
              type={mostrarSenha ? "text" : "password"}
              placeholder="Nova senha"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              className="w-full p-4 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white/70 dark:bg-gray-700/70 text-sm"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Confirmar senha */}
          <input
            type={mostrarSenha ? "text" : "password"}
            placeholder="Confirmar nova senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
            className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white/70 dark:bg-gray-700/70 text-sm"
          />

          {/* Indicador de match */}
          {confirmarSenha.length > 0 && (
            <p className={`text-xs font-medium -mt-2 ${novaSenha === confirmarSenha ? "text-emerald-500" : "text-red-400"}`}>
              {novaSenha === confirmarSenha ? "✓ Senhas coincidem" : "✗ Senhas não coincidem"}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-2 py-4 rounded-xl text-white font-semibold text-lg shadow-md transition-transform transform hover:scale-[1.02] ${
              loading
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-gradient-to-r from-sky-500 to-indigo-500 hover:opacity-90"
            }`}
          >
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
