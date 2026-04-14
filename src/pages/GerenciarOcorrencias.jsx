import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase.js";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import {
  Search, X, Clock, CheckCircle, AlertCircle, XCircle,
  Calendar, ChevronRight, FileImage, FileVideo, MessageSquare,
  User, Filter,
} from "lucide-react";

const STATUS_CFG = {
  aberta:       { label: "Aberta",        icon: Clock,         pill: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",   bar: "bg-amber-400"   },
  em_andamento: { label: "Em andamento",  icon: AlertCircle,   pill: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",       bar: "bg-blue-400"    },
  resolvida:    { label: "Resolvida",     icon: CheckCircle,   pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", bar: "bg-emerald-400" },
  cancelada:    { label: "Cancelada",     icon: XCircle,       pill: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",           bar: "bg-red-400"     },
};

const FILTROS = [
  { value: "todos",       label: "Todos"        },
  { value: "aberta",      label: "Abertas"      },
  { value: "em_andamento",label: "Em andamento" },
  { value: "resolvida",   label: "Resolvidas"   },
  { value: "cancelada",   label: "Canceladas"   },
];

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.aberta;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.pill}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function formatarData(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatarBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GerenciarOcorrencias() {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [selecionada, setSelecionada] = useState(null);
  const [anexos, setAnexos] = useState([]);
  const [carregandoAnexos, setCarregandoAnexos] = useState(false);
  const [comentario, setComentario] = useState("");
  const [novoStatus, setNovoStatus] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    buscarOcorrencias();
  }, []);

  const buscarOcorrencias = async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from("ocorrencias")
      .select("id, titulo, descricao, status, comentario_admin, created_at, updated_at, usuario_id")
      .order("created_at", { ascending: false });

    if (!error) setOcorrencias(data || []);
    setCarregando(false);
  };

  const filtradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return ocorrencias.filter((oc) => {
      const matchFiltro = filtro === "todos" || oc.status === filtro;
      const matchBusca = !termo ||
        oc.titulo.toLowerCase().includes(termo) ||
        oc.descricao.toLowerCase().includes(termo);
      return matchFiltro && matchBusca;
    });
  }, [ocorrencias, filtro, busca]);

  const contadores = useMemo(() => {
    return Object.keys(STATUS_CFG).reduce((acc, s) => {
      acc[s] = ocorrencias.filter((oc) => oc.status === s).length;
      return acc;
    }, {});
  }, [ocorrencias]);

  const abrirDetalhe = async (oc) => {
    setSelecionada(oc);
    setComentario(oc.comentario_admin || "");
    setNovoStatus(oc.status);
    setCarregandoAnexos(true);

    const { data } = await supabase
      .from("ocorrencia_anexos")
      .select("id, storage_path, nome_arquivo, tipo_arquivo, tamanho_bytes")
      .eq("ocorrencia_id", oc.id)
      .order("created_at", { ascending: true });

    const anexosComUrl = await Promise.all(
      (data || []).map(async (anexo) => {
        const { data: signed } = await supabase.storage
          .from("ocorrencias")
          .createSignedUrl(anexo.storage_path, 60 * 60);
        return { ...anexo, url: signed?.signedUrl || null };
      })
    );

    setAnexos(anexosComUrl);
    setCarregandoAnexos(false);
  };

  const fecharDetalhe = () => {
    setSelecionada(null);
    setAnexos([]);
    setComentario("");
    setNovoStatus("");
  };

  const handleSalvar = async () => {
    if (!selecionada) return;
    setSalvando(true);

    try {
      const { error } = await supabase
        .from("ocorrencias")
        .update({
          status: novoStatus,
          comentario_admin: comentario.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selecionada.id);

      if (error) throw error;

      setOcorrencias((prev) =>
        prev.map((oc) =>
          oc.id === selecionada.id
            ? { ...oc, status: novoStatus, comentario_admin: comentario.trim() || null }
            : oc
        )
      );

      await Swal.fire({
        title: "Salvo!",
        text: "A ocorrência foi atualizada com sucesso.",
        icon: "success",
        confirmButtonColor: "#6366f1",
        timer: 2000,
        showConfirmButton: false,
      });

      fecharDetalhe();
    } catch (err) {
      console.error(err);
      Swal.fire("Erro", "Não foi possível salvar as alterações.", "error");
    } finally {
      setSalvando(false);
    }
  };

  const temAlteracao = selecionada &&
    (novoStatus !== selecionada.status || comentario.trim() !== (selecionada.comentario_admin || "").trim());

  return (
    <div className="min-h-screen">
      <Navbar mostrarVoltar={true} />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mt-8 mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">
            Ocorrências<span className="text-orange-500">.</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Gerencie e responda as ocorrências enviadas pelos moradores.
          </p>
        </div>

        {/* Cards de contagem */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(STATUS_CFG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const ativo = filtro === key;
            return (
              <button
                key={key}
                onClick={() => setFiltro(ativo ? "todos" : key)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
                  ativo
                    ? `${cfg.pill} border-current shadow-sm scale-[1.02]`
                    : "bg-white/60 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:scale-[1.01] hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${ativo ? "" : "text-gray-500 dark:text-gray-400"}`} />
                  <span className={`text-xs font-semibold ${ativo ? "" : "text-gray-600 dark:text-gray-300"}`}>{cfg.label}</span>
                </div>
                <p className={`text-2xl font-bold ${ativo ? "" : "text-gray-800 dark:text-gray-100"}`}>
                  {contadores[key] ?? 0}
                </p>
              </button>
            );
          })}
        </div>

        {/* Busca e filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título ou descrição..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl border border-white/40 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 transition"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro select mobile */}
          <div className="flex items-center gap-2 sm:hidden">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="flex-1 px-3 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 text-sm font-medium text-gray-700 dark:text-gray-300 outline-none focus:border-orange-400 transition"
            >
              {FILTROS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Filtro pills desktop */}
          <div className="hidden sm:flex gap-1.5 flex-wrap">
            {FILTROS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  filtro === f.value
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-white/80"
                }`}
              >
                {f.label}
                {f.value !== "todos" && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                    filtro === f.value ? "bg-white/30" : "bg-gray-100 dark:bg-gray-700"
                  }`}>
                    {contadores[f.value] ?? 0}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Contagem resultados */}
        {(busca || filtro !== "todos") && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            {filtradas.length} resultado{filtradas.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Loading */}
        {carregando && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!carregando && filtradas.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{busca || filtro !== "todos" ? "🔍" : "📭"}</div>
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
              {busca || filtro !== "todos" ? "Nenhuma ocorrência encontrada" : "Nenhuma ocorrência registrada"}
            </p>
          </div>
        )}

        {/* Lista */}
        {!carregando && filtradas.length > 0 && (
          <div className="flex flex-col gap-3">
            {filtradas.map((oc) => {
              const cfg = STATUS_CFG[oc.status] ?? STATUS_CFG.aberta;
              return (
                <button
                  key={oc.id}
                  onClick={() => abrirDetalhe(oc)}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-md p-4 sm:p-5 flex items-start gap-3 text-left w-full hover:shadow-lg hover:scale-[1.005] transition-all duration-200 group"
                >
                  <div className={`w-1 self-stretch rounded-full shrink-0 ${cfg.bar}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <StatusBadge status={oc.status} />
                      {oc.comentario_admin && (
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-500 dark:text-indigo-400 font-medium">
                          <MessageSquare className="w-3 h-3" /> Respondida
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100 leading-snug">{oc.titulo}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{oc.descricao}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatarData(oc.created_at)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 self-center group-hover:text-orange-400 transition" />
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal detalhe + edição */}
      {selecionada && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) fecharDetalhe(); }}
        >
          <div className="bg-white dark:bg-gray-800 w-full sm:rounded-3xl sm:max-w-xl max-h-[95vh] overflow-y-auto shadow-2xl rounded-t-3xl">

            {/* Header modal */}
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-3xl z-10">
              <div className="flex-1 min-w-0 pr-3">
                <div className="mb-2"><StatusBadge status={selecionada.status} /></div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-snug">{selecionada.titulo}</h2>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                  <User className="w-3 h-3" />
                  <span>{formatarData(selecionada.created_at)}</span>
                </div>
              </div>
              <button
                onClick={fecharDetalhe}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">

              {/* Descrição */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Descrição</p>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{selecionada.descricao}</p>
                </div>
              </div>

              {/* Anexos */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Anexos</p>
                {carregandoAnexos && (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                  </div>
                )}
                {!carregandoAnexos && anexos.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum anexo enviado.</p>
                )}
                {!carregandoAnexos && anexos.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {anexos.map((anexo) => (
                      <a
                        key={anexo.id}
                        href={anexo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 hover:border-orange-400 transition group"
                      >
                        {anexo.tipo_arquivo === "video"
                          ? <FileVideo className="w-5 h-5 text-indigo-400 shrink-0" />
                          : <FileImage className="w-5 h-5 text-orange-400 shrink-0" />
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium truncate group-hover:text-orange-500 transition">{anexo.nome_arquivo}</p>
                          <p className="text-xs text-gray-400">{formatarBytes(anexo.tamanho_bytes)}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Alterar status */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Alterar status</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(STATUS_CFG).filter(([key]) => key !== "aberta").map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const ativo = novoStatus === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNovoStatus(key)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                          ativo
                            ? `${cfg.pill} border-current scale-[1.03] shadow-sm`
                            : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comentário admin */}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Comentário para o morador
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Escreva uma resposta ou observação para o morador..."
                  rows={4}
                  className="w-full mt-2 p-3.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition resize-none"
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={fecharDetalhe}
                  className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleSalvar}
                  disabled={salvando || !temAlteracao}
                  className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm shadow-md transition-all duration-200 ${
                    salvando || !temAlteracao
                      ? "bg-indigo-300 dark:bg-indigo-800 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:opacity-90 hover:scale-[1.02]"
                  }`}
                >
                  {salvando ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
