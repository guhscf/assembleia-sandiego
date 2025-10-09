import { useState } from "react";
import { supabase } from "../supabase.js";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";

export default function EventoAccess() {
  const [idAssembleia, setIdAssembleia] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAccess = async (e) => {
    e.preventDefault();

    if (!idAssembleia || !senha) {
      Swal.fire({
        title: "Campos obrigatórios",
        text: "Informe o ID e a senha da assembleia.",
        icon: "warning",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: assembleia, error } = await supabase
        .from("assembleias")
        .select("*")
        .eq("id_assembleia", idAssembleia)
        .single();

      if (error || !assembleia) {
        Swal.fire({
          title: "Assembleia não encontrada",
          text: "Verifique o ID informado.",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
        setLoading(false);
        return;
      }

      if (assembleia.senha_acesso !== senha) {
        Swal.fire({
          title: "Senha incorreta",
          text: "Verifique a senha de acesso e tente novamente.",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
        setLoading(false);
        return;
      }

      if (!assembleia.ativa) {
        Swal.fire({
          title: "Assembleia encerrada",
          text: "Esta assembleia não está mais aceitando votos.",
          icon: "info",
          confirmButtonColor: "#3b82f6",
        });
        setLoading(false);
        return;
      }

      navigate("/votacao", { state: { assembleia } });
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Erro",
        text: "Ocorreu um erro ao acessar a assembleia.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 flex flex-col items-center justify-center">
      <Navbar mostrarVoltar={true} />

      <div className="bg-white/40 backdrop-blur-md shadow-lg border border-white/30 rounded-3xl p-10 w-full max-w-md mt-24">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Acessar Assembleia<span className="text-indigo-500">.</span>
        </h1>

        <form onSubmit={handleAccess} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="ID da Assembleia"
            value={idAssembleia}
            onChange={(e) => setIdAssembleia(e.target.value)}
            required
            className="p-4 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none"
          />

          <input
            type="password"
            placeholder="Senha de acesso"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            className="p-4 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl text-white font-semibold text-lg shadow-md transition-transform transform hover:scale-[1.02] ${
              loading
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-gradient-to-r from-sky-500 to-indigo-500 hover:opacity-90"
            }`}
          >
            {loading ? "Verificando..." : "Entrar na Assembleia"}
          </button>
        </form>
      </div>
    </div>
  );
}
