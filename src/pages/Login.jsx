import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const MAX_TENTATIVAS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutos
const CHAVE_TENTATIVAS = "login_tentativas";
const CHAVE_LOCKOUT = "login_lockout_ate";

function getTentativas() {
  return parseInt(localStorage.getItem(CHAVE_TENTATIVAS) || "0", 10);
}

function getLockoutAte() {
  return parseInt(localStorage.getItem(CHAVE_LOCKOUT) || "0", 10);
}

function registrarFalha() {
  const tentativas = getTentativas() + 1;
  localStorage.setItem(CHAVE_TENTATIVAS, tentativas);
  if (tentativas >= MAX_TENTATIVAS) {
    localStorage.setItem(CHAVE_LOCKOUT, Date.now() + LOCKOUT_MS);
  }
  return tentativas;
}

function resetarContador() {
  localStorage.removeItem(CHAVE_TENTATIVAS);
  localStorage.removeItem(CHAVE_LOCKOUT);
}

function estaLocked() {
  const lockoutAte = getLockoutAte();
  if (!lockoutAte) return false;
  if (Date.now() < lockoutAte) return true;
  // lockout expirou — limpa
  resetarContador();
  return false;
}

function tempoRestante() {
  const lockoutAte = getLockoutAte();
  const diff = lockoutAte - Date.now();
  if (diff <= 0) return "";
  const min = Math.floor(diff / 60000);
  const seg = Math.floor((diff % 60000) / 1000);
  return `${min}m ${seg}s`;
}

const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true ||
  !!window.Capacitor?.isNativePlatform?.();

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(estaLocked);
  const [contador, setContador] = useState(tempoRestante);
  const navigate = useNavigate();

  // Atualiza o contador de lockout a cada segundo
  useEffect(() => {
    if (!locked) return;
    const interval = setInterval(() => {
      if (!estaLocked()) {
        setLocked(false);
        setContador("");
        clearInterval(interval);
      } else {
        setContador(tempoRestante());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [locked]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (estaLocked()) {
      setLocked(true);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha,
      });

      if (error) {
        const tentativas = registrarFalha();
        const restantes = MAX_TENTATIVAS - tentativas;

        if (tentativas >= MAX_TENTATIVAS) {
          setLocked(true);
          setContador(tempoRestante());
          Swal.fire({
            title: "Conta bloqueada",
            html: `Muitas tentativas incorretas.<br>Tente novamente em <b>15 minutos</b>.`,
            icon: "error",
            confirmButtonColor: "#6366f1",
          });
        } else {
          Swal.fire({
            title: "Erro ao entrar",
            html: `E-mail ou senha incorretos.<br><span style="color:#ef4444;font-size:0.85rem">${restantes} tentativa${restantes !== 1 ? "s" : ""} restante${restantes !== 1 ? "s" : ""} antes do bloqueio.</span>`,
            icon: "error",
            confirmButtonColor: "#6366f1",
          });
        }
        return;
      }

      const user = data.user;
      const { data: usuario, error: erroDb } = await supabase
        .from("usuarios")
        .select("id, nome, role, ativo")
        .eq("id", user.id)
        .single();

      if (erroDb || !usuario) {
        await supabase.auth.signOut();
        Swal.fire("Erro", "Usuário não encontrado.", "error");
        return;
      }

      if (!usuario.ativo) {
        await supabase.auth.signOut();
        Swal.fire(
          "Aguardando aprovação",
          "Sua conta ainda não foi aprovada pelo administrador.",
          "info"
        );
        return;
      }

      // Login bem-sucedido — zera o contador de falhas
      resetarContador();

      Swal.fire({
        title: "Sucesso",
        text: `Bem-vindo(a), ${usuario.nome || "Usuário"}!`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

    } catch {
      Swal.fire("Erro", "Ocorreu um erro inesperado. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white/40 dark:bg-gray-800/50 backdrop-blur-md shadow-lg border border-white/30 dark:border-gray-700/30">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">
          Faça seu login<span className="text-indigo-500">.</span>
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 text-sm sm:text-base">
          Acesse sua conta para participar da assembleia
        </p>

        {/* Banner de bloqueio */}
        {locked && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-center">
            <p className="text-red-600 dark:text-red-400 font-semibold text-sm">🔒 Acesso temporariamente bloqueado</p>
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">
              Muitas tentativas incorretas. Aguarde{" "}
              <span className="font-bold">{contador}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5 sm:gap-6">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={locked}
            className="w-full p-3 sm:p-4 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white/70 dark:bg-gray-700/70 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={locked}
            className="w-full p-3 sm:p-4 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white/70 dark:bg-gray-700/70 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />

          <div className="flex flex-col sm:flex-row justify-between text-sm text-indigo-600 dark:text-indigo-400 mt-1 sm:mt-2 space-y-2 sm:space-y-0">
            <button
              type="button"
              onClick={() => navigate("/recuperar-senha")}
              className="hover:text-indigo-700 dark:hover:text-indigo-300 transition"
            >
              Esqueci minha senha
            </button>
            <button
              type="button"
              onClick={() => navigate("/cadastro")}
              className="hover:text-indigo-700 dark:hover:text-indigo-300 transition"
            >
              Cadastrar-se
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || locked}
            className={`w-full mt-4 py-3 sm:py-4 rounded-xl text-white font-semibold text-lg shadow-md transition-transform transform hover:scale-[1.02] ${
              loading || locked
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-gradient-to-r from-sky-500 to-indigo-500 hover:opacity-90"
            }`}
          >
            {loading ? "Entrando..." : locked ? `Bloqueado (${contador})` : "Entrar"}
          </button>
        </form>

        {!isStandalone && (
          <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
            <button
              onClick={() => window.location.href = "/app/index.html"}
              className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm flex items-center justify-center gap-2 mx-auto transition-colors font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Prefere usar o App? Baixe aqui
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
