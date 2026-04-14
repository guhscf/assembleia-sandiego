import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";
import { Calendar, Clock, Clock3, ChevronRight, Lock } from "lucide-react";

const MAX_TENTATIVAS_EVENTO = 5;
const LOCKOUT_EVENTO_MS = 10 * 60 * 1000; // 10 minutos

function escaparHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function EventoAccess() {
  const [assembleias, setAssembleias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("todas");
  const [tentativas, setTentativas] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    buscarAssembleias();
  }, []);

  const buscarAssembleias = async () => {
    setCarregando(true);
    const agora = new Date().toISOString();
    try {
      const { data, error } = await supabase
        .from("assembleias")
        .select("id, id_assembleia, titulo, descricao, data, ativa")
        .order("ativa", { ascending: false })
        .order("data", { ascending: true });

      if (error) throw error;
      setAssembleias(data || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Erro", "Não foi possível carregar as assembleias.", "error");
    } finally {
      setCarregando(false);
    }
  };

  const acessarAssembleia = async (assembleia) => {
    const estado = tentativas[assembleia.id] || { count: 0, lockedUntil: 0 };
    if (Date.now() < estado.lockedUntil) {
      const min = Math.ceil((estado.lockedUntil - Date.now()) / 60000);
      Swal.fire({
        title: "Bloqueado",
        html: `Muitas tentativas incorretas.<br>Tente novamente em <b>${min} minuto${min !== 1 ? "s" : ""}</b>.`,
        icon: "error",
        confirmButtonColor: "#6366f1",
      });
      return;
    }

    const { value: senha, isConfirmed } = await Swal.fire({
      title: "Senha de acesso",
      html: `
        <p style="color:#6b7280;font-size:0.9rem;margin-bottom:4px">
          Informe a senha para acessar
        </p>
        <p style="color:#374151;font-weight:600;font-size:0.95rem">
          ${escaparHTML(assembleia.titulo)}
        </p>
      `,
      input: "password",
      inputPlaceholder: "Senha de acesso",
      inputAttributes: { autocomplete: "off", maxlength: "100" },
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      confirmButtonText: "Entrar",
      confirmButtonColor: "#6366f1",
      cancelButtonColor: "#9ca3af",
    });

    if (!isConfirmed || !senha) return;

    try {
      const { data: dados, error } = await supabase
        .from("assembleias")
        .select("*")
        .eq("id_assembleia", assembleia.id_assembleia)
        .single();

      if (error || !dados) {
        Swal.fire("Erro", "Assembleia não encontrada.", "error");
        return;
      }

      if (dados.senha_acesso !== senha) {
        const novoCount = (estado.count || 0) + 1;
        const lockedUntil = novoCount >= MAX_TENTATIVAS_EVENTO ? Date.now() + LOCKOUT_EVENTO_MS : 0;
        setTentativas((prev) => ({
          ...prev,
          [assembleia.id]: { count: novoCount, lockedUntil },
        }));

        const restantes = MAX_TENTATIVAS_EVENTO - novoCount;
        if (lockedUntil) {
          Swal.fire({
            title: "Bloqueado",
            html: `Muitas tentativas incorretas.<br>Tente novamente em <b>10 minutos</b>.`,
            icon: "error",
            confirmButtonColor: "#6366f1",
          });
        } else {
          Swal.fire({
            title: "Senha incorreta",
            html: `Verifique a senha e tente novamente.<br><span style="color:#ef4444;font-size:0.85rem">${restantes} tentativa${restantes !== 1 ? "s" : ""} restante${restantes !== 1 ? "s" : ""}.</span>`,
            icon: "error",
            confirmButtonColor: "#ef4444",
          });
        }
        return;
      }

      setTentativas((prev) => ({ ...prev, [assembleia.id]: { count: 0, lockedUntil: 0 } }));

      if (!dados.ativa) {
        Swal.fire({
          title: "Assembleia encerrada",
          text: "Esta assembleia não está mais aceitando votos.",
          icon: "info",
          confirmButtonColor: "#3b82f6",
        });
        return;
      }

      navigate("/votacao", { state: { assembleia: dados } });
    } catch {
      Swal.fire("Erro", "Ocorreu um erro ao acessar a assembleia.", "error");
    }
  };

  const formatarData = (iso) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const formatarHora = (iso) =>
    new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const agora = new Date();
  const ativas = assembleias.filter((a) => a.ativa);
  const futuras = assembleias.filter(
    (a) => !a.ativa && new Date(a.data) > agora
  );

  const visiveis =
    filtro === "ativas"
      ? ativas
      : filtro === "futuras"
      ? futuras
      : [...ativas, ...futuras];

  const emptyMessages = {
    todas: "Nenhuma assembleia disponível",
    ativas: "Nenhuma assembleia ativa no momento",
    futuras: "Nenhuma assembleia futura agendada",
  };

  const tabs = [
    { id: "todas",  label: "Todas",   count: ativas.length + futuras.length },
    { id: "ativas", label: "Ativas",  count: ativas.length },
    { id: "futuras",label: "Futuras", count: futuras.length },
  ];

  const renderCard = (a) => {
    const isAtiva = a.ativa;
    return (
      <div
        key={a.id}
        className={`
          bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border shadow-md
          p-5 sm:p-6 flex flex-col gap-4
          transition-all duration-200
          ${
            isAtiva
              ? "border-emerald-100 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-lg hover:scale-[1.01]"
              : "border-amber-100 dark:border-amber-800 opacity-80"
          }
        `}
      >
        {/* Badge + título */}
        <div className="flex flex-col gap-2">
          {isAtiva ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ativa
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 rounded-full w-fit">
              <Clock3 className="w-3 h-3" />
              Em breve
            </span>
          )}
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 leading-snug">
            {a.titulo}
          </h2>
        </div>

        {a.descricao && (
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{a.descricao}</p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
              {formatarData(a.data)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
              {formatarHora(a.data)}
            </span>
          </div>

          {isAtiva ? (
            <button
              onClick={() => acessarAssembleia(a)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-sky-500 to-indigo-500 hover:opacity-90 shadow-md hover:scale-[1.02] transition-all shrink-0"
            >
              Acessar
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-gray-400 dark:text-gray-500 font-semibold text-sm bg-gray-100 dark:bg-gray-700 cursor-not-allowed shrink-0 select-none">
              <Lock className="w-4 h-4" />
              Em breve
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <Navbar mostrarVoltar={true} />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        {/* Cabeçalho */}
        <div className="mt-8 mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">
            Assembleias<span className="text-indigo-500">.</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
            Confira as assembleias disponíveis e participe.
          </p>
        </div>

        {/* Filtros */}
        {!carregando && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFiltro(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  filtro === tab.id
                    ? "bg-indigo-500 text-white shadow-md scale-[1.03]"
                    : "bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-700/80 border border-gray-200 dark:border-gray-600"
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    filtro === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {carregando && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!carregando && visiveis.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
              {emptyMessages[filtro]}
            </p>
            <p className="text-sm mt-1 text-gray-400 dark:text-gray-500">
              Fique atento a novos avisos.
            </p>
          </div>
        )}

        {/* Lista */}
        {!carregando && visiveis.length > 0 && (
          <div className="flex flex-col gap-4">
            {visiveis.map((a) => renderCard(a))}
          </div>
        )}
      </main>
    </div>
  );
}
