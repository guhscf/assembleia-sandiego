import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import { enviarNotificacao } from "../services/notificacoes";
import {
  Plus, X, Pencil, Trash2, Pin, Eye, EyeOff,
  Calendar, Tag, AlignLeft, ChevronRight,
} from "lucide-react";

const CATEGORIAS = [
  { value: "informativo", label: "Informativo", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { value: "urgente",     label: "Urgente",     color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
];

const FORM_VAZIO = {
  titulo: "",
  conteudo: "",
  categoria: "informativo",
  fixado: false,
  ativo: true,
  data_inicio: "",
  data_expiracao: "",
};

function Badge({ categoria }) {
  const cfg = CATEGORIAS.find((c) => c.value === categoria) ?? CATEGORIAS[0];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
      <Tag className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function Campo({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm text-gray-800 dark:text-gray-100 transition placeholder:text-gray-400 dark:placeholder:text-gray-500";

export default function GerenciarAvisos() {
  const [avisos, setAvisos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [detalhe, setDetalhe] = useState(null);

  useEffect(() => {
    buscarAvisos();
  }, []);

  const buscarAvisos = async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from("avisos")
      .select("*")
      .order("fixado", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error) setAvisos(data || []);
    setCarregando(false);
  };

  const abrirNovo = () => {
    setEditando(null);
    setForm(FORM_VAZIO);
    setMostrarForm(true);
  };

  const abrirEditar = (aviso) => {
    setEditando(aviso);
    setForm({
      titulo: aviso.titulo ?? "",
      conteudo: aviso.conteudo ?? "",
      categoria: aviso.categoria ?? "geral",
      fixado: aviso.fixado ?? false,
      ativo: aviso.ativo ?? true,
      data_inicio: aviso.data_inicio ?? "",
      data_expiracao: aviso.data_expiracao ?? "",
    });
    setDetalhe(null);
    setMostrarForm(true);
  };

  const fecharForm = () => {
    setMostrarForm(false);
    setEditando(null);
    setForm(FORM_VAZIO);
  };

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const salvar = async () => {
    if (!form.titulo.trim()) {
      Swal.fire("Atenção", "O título é obrigatório.", "warning");
      return;
    }
    if (!form.conteudo.trim()) {
      Swal.fire("Atenção", "O conteúdo é obrigatório.", "warning");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        titulo: form.titulo.trim(),
        conteudo: form.conteudo.trim(),
        categoria: form.categoria,
        fixado: form.fixado,
        ativo: form.ativo,
        data_inicio: form.data_inicio || null,
        data_expiracao: form.data_expiracao || null,
      };

      let error;
      if (editando) {
        ({ error } = await supabase
          .from("avisos")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editando.id));
      } else {
        ({ error } = await supabase.from("avisos").insert(payload));
        if (!error && payload.ativo) {
          enviarNotificacao({
            titulo: "Novo aviso",
            corpo: payload.titulo,
            role: "morador",
          });
        }
      }

      if (error) throw error;

      await Swal.fire({
        title: editando ? "Aviso atualizado!" : "Aviso criado!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      fecharForm();
      buscarAvisos();
    } catch {
      Swal.fire("Erro", "Não foi possível salvar o aviso.", "error");
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (aviso) => {
    const result = await Swal.fire({
      title: "Excluir aviso?",
      text: `"${aviso.titulo}" será removido permanentemente.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    const { error } = await supabase.from("avisos").delete().eq("id", aviso.id);
    if (error) {
      Swal.fire("Erro", "Não foi possível excluir o aviso.", "error");
    } else {
      setDetalhe(null);
      buscarAvisos();
    }
  };

  const toggleAtivo = async (aviso) => {
    const { error } = await supabase
      .from("avisos")
      .update({ ativo: !aviso.ativo, updated_at: new Date().toISOString() })
      .eq("id", aviso.id);

    if (!error) buscarAvisos();
  };

  const formatarData = (d) =>
    d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : null;

  return (
    <div className="min-h-screen">
      <Navbar mostrarVoltar={true} />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mt-8 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">
              Avisos<span className="text-indigo-500">.</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
              Gerencie os comunicados exibidos aos moradores.
            </p>
          </div>
          <button
            onClick={abrirNovo}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm shadow-md transition-all duration-200 hover:scale-[1.02] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Novo Aviso
          </button>
        </div>

        {/* Loading */}
        {carregando && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!carregando && avisos.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📢</div>
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Nenhum aviso cadastrado</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Clique em "Novo Aviso" para começar.</p>
          </div>
        )}

        {/* Lista */}
        {!carregando && avisos.length > 0 && (
          <div className="flex flex-col gap-3">
            {avisos.map((aviso) => (
              <button
                key={aviso.id}
                onClick={() => setDetalhe(aviso)}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-md p-4 sm:p-5 flex items-start gap-4 text-left w-full hover:shadow-lg hover:scale-[1.01] transition-all duration-200 group"
              >
                {aviso.fixado && (
                  <div className="shrink-0 mt-0.5">
                    <Pin className="w-4 h-4 text-indigo-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Badge categoria={aviso.categoria} />
                    {!aviso.ativo && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        <EyeOff className="w-3 h-3" />
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{aviso.titulo}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{aviso.conteudo}</p>
                  {(aviso.data_inicio || aviso.data_expiracao) && (
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                      {aviso.data_inicio && <span>📅 Início: {formatarData(aviso.data_inicio)}</span>}
                      {aviso.data_expiracao && <span>⏳ Expira: {formatarData(aviso.data_expiracao)}</span>}
                    </div>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0 self-center group-hover:text-indigo-400 transition" />
              </button>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal de detalhe ── */}
      {detalhe && !mostrarForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setDetalhe(null); }}
        >
          <div className="bg-white dark:bg-gray-800 w-full sm:rounded-3xl sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl rounded-t-3xl">
            {/* Header */}
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-3xl z-10">
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex flex-wrap gap-2 mb-1.5">
                  <Badge categoria={detalhe.categoria} />
                  {detalhe.fixado && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                      <Pin className="w-3 h-3" /> Fixado
                    </span>
                  )}
                  {!detalhe.ativo && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      <EyeOff className="w-3 h-3" /> Inativo
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{detalhe.titulo}</h2>
              </div>
              <button
                onClick={() => setDetalhe(null)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo */}
            <div className="p-5 sm:p-6 space-y-5">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{detalhe.conteudo}</p>
              </div>

              {(detalhe.data_inicio || detalhe.data_expiracao) && (
                <div className="grid grid-cols-2 gap-3">
                  {detalhe.data_inicio && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
                      <Calendar className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Data início</p>
                        <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold">{formatarData(detalhe.data_inicio)}</p>
                      </div>
                    </div>
                  )}
                  {detalhe.data_expiracao && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
                      <Calendar className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Expira em</p>
                        <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold">{formatarData(detalhe.data_expiracao)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-3 border-t border-gray-100 dark:border-gray-700 pt-5">
                <button
                  onClick={() => toggleAtivo(detalhe)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition shadow-sm ${
                    detalhe.ativo
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                  }`}
                >
                  {detalhe.ativo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {detalhe.ativo ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() => abrirEditar(detalhe)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition shadow-sm"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => excluir(detalhe)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de formulário ── */}
      {mostrarForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) fecharForm(); }}
        >
          <div className="bg-white dark:bg-gray-800 w-full sm:rounded-3xl sm:max-w-xl max-h-[95vh] overflow-y-auto shadow-2xl rounded-t-3xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-3xl z-10">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {editando ? "Editar Aviso" : "Novo Aviso"}
              </h2>
              <button
                onClick={fecharForm}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Título */}
              <Campo label="Título" required>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => set("titulo", e.target.value)}
                  placeholder="Ex: Manutenção da piscina"
                  className={inputCls}
                  maxLength={200}
                />
              </Campo>

              {/* Conteúdo */}
              <Campo label="Conteúdo" required>
                <div className="relative">
                  <AlignLeft className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <textarea
                    rows={4}
                    value={form.conteudo}
                    onChange={(e) => set("conteudo", e.target.value)}
                    placeholder="Descreva o aviso com detalhes..."
                    className={`${inputCls} pl-9 resize-none`}
                  />
                </div>
              </Campo>

              {/* Categoria */}
              <Campo label="Categoria">
                <select
                  value={form.categoria}
                  onChange={(e) => set("categoria", e.target.value)}
                  className={inputCls}
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Campo>

              {/* Datas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Campo label="Data de início">
                  <input
                    type="date"
                    value={form.data_inicio}
                    onChange={(e) => set("data_inicio", e.target.value)}
                    className={inputCls}
                  />
                </Campo>
                <Campo label="Data de expiração">
                  <input
                    type="date"
                    value={form.data_expiracao}
                    onChange={(e) => set("data_expiracao", e.target.value)}
                    className={inputCls}
                  />
                </Campo>
              </div>

              {/* Toggles */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => set("fixado", !form.fixado)}
                  className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    form.fixado
                      ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30"
                      : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <Pin className={`w-5 h-5 shrink-0 ${form.fixado ? "text-indigo-500" : "text-gray-400"}`} />
                  <div>
                    <p className={`text-sm font-semibold ${form.fixado ? "text-indigo-700 dark:text-indigo-400" : "text-gray-700 dark:text-gray-200"}`}>
                      Fixar aviso
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Aparece no topo da lista</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => set("ativo", !form.ativo)}
                  className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    form.ativo
                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30"
                      : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  {form.ativo
                    ? <Eye className="w-5 h-5 shrink-0 text-emerald-500" />
                    : <EyeOff className="w-5 h-5 shrink-0 text-gray-400" />
                  }
                  <div>
                    <p className={`text-sm font-semibold ${form.ativo ? "text-emerald-700 dark:text-emerald-400" : "text-gray-700 dark:text-gray-200"}`}>
                      {form.ativo ? "Aviso ativo" : "Aviso inativo"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {form.ativo ? "Visível para os moradores" : "Oculto para os moradores"}
                    </p>
                  </div>
                </button>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-1 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={fecharForm}
                  disabled={salvando}
                  className="px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvar}
                  disabled={salvando}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm shadow-md transition disabled:opacity-60"
                >
                  {salvando ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>{editando ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}</>
                  )}
                  {editando ? "Salvar alterações" : "Criar aviso"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
