import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase.js";
import Navbar from "../components/Navbar";
import { Search, Pin, X, Calendar, Tag, ChevronRight } from "lucide-react";

const CATEGORIAS = [
  { value: "todos",       label: "Todos"       },
  { value: "informativo", label: "Informativo" },
  { value: "urgente",     label: "Urgente"     },
];

const CATEGORIA_CFG = {
  informativo: { color: "bg-blue-100 text-blue-700",   dot: "bg-blue-500"  },
  urgente:     { color: "bg-red-100 text-red-700",     dot: "bg-red-500 animate-pulse" },
};

function Badge({ categoria }) {
  const cfg = CATEGORIA_CFG[categoria] ?? CATEGORIA_CFG.informativo;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
    </span>
  );
}

const PERIODOS = [
  { value: "todos",   label: "Qualquer data" },
  { value: "hoje",    label: "Hoje"          },
  { value: "semana",  label: "Esta semana"   },
  { value: "mes",     label: "Este mês"      },
];

function dentroDoPeríodo(dataStr, periodo) {
  if (periodo === "todos" || !dataStr) return true;
  const data = new Date(dataStr);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (periodo === "hoje") {
    const fim = new Date(hoje); fim.setDate(fim.getDate() + 1);
    return data >= hoje && data < fim;
  }
  if (periodo === "semana") {
    const fim = new Date(hoje); fim.setDate(fim.getDate() + 7);
    return data >= hoje && data < fim;
  }
  if (periodo === "mes") {
    return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
  }
  return true;
}

function formatarData(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function MuralAvisos() {
  const [avisos, setAvisos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todos");
  const [periodo, setPeriodo] = useState("todos");
  const [aberto, setAberto] = useState(null);

  useEffect(() => {
    const buscarAvisos = async () => {
      const hoje = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("avisos")
        .select("id, titulo, conteudo, categoria, fixado, data_inicio, data_expiracao, created_at")
        .eq("ativo", true)
        .or(`data_expiracao.is.null,data_expiracao.gte.${hoje}`)
        .order("fixado", { ascending: false })
        .order("created_at", { ascending: false });

      if (!error) setAvisos(data || []);
      setCarregando(false);
    };

    buscarAvisos();
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return avisos.filter((a) => {
      const matchBusca =
        !termo ||
        a.titulo.toLowerCase().includes(termo) ||
        a.conteudo.toLowerCase().includes(termo);
      const matchCategoria = categoria === "todos" || a.categoria === categoria;
      const matchPeriodo = dentroDoPeríodo(a.created_at, periodo);
      return matchBusca && matchCategoria && matchPeriodo;
    });
  }, [avisos, busca, categoria, periodo]);

  const temFiltro = busca || categoria !== "todos" || periodo !== "todos";

  const limparFiltros = () => {
    setBusca("");
    setCategoria("todos");
    setPeriodo("todos");
  };

  return (
    <div className="min-h-screen">
      <Navbar mostrarVoltar={true} />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">

        {/* Header */}
        <div className="mt-8 mb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl">📢</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
            Mural de Avisos<span className="text-emerald-500">.</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Fique por dentro dos comunicados do condomínio.
          </p>
        </div>

        {/* Busca */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título ou conteúdo..."
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-white/40 bg-white/60 backdrop-blur-sm shadow-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm text-gray-800 placeholder:text-gray-400 transition"
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          {/* Categoria */}
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIAS.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategoria(c.value)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  categoria === c.value
                    ? "bg-emerald-500 text-white shadow-sm scale-[1.03]"
                    : "bg-white/50 text-gray-500 hover:bg-white/80 border border-gray-200"
                }`}
              >
                {c.value !== "todos" && (
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    c.value === "urgente" ? "bg-red-400" : "bg-blue-400"
                  } ${categoria === c.value ? "opacity-0" : ""}`} />
                )}
                {c.label}
              </button>
            ))}
          </div>

          {/* Período */}
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="sm:ml-auto px-3.5 py-2 rounded-xl border border-gray-200 bg-white/50 text-xs font-semibold text-gray-600 outline-none focus:border-emerald-400 transition cursor-pointer"
          >
            {PERIODOS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Limpar filtros */}
        {temFiltro && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-400">
              {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={limparFiltros}
              className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Limpar filtros
            </button>
          </div>
        )}

        {/* Loading */}
        {carregando && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!carregando && filtrados.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{temFiltro ? "🔍" : "📭"}</div>
            <p className="text-lg font-medium text-gray-500">
              {temFiltro ? "Nenhum aviso encontrado" : "Nenhum aviso disponível"}
            </p>
            {temFiltro && (
              <button onClick={limparFiltros} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Lista */}
        {!carregando && filtrados.length > 0 && (
          <div className="flex flex-col gap-3">
            {filtrados.map((aviso) => (
              <button
                key={aviso.id}
                onClick={() => setAberto(aviso)}
                className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 shadow-md p-4 sm:p-5 flex items-start gap-3 text-left w-full hover:shadow-lg hover:scale-[1.01] transition-all duration-200 group"
              >
                {/* Linha colorida lateral */}
                <div className={`w-1 self-stretch rounded-full shrink-0 ${
                  aviso.categoria === "urgente" ? "bg-red-400" : "bg-blue-300"
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Badge categoria={aviso.categoria} />
                    {aviso.fixado && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500">
                        <Pin className="w-3 h-3" /> Fixado
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-gray-800 leading-snug">{aviso.titulo}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">{aviso.conteudo}</p>

                  <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {formatarData(aviso.created_at)}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 self-center group-hover:text-emerald-400 transition mt-1" />
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Modal de detalhe */}
      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setAberto(null); }}
        >
          <div className="bg-white w-full sm:rounded-3xl sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl rounded-t-3xl">
            {/* Header */}
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge categoria={aberto.categoria} />
                  {aberto.fixado && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-500">
                      <Pin className="w-3 h-3" /> Fixado
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-800 leading-snug">{aberto.titulo}</h2>
              </div>
              <button
                onClick={() => setAberto(null)}
                className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{aberto.conteudo}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 flex-1 min-w-[140px]">
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Publicado em</p>
                    <p className="text-sm text-gray-700 font-semibold">{formatarData(aberto.created_at)}</p>
                  </div>
                </div>

                {aberto.data_expiracao && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 flex-1 min-w-[140px]">
                    <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Válido até</p>
                      <p className="text-sm text-gray-700 font-semibold">{formatarData(aberto.data_expiracao)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
