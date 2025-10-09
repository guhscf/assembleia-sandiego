import { useState } from "react";
import { supabase } from "../supabase.js";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRecuperarSenha = async (e) => {
    e.preventDefault();

    if (!email) {
      Swal.fire("Atenção", "Informe seu e-mail para recuperar a senha.", "warning");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/",
      });

      if (error) throw error;

      Swal.fire({
        title: "E-mail enviado!",
        text: "Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.",
        icon: "success",
        confirmButtonColor: "#4f46e5",
      });

      setEmail("");
    } catch (error) {
      console.error(error);
      Swal.fire("Erro", "Não foi possível enviar o e-mail de recuperação.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white/40 backdrop-blur-md shadow-lg border border-white/30">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2 text-center">
          Recuperar senha<span className="text-indigo-500">.</span>
        </h1>
        <p className="text-center text-gray-600 mb-8 sm:mb-10 text-sm sm:text-base">
          Digite o e-mail cadastrado para redefinir sua senha
        </p>

        <form onSubmit={handleRecuperarSenha} className="flex flex-col gap-5 sm:gap-6">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 sm:p-4 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 placeholder-gray-400 text-sm sm:text-base"
            required
          />

          <div className="flex flex-col sm:flex-row justify-between text-sm text-indigo-600 mt-2 space-y-2 sm:space-y-0">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="hover:text-indigo-700 transition"
            >
              Voltar ao login
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-4 py-3 sm:py-4 rounded-xl text-white font-semibold text-lg shadow-md transition-transform transform hover:scale-[1.02] ${
              loading
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-gradient-to-r from-sky-500 to-indigo-500 hover:opacity-90"
            }`}
          >
            {loading ? "Enviando..." : "Enviar e-mail de recuperação"}
          </button>
        </form>
      </div>
    </div>
  );
}
