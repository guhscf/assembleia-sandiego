import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import {
  X, Check, XCircle, ChevronRight,
  Calendar, Clock, Users, Mail, Phone, CreditCard, FileText,
} from "lucide-react";

const STATUS_CONFIG = {
  pendente:   { label: "Pendente",   bg: "bg-amber-100 dark:bg-amber-900/30",    text: "text-amber-700 dark:text-amber-400",    dot: "bg-amber-500 animate-pulse" },
  confirmada: { label: "Confirmada", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  cancelada:  { label: "Cancelada",  bg: "bg-red-100 dark:bg-red-900/30",        text: "text-red-700 dark:text-red-400",        dot: "bg-red-500"    },
  concluida:  { label: "Concluída",  bg: "bg-gray-100 dark:bg-gray-700",         text: "text-gray-500 dark:text-gray-400",      dot: "bg-gray-400"   },
};

const FILTROS = [
  { id: "todas",      label: "Todas"      },
  { id: "pendente",   label: "Pendentes"  },
  { id: "confirmada", label: "Confirmadas"},
  { id: "cancelada",  label: "Canceladas" },
  { id: "concluida",  label: "Concluídas" },
];

function Info({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
      <span className="text-indigo-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{label}</p>
        <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold break-words">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function GerenciarReservas() {
  const [reservas, setReservas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("todas");
  const [selecionada, setSelecionada] = useState(null);
  const [recusando, setRecusando] = useState(false);
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    buscarReservas();
  }, []);

  const buscarReservas = async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setReservas(data || []);
    setCarregando(false);
  };

  const enviarEmail = async (para, assunto, corpo) => {
    try {
      await supabase.functions.invoke("enviar-email", {
        body: { para, assunto, corpo },
      });
    } catch (err) {
      console.warn("Email não enviado (configure a Edge Function 'enviar-email'):", err);
    }
  };

  const fecharModal = () => {
    setSelecionada(null);
    setRecusando(false);
    setMotivoRecusa("");
  };

  const aprovar = async () => {
    setProcessando(true);
    try {
      const { error } = await supabase
        .from("reservas")
        .update({ status: "confirmada", updated_at: new Date().toISOString() })
        .eq("id", selecionada.id);

      if (error) throw error;

      await enviarEmail(
        selecionada.cliente_email,
        `✅ Reserva ${selecionada.codigo_reserva} confirmada — SanDiego+`,
        `Olá, ${selecionada.cliente_nome}!\n\nSua reserva do salão de festas foi CONFIRMADA.\n\n` +
        `📋 Código: ${selecionada.codigo_reserva}\n` +
        `📅 Data: ${formatarData(selecionada.data_evento)}\n` +
        `🕐 Horário: ${selecionada.horario_inicio} às ${selecionada.horario_fim}\n\n` +
        `Em caso de dúvidas, entre em contato com a administração.\n\nSanDiego+`
      );

      await Swal.fire({
        title: "Reserva aprovada!",
        text: "O morador será notificado por e-mail.",
        icon: "success",
        confirmButtonColor: "#6366f1",
      });

      fecharModal();
      buscarReservas();
    } catch {
      Swal.fire("Erro", "Não foi possível aprovar a reserva.", "error");
    } finally {
      setProcessando(false);
    }
  };

  const recusar = async () => {
    if (!motivoRecusa.trim()) {
      Swal.fire("Atenção", "Informe o motivo da recusa.", "warning");
      return;
    }
    setProcessando(true);
    try {
      const { error } = await supabase
        .from("reservas")
        .update({
          status: "cancelada",
          observacoes: motivoRecusa.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selecionada.id);

      if (error) throw error;

      await enviarEmail(
        selecionada.cliente_email,
        `❌ Reserva ${selecionada.codigo_reserva} cancelada — SanDiego+`,
        `Olá, ${selecionada.cliente_nome}.\n\nInfelizmente sua reserva do salão de festas foi CANCELADA.\n\n` +
        `📌 Motivo: ${motivoRecusa.trim()}\n\n` +
        `📋 Código: ${selecionada.codigo_reserva}\n` +
        `📅 Data solicitada: ${formatarData(selecionada.data_evento)}\n\n` +
        `Para mais informações, entre em contato com a administração.\n\nSanDiego+`
      );

      await Swal.fire({
        title: "Reserva recusada",
        text: "O morador será notificado por e-mail com o motivo informado.",
        icon: "info",
        confirmButtonColor: "#6366f1",
      });

      fecharModal();
      buscarReservas();
    } catch {
      Swal.fire("Erro", "Não foi possível recusar a reserva.", "error");
    } finally {
      setProcessando(false);
    }
  };

  const formatarData = (date) =>
    date
      ? new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
          day: "2-digit", month: "long", year: "numeric",
        })
      : "—";

  const visiveis =
    filtro === "todas" ? reservas : reservas.filter((r) => r.status === filtro);

  const contagem = (s) => reservas.filter((r) => r.status === s).length;

  return (
    <div className="min-h-screen">
      <Navbar mostrarVoltar={true} />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="mt-8 mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">
            Reservas<span className="text-indigo-500">.</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
            Gerencie as solicitações de reserva do salão de festas.
          </p>
        </div>

        {/* Filtros */}
        {!carregando && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {FILTROS.map((f) => {
              const count = f.id === "todas" ? reservas.length : contagem(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => setFiltro(f.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    filtro === f.id
                      ? "bg-indigo-500 text-white shadow-md scale-[1.03]"
                      : "bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-700/80 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  {f.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    filtro === f.id ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Loading */}
        {carregando && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!carregando && visiveis.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Nenhuma reserva encontrada</p>
          </div>
        )}

        {/* Lista */}
        {!carregando && visiveis.length > 0 && (
          <div className="flex flex-col gap-3">
            {visiveis.map((r) => {
              const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pendente;
              return (
                <button
                  key={r.id}
                  onClick={() => { setSelecionada(r); setRecusando(false); setMotivoRecusa(""); }}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-md p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 text-left w-full hover:shadow-lg hover:scale-[1.01] transition-all duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{r.codigo_reserva}</span>
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{r.cliente_nome}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>📅 {formatarData(r.data_evento)}</span>
                      <span>🎉 {r.tipo_evento}</span>
                      <span>👥 {r.num_convidados} convidados</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0 hidden sm:block" />
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Modal de detalhes ── */}
      {selecionada && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) fecharModal(); }}
        >
          <div className="bg-white dark:bg-gray-800 w-full sm:rounded-3xl sm:max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl rounded-t-3xl">
            {/* Header */}
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-3xl z-10">
              <div>
                {(() => {
                  const cfg = STATUS_CONFIG[selecionada.status] ?? STATUS_CONFIG.pendente;
                  return (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-1.5 ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  );
                })()}
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{selecionada.cliente_nome}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{selecionada.codigo_reserva}</p>
              </div>
              <button
                onClick={fecharModal}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo */}
            <div className="p-5 sm:p-6 space-y-6">
              {/* Contato */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Contato</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Info icon={<Mail className="w-4 h-4" />} label="E-mail" value={selecionada.cliente_email} />
                  <Info icon={<Phone className="w-4 h-4" />} label="Telefone" value={selecionada.cliente_telefone} />
                  {selecionada.cliente_cpf_cnpj && (
                    <Info icon={<CreditCard className="w-4 h-4" />} label="CPF / CNPJ" value={selecionada.cliente_cpf_cnpj} />
                  )}
                </div>
              </section>

              {/* Evento */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Evento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Info icon={<Calendar className="w-4 h-4" />} label="Data do evento" value={formatarData(selecionada.data_evento)} />
                  <Info icon={<FileText className="w-4 h-4" />} label="Tipo" value={selecionada.tipo_evento} />
                  <Info icon={<Clock className="w-4 h-4" />} label="Horário" value={`${selecionada.horario_inicio} às ${selecionada.horario_fim}`} />
                  <Info icon={<Users className="w-4 h-4" />} label="Convidados" value={`${selecionada.num_convidados} pessoas`} />
                  {selecionada.data_montagem && (
                    <Info icon={<Calendar className="w-4 h-4" />} label="Data de montagem" value={formatarData(selecionada.data_montagem)} />
                  )}
                </div>

                {selecionada.descricao_evento && (
                  <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-1">Descrição do evento</p>
                    <p className="text-sm text-gray-700 dark:text-gray-200">{selecionada.descricao_evento}</p>
                  </div>
                )}

                {selecionada.observacoes && (
                  <div className={`mt-3 p-3 rounded-xl ${selecionada.status === "cancelada" ? "bg-red-50 dark:bg-red-900/20" : "bg-gray-50 dark:bg-gray-700"}`}>
                    <p className="text-xs font-medium mb-1 text-gray-400 dark:text-gray-500">
                      {selecionada.status === "cancelada" ? "Motivo do cancelamento" : "Observações"}
                    </p>
                    <p className={`text-sm ${selecionada.status === "cancelada" ? "text-red-700 dark:text-red-400 font-medium" : "text-gray-700 dark:text-gray-200"}`}>
                      {selecionada.observacoes}
                    </p>
                  </div>
                )}
              </section>

              {/* Ações — somente reservas pendentes */}
              {selecionada.status === "pendente" && (
                <section className="border-t border-gray-100 dark:border-gray-700 pt-5">
                  {!recusando ? (
                    <div className="flex gap-3">
                      <button
                        onClick={aprovar}
                        disabled={processando}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm bg-emerald-500 hover:bg-emerald-600 shadow-md transition disabled:opacity-60"
                      >
                        <Check className="w-4 h-4" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => setRecusando(true)}
                        disabled={processando}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm bg-red-500 hover:bg-red-600 shadow-md transition disabled:opacity-60"
                      >
                        <XCircle className="w-4 h-4" />
                        Recusar
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                          Motivo da recusa <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                          Este motivo será enviado por e-mail ao morador.
                        </p>
                        <textarea
                          rows={3}
                          autoFocus
                          value={motivoRecusa}
                          onChange={(e) => setMotivoRecusa(e.target.value)}
                          placeholder="Ex: Data já reservada para outro evento..."
                          className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 resize-none transition"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setRecusando(false); setMotivoRecusa(""); }}
                          className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          Voltar
                        </button>
                        <button
                          onClick={recusar}
                          disabled={processando || !motivoRecusa.trim()}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm bg-red-500 hover:bg-red-600 shadow-md transition disabled:opacity-60"
                        >
                          <XCircle className="w-4 h-4" />
                          Confirmar Recusa
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
