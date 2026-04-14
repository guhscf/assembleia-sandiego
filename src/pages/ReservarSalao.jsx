import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const TIPOS_EVENTO = [
  "Aniversário", "Casamento", "Formatura", "Reunião",
  "Confraternização", "Corporativo", "Outro",
];

const inputClass =
  "w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white/70 dark:bg-gray-700/70 transition";
const labelClass = "block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1";

export default function ReservarSalao() {
  const [mes, setMes] = useState(new Date().getMonth());
  const [ano, setAno] = useState(new Date().getFullYear());
  const [datasOcupadas, setDatasOcupadas] = useState(new Set());
  const [carregandoCal, setCarregandoCal] = useState(true);
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState({
    cliente_nome: "",
    cliente_email: "",
    cliente_telefone: "",
    cliente_cpf_cnpj: "",
    tipo_evento: "",
    descricao_evento: "",
    num_convidados: "",
    horario_inicio: "",
    horario_fim: "",
    data_montagem: "",
    observacoes: "",
  });

  useEffect(() => {
    buscarDatasOcupadas();
    preencherDadosUsuario();
  }, []);

  const preencherDadosUsuario = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("usuarios")
      .select("nome")
      .eq("id", user.id)
      .single();
    setForm((f) => ({
      ...f,
      cliente_nome: data?.nome || "",
      cliente_email: user.email || "",
    }));
  };

  const buscarDatasOcupadas = async () => {
    setCarregandoCal(true);
    const { data, error } = await supabase
      .from("reservas_calendario")
      .select("data_evento, data_montagem, status");

    if (!error && data) {
      const ocupadas = new Set();
      data.forEach((r) => {
        if (r.data_evento) ocupadas.add(r.data_evento);
        if (r.data_montagem) ocupadas.add(r.data_montagem);
      });
      setDatasOcupadas(ocupadas);
    }
    setCarregandoCal(false);
  };

  const navegarMes = (dir) => {
    if (dir === -1 && mes === 0) { setMes(11); setAno(ano - 1); }
    else if (dir === 1 && mes === 11) { setMes(0); setAno(ano + 1); }
    else setMes(mes + dir);
  };

  const formatarDataStr = (a, m, d) =>
    `${a}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const hojeStr = new Date().toISOString().split("T")[0];

  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const primeiroDia = new Date(ano, mes, 1).getDay();

  const celulas = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];

  const classeDia = (passada, ocupada, selecionada, hoje) => {
    if (selecionada)
      return "bg-indigo-500 text-white shadow-md scale-105 hover:bg-indigo-500";
    if (ocupada)
      return "bg-red-100 dark:bg-red-900/30 text-red-400 dark:text-red-500 line-through cursor-not-allowed hover:bg-red-100 dark:hover:bg-red-900/30";
    if (passada)
      return "text-gray-300 dark:text-gray-600 cursor-not-allowed";
    if (hoje)
      return "ring-2 ring-indigo-400 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30";
    return "text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.horario_fim <= form.horario_inicio) {
      Swal.fire("Atenção", "O horário de término deve ser após o horário de início.", "warning");
      return;
    }

    setEnviando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const codigoReserva = `RES-${Date.now().toString(36).toUpperCase()}`;

      const { error } = await supabase.from("reservas").insert({
        codigo_reserva: codigoReserva,
        user_id: user.id,
        data_evento: dataSelecionada,
        cliente_nome: form.cliente_nome,
        cliente_email: form.cliente_email,
        cliente_telefone: form.cliente_telefone,
        cliente_cpf_cnpj: form.cliente_cpf_cnpj || null,
        tipo_evento: form.tipo_evento,
        descricao_evento: form.descricao_evento || null,
        num_convidados: parseInt(form.num_convidados),
        horario_inicio: form.horario_inicio,
        horario_fim: form.horario_fim,
        data_montagem: form.data_montagem || null,
        observacoes: form.observacoes || null,
        status: "pendente",
      });

      if (error) throw error;

      // Notifica todos os admins por email
      try {
        const { data: admins } = await supabase
          .from("usuarios")
          .select("email")
          .eq("role", "admin")
          .eq("ativo", true);

        for (const admin of admins || []) {
          await supabase.functions.invoke("enviar-email", {
            body: {
              para: admin.email,
              assunto: `📅 Nova reserva solicitada — ${codigoReserva}`,
              corpo:
                `Uma nova solicitação de reserva foi recebida.\n\n` +
                `📋 Código: ${codigoReserva}\n` +
                `👤 Cliente: ${form.cliente_nome}\n` +
                `📅 Data do evento: ${new Date(dataSelecionada + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}\n` +
                `🎉 Tipo: ${form.tipo_evento}\n` +
                `👥 Convidados: ${form.num_convidados}\n` +
                `🕐 Horário: ${form.horario_inicio} às ${form.horario_fim}\n\n` +
                `Acesse o painel administrativo para aprovar ou cancelar.`,
            },
          });
        }
      } catch (emailErr) {
        console.warn("Email ao admin não enviado:", emailErr);
      }

      await Swal.fire({
        title: "Reserva enviada!",
        html: `Solicitação registrada com o código<br/><strong style="color:#6366f1;font-size:1.1rem">${codigoReserva}</strong><br/><span style="color:#6b7280;font-size:0.85rem">Aguarde a confirmação da administração.</span>`,
        icon: "success",
        confirmButtonColor: "#6366f1",
      });

      setDataSelecionada(null);
      setForm((f) => ({
        ...f,
        tipo_evento: "", descricao_evento: "", num_convidados: "",
        horario_inicio: "", horario_fim: "", data_montagem: "", observacoes: "",
        cliente_telefone: "", cliente_cpf_cnpj: "",
      }));
      buscarDatasOcupadas();
    } catch (err) {
      console.error(err);
      Swal.fire("Erro", "Não foi possível enviar a reserva. Tente novamente.", "error");
    } finally {
      setEnviando(false);
    }
  };

  const dataFormatada = dataSelecionada
    ? new Date(dataSelecionada + "T12:00:00").toLocaleDateString("pt-BR", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen">
      <Navbar mostrarVoltar={true} />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div className="mt-8 mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">
            Reservar Salão<span className="text-indigo-500">.</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
            Selecione uma data disponível e preencha os dados do evento.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ── Calendário ── */}
          <div className="w-full lg:w-auto lg:min-w-[340px] bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-md p-5 sm:p-6">
            {/* Navegação de mês */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => navegarMes(-1)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
                {MESES[mes]} {ano}
              </h2>
              <button
                onClick={() => navegarMes(1)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Cabeçalho dias da semana */}
            <div className="grid grid-cols-7 mb-1">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid de dias */}
            {carregandoCal ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {celulas.map((dia, idx) => {
                  if (!dia) return <div key={`v-${idx}`} />;
                  const dataStr = formatarDataStr(ano, mes, dia);
                  const passada = dataStr < hojeStr;
                  const ocupada = datasOcupadas.has(dataStr);
                  const selecionada = dataStr === dataSelecionada;
                  const hoje = dataStr === hojeStr;

                  return (
                    <button
                      key={dataStr}
                      disabled={passada || ocupada}
                      onClick={() => setDataSelecionada(dataStr)}
                      title={ocupada ? "Data indisponível" : undefined}
                      className={`
                        aspect-square flex items-center justify-center
                        rounded-xl text-sm font-medium transition-all duration-150
                        ${classeDia(passada, ocupada, selecionada, hoje)}
                      `}
                    >
                      {dia}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Legenda */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                Selecionada
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-200 dark:bg-red-800 inline-block" />
                Indisponível
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-indigo-400 inline-block" />
                Hoje
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-600 inline-block" />
                Passada
              </span>
            </div>
          </div>

          {/* ── Formulário ── */}
          {dataSelecionada ? (
            <div className="flex-1 w-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-md p-5 sm:p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-0.5">
                Dados da reserva
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 capitalize">
                📅 {dataFormatada}
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Nome */}
                <div>
                  <label className={labelClass}>Nome completo *</label>
                  <input
                    type="text" required
                    value={form.cliente_nome}
                    onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })}
                    placeholder="Seu nome completo"
                    className={inputClass}
                  />
                </div>

                {/* Email + Telefone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>E-mail *</label>
                    <input
                      type="email" required
                      value={form.cliente_email}
                      onChange={(e) => setForm({ ...form, cliente_email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Telefone *</label>
                    <input
                      type="tel" required
                      value={form.cliente_telefone}
                      onChange={(e) => setForm({ ...form, cliente_telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* CPF/CNPJ */}
                <div>
                  <label className={labelClass}>CPF / CNPJ</label>
                  <input
                    type="text"
                    value={form.cliente_cpf_cnpj}
                    onChange={(e) => setForm({ ...form, cliente_cpf_cnpj: e.target.value })}
                    placeholder="000.000.000-00"
                    className={inputClass}
                  />
                </div>

                {/* Tipo de evento + Nº convidados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Tipo de evento *</label>
                    <select
                      required
                      value={form.tipo_evento}
                      onChange={(e) => setForm({ ...form, tipo_evento: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">Selecione...</option>
                      {TIPOS_EVENTO.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Nº de convidados *</label>
                    <input
                      type="number" required min="1"
                      value={form.num_convidados}
                      onChange={(e) => setForm({ ...form, num_convidados: e.target.value })}
                      placeholder="Ex: 80"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Horário início + fim */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Horário de início *</label>
                    <input
                      type="time" required
                      value={form.horario_inicio}
                      onChange={(e) => setForm({ ...form, horario_inicio: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Horário de término *</label>
                    <input
                      type="time" required
                      value={form.horario_fim}
                      onChange={(e) => setForm({ ...form, horario_fim: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Data de montagem */}
                <div>
                  <label className={labelClass}>Data de montagem (opcional)</label>
                  <input
                    type="date"
                    value={form.data_montagem}
                    max={dataSelecionada}
                    onChange={(e) => setForm({ ...form, data_montagem: e.target.value })}
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Dia anterior ao evento para montagem/decoração.
                  </p>
                </div>

                {/* Descrição */}
                <div>
                  <label className={labelClass}>Descrição do evento</label>
                  <textarea
                    rows={2} value={form.descricao_evento}
                    onChange={(e) => setForm({ ...form, descricao_evento: e.target.value })}
                    placeholder="Descreva brevemente o evento..."
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {/* Observações */}
                <div>
                  <label className={labelClass}>Observações</label>
                  <textarea
                    rows={2} value={form.observacoes}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                    placeholder="Alguma observação adicional?"
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="flex gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setDataSelecionada(null)}
                    className="px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviando}
                    className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm shadow-md transition-all hover:scale-[1.02] ${
                      enviando
                        ? "bg-indigo-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-sky-500 to-indigo-500 hover:opacity-90"
                    }`}
                  >
                    {enviando ? "Enviando..." : "Solicitar Reserva"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Placeholder desktop quando nenhuma data selecionada */
            <div className="hidden lg:flex flex-1 items-center justify-center bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-700 p-10">
              <div className="text-center text-gray-400 dark:text-gray-500">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 text-indigo-200 dark:text-indigo-700" />
                <p className="font-medium text-gray-500 dark:text-gray-400">Selecione uma data</p>
                <p className="text-sm mt-1">O formulário aparecerá aqui.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
