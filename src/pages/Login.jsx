import { useState } from "react";
import { supabase } from "../supabase.js";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });
      if (error) throw error;

      const user = data.user;

      const { data: usuario, error: erroDb } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single();

      if (erroDb || !usuario) {
        Swal.fire("Erro", "Usuário não encontrado.", "error");
        return;
      }

      if (!usuario.ativo) {
        Swal.fire(
          "Aguardando aprovação",
          "Sua conta ainda não foi aprovada pelo administrador.",
          "info"
        );
        await supabase.auth.signOut();
        return;
      }

      Swal.fire({
        title: "Sucesso",
        text: `Bem-vindo(a), ${usuario.nome || "Usuário"}!`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire("Erro ao entrar", "E-mail ou senha incorretos.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white/40 backdrop-blur-md shadow-lg border border-white/30">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2 text-center">
          Faça seu login<span className="text-indigo-500">.</span>
        </h1>
        <p className="text-center text-gray-600 mb-8 sm:mb-10 text-sm sm:text-base">
          Acesse sua conta para participar da assembleia
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-5 sm:gap-6">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 sm:p-4 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 placeholder-gray-400 text-sm sm:text-base"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full p-3 sm:p-4 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 placeholder-gray-400 text-sm sm:text-base"
            required
          />

          <div className="flex flex-col sm:flex-row justify-between text-sm text-indigo-600 mt-1 sm:mt-2 space-y-2 sm:space-y-0">
            <button
              type="button"
              onClick={() => navigate("/recuperar-senha")}
              className="hover:text-indigo-700 transition"
            >
              Esqueci minha senha
            </button>
            <button
              type="button"
              onClick={() => navigate("/cadastro")}
              className="hover:text-indigo-700 transition"
            >
              Cadastrar-se
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
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
