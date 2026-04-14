import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import {
  Plus, X, Upload, FileImage, FileVideo, ChevronRight,
  Clock, CheckCircle, AlertCircle, XCircle, Calendar,
} from "lucide-react";

const STATUS_CFG = {
  aberta:       { label: "Aberta",        icon: Clock,         color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"       },
  em_andamento: { label: "Em andamento",  icon: AlertCircle,   color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"           },
  resolvida:    { label: "Resolvida",     icon: CheckCircle,   color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"},
  cancelada:    { label: "Cancelada",     icon: XCircle,       color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"               },
};

const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime", "video/webm"];
const TAMANHO_MAX = 50 * 1024 * 1024; // 50MB

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pendente;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
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

export default function Ocorrencias() {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [anexosDetalhe, setAnexosDetalhe] = useState([]);
  const [carregandoAnexos, setCarregandoAnexos] = useState(false);

  // Form
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [arquivos, setArquivos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    buscarOcorrencias();
  }, []);

  const buscarOcorrencias = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("id, titulo, descricao, status, comentario_admin, created_at, updated_at")
      .eq("usuario_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setOcorrencias(data || []);
    setCarregando(false);
  };

  const abrirDetalhe = async (ocorrencia) => {
    setDetalhe(ocorrencia);
    setCarregandoAnexos(true);

    const { data, error } = await supabase
      .from("ocorrencia_anexos")
      .select("id, storage_path, nome_arquivo, tipo_arquivo, tamanho_bytes")
      .eq("ocorrencia_id", ocorrencia.id)
      .order("created_at", { ascending: true });

    if (error) {
      setAnexosDetalhe([]);
      setCarregandoAnexos(false);
      return;
    }

    // Gera URLs assinadas (expiram em 1h) para cada anexo
    const anexosComUrl = await Promise.all(
      (data || []).map(async (anexo) => {
        const url = await getUrlAnexo(anexo.storage_path);
        return { ...anexo, url };
      })
    );

    setAnexosDetalhe(anexosComUrl);
    setCarregandoAnexos(false);
  };

  const getUrlAnexo = async (path) => {
    const { data, error } = await supabase.storage
      .from("ocorrencias")
      .createSignedUrl(path, 60 * 60); // válida por 1 hora
    if (error) return null;
    return data.signedUrl;
  };

  const adicionarArquivos = (novos) => {
    const validos = [];
    for (const arquivo of novos) {
      if (!TIPOS_ACEITOS.includes(arquivo.type)) {
        Swal.fire("Formato inválido", `"${arquivo.name}" não é uma foto ou vídeo aceito.`, "warning");
        continue;
      }
      if (arquivo.size > TAMANHO_MAX) {
        Swal.fire("Arquivo muito grande", `"${arquivo.name}" excede 50 MB.`, "warning");
        continue;
      }
      validos.push(arquivo);
    }
    setArquivos((prev) => [...prev, ...validos]);
  };

  const removerArquivo = (index) => {
    setArquivos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    adicionarArquivos(Array.from(e.dataTransfer.files));
  };

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setArquivos([]);
    setModalAberto(false);
  };

  const handleEnviar = async (e) => {
    e.preventDefault();

    if (!titulo.trim() || !descricao.trim()) {
      Swal.fire("Atenção", "Preencha o título e a descrição.", "warning");
      return;
    }

    setEnviando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Inserir ocorrência
      const { data: ocorrencia, error: errOcorrencia } = await supabase
        .from("ocorrencias")
        .insert({
          usuario_id: user.id,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          status: "aberta",
        })
        .select("id")
        .single();

      if (errOcorrencia) throw errOcorrencia;

      // Upload dos anexos
      for (const arquivo of arquivos) {
        const ext = arquivo.name.split(".").pop();
        const path = `${user.id}/${ocorrencia.id}/${Date.now()}.${ext}`;

        const { error: errUpload } = await supabase.storage
          .from("ocorrencias")
          .upload(path, arquivo, { contentType: arquivo.type });

        if (errUpload) throw errUpload;

        const { error: errAnexo } = await supabase.from("ocorrencia_anexos").insert({
          ocorrencia_id: ocorrencia.id,
          storage_path: path,
          nome_arquivo: arquivo.name,
          tipo_arquivo: arquivo.type.startsWith("video/") ? "video" : "imagem",
          tamanho_bytes: arquivo.size,
          created_at: new Date().toISOString(),
        });
        if (errAnexo) {
          console.error("Erro ao inserir anexo:", errAnexo);
          throw errAnexo;
        }
      }

      await Swal.fire({
        title: "Ocorrência enviada!",
        text: "Sua ocorrência foi registrada e será analisada em breve.",
        icon: "success",
        confirmButtonColor: "#6366f1",
      });

      resetForm();
      buscarOcorrencias();
    } catch (err) {
      console.error(err);
      Swal.fire("Erro", "Não foi possível enviar a ocorrência. Tente novamente.", "error");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar mostrarVoltar={true} />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">

        {/* Header */}
        <div className="mt-8 mb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">
            Ocorrências<span className="text-orange-500">.</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
            Registre problemas ou situações para análise da administração.
          </p>
        </div>

        {/* Botão nova ocorrência */}
        <button
          onClick={() => setModalAberto(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-orange-400 to-red-500 text-white font-semibold shadow-md hover:opacity-90 transition-all duration-200 hover:scale-[1.01] mb-6"
        >
          <Plus className="w-5 h-5" />
          Nova ocorrência
        </button>

        {/* Loading */}
        {carregando && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!carregando && ocorrencias.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
              Nenhuma ocorrência registrada
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Use o botão acima para registrar sua primeira ocorrência.
            </p>
          </div>
        )}

        {/* Lista */}
        {!carregando && ocorrencias.length > 0 && (
          <div className="flex flex-col gap-3">
            {ocorrencias.map((oc) => (
              <button
                key={oc.id}
                onClick={() => abrirDetalhe(oc)}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-md p-4 sm:p-5 flex items-start gap-3 text-left w-full hover:shadow-lg hover:scale-[1.01] transition-all duration-200 group"
              >
                <div className={`w-1 self-stretch rounded-full shrink-0 ${
                  oc.status === "resolvida"    ? "bg-emerald-400" :
                  oc.status === "cancelada"    ? "bg-red-400" :
                  oc.status === "em_andamento" ? "bg-blue-400" : "bg-amber-400"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <StatusBadge status={oc.status} />
                  </div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 leading-snug">{oc.titulo}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{oc.descricao}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400 dark:text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {formatarData(oc.created_at)}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 self-center group-hover:text-orange-400 transition mt-1" />
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Modal — Nova ocorrência */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}
        >
          <div className="bg-white dark:bg-gray-800 w-full sm:rounded-3xl sm:max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl rounded-t-3xl">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-3xl z-10">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Nova ocorrência</h2>
              <button
                onClick={resetForm}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnviar} className="p-5 sm:p-6 flex flex-col gap-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Título</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Vazamento no corredor do bloco A"
                  maxLength={120}
                  required
                  className="w-full p-3.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm transition"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Descrição</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva detalhadamente o problema ou situação..."
                  rows={4}
                  required
                  className="w-full p-3.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm transition resize-none"
                />
              </div>

              {/* Anexos */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Anexos <span className="font-normal text-gray-400">(fotos e vídeos, opcional)</span>
                </label>

                {/* Drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => inputRef.current.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-5 text-center cursor-pointer hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all duration-200"
                >
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Arraste arquivos ou <span className="text-orange-500 font-semibold">clique para selecionar</span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPG, PNG, MP4, MOV — até 50 MB por arquivo</p>
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => adicionarArquivos(Array.from(e.target.files))}
                  />
                </div>

                {/* Preview dos arquivos */}
                {arquivos.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    {arquivos.map((arquivo, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600">
                        {arquivo.type.startsWith("video/")
                          ? <FileVideo className="w-5 h-5 text-indigo-400 shrink-0" />
                          : <FileImage className="w-5 h-5 text-orange-400 shrink-0" />
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium truncate">{arquivo.name}</p>
                          <p className="text-xs text-gray-400">{formatarBytes(arquivo.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removerArquivo(i)}
                          className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-red-400 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm shadow-md transition-all duration-200 ${
                    enviando
                      ? "bg-orange-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-400 to-red-500 hover:opacity-90 hover:scale-[1.02]"
                  }`}
                >
                  {enviando ? "Enviando..." : "Enviar ocorrência"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal — Detalhe */}
      {detalhe && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setDetalhe(null); setAnexosDetalhe([]); } }}
        >
          <div className="bg-white dark:bg-gray-800 w-full sm:rounded-3xl sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl rounded-t-3xl">
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-3xl z-10">
              <div className="flex-1 min-w-0 pr-3">
                <div className="mb-2"><StatusBadge status={detalhe.status} /></div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-snug">{detalhe.titulo}</h2>
              </div>
              <button
                onClick={() => { setDetalhe(null); setAnexosDetalhe([]); }}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              {/* Descrição */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{detalhe.descricao}</p>
              </div>

              {/* Comentário do admin */}
              {detalhe.comentario_admin && (
                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-700/30">
                  <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mb-1.5">
                    💬 Resposta da administração
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {detalhe.comentario_admin}
                  </p>
                </div>
              )}

              {/* Datas */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-700 flex-1 min-w-[140px]">
                  <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Registrada em</p>
                    <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold">{formatarData(detalhe.created_at)}</p>
                  </div>
                </div>
                {detalhe.updated_at !== detalhe.created_at && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-700 flex-1 min-w-[140px]">
                    <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Atualizada em</p>
                      <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold">{formatarData(detalhe.updated_at)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Anexos */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Anexos</p>
                {carregandoAnexos && (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                  </div>
                )}
                {!carregandoAnexos && anexosDetalhe.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum anexo enviado.</p>
                )}
                {!carregandoAnexos && anexosDetalhe.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {anexosDetalhe.map((anexo) => {
                      const isVideo = anexo.tipo_arquivo === "video";
                      return (
                        <a
                          key={anexo.id}
                          href={anexo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 hover:border-orange-400 transition group"
                        >
                          {isVideo
                            ? <FileVideo className="w-5 h-5 text-indigo-400 shrink-0" />
                            : <FileImage className="w-5 h-5 text-orange-400 shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 dark:text-gray-200 font-medium truncate group-hover:text-orange-500 transition">{anexo.nome_arquivo}</p>
                            <p className="text-xs text-gray-400">{formatarBytes(anexo.tamanho_bytes)}</p>
                          </div>
                        </a>
                      );
                    })}
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
