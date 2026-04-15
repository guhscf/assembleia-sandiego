import { useEffect, useState } from "react";
import { supabase } from "../supabase.js";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";
import {
  Search,
  UserCheck,
  Trash2,
  Pencil,
  X,
  Check,
  Users,
  AlertCircle,
  Clock,
} from "lucide-react";

function Initials({ nome }) {
  const parts = (nome || "?").trim().split(" ").filter(Boolean);
  const letters =
    parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0]?.slice(0, 2) ?? "?";
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-sky-500 flex items-center justify-center text-white font-bold text-sm select-none flex-shrink-0">
      {letters.toUpperCase()}
    </div>
  );
}

function Badge({ ativo, inadimplente }) {
  if (inadimplente) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
        Inadimplente
      </span>
    );
  }
  return ativo ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
      Ativo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
      Pendente
    </span>
  );
}

function RoleBadge({ role }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        isAdmin
          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
      }`}
    >
      {isAdmin ? "Admin" : "Morador"}
    </span>
  );
}

function EditModal({ usuario, onClose, onSave }) {
  const [form, setForm] = useState({
    nome: usuario.nome || "",
    email: usuario.email || "",
    cpf: usuario.cpf || "",
    bloco: usuario.bloco || "",
    apartamento: usuario.apartamento || "",
    role: usuario.role || "morador",
    ativo: usuario.ativo ?? false,
    inadimplente: usuario.inadimplente ?? false,
  });
  const [salvando, setSalvando] = useState(false);

  const handleSave = async () => {
    setSalvando(true);
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          nome: form.nome.trim(),
          cpf: form.cpf.trim(),
          bloco: form.bloco.trim(),
          apartamento: form.apartamento.trim(),
          role: form.role,
          ativo: form.ativo,
          inadimplente: form.inadimplente,
        })
        .eq("id", usuario.id);

      if (error) throw error;
      onSave({ ...usuario, ...form });
    } catch {
      Swal.fire("Erro", "Não foi possível salvar as alterações.", "error");
    } finally {
      setSalvando(false);
    }
  };

  const field = (label, key, type = "text", options = null) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </label>
      {options ? (
        <select
          value={form[key]}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              [key]: (key === "ativo" || key === "inadimplente") ? e.target.value === "true" : e.target.value,
            }))
          }
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Initials nome={form.nome} />
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                {form.nome || "Sem nome"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{usuario.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-2">{field("Nome completo", "nome")}</div>
          {field("CPF", "cpf")}
          {field("Bloco", "bloco")}
          {field("Apartamento", "apartamento")}
          {field("Tipo de conta", "role", "text", [
            { value: "morador", label: "Morador" },
            { value: "admin", label: "Administrador" },
          ])}
          {field("Status", "ativo", "text", [
            { value: "true", label: "Ativo" },
            { value: "false", label: "Pendente" },
          ])}
          {field("Inadimplente", "inadimplente", "text", [
            { value: "false", label: "Não" },
            { value: "true", label: "Sim" },
          ])}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={salvando}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [editando, setEditando] = useState(null);
  const [visiveis, setVisiveis] = useState(10);

  useEffect(() => {
    const carregar = async () => {
      try {
        const { data, error } = await supabase
          .from("usuarios")
          .select("*")
          .order("data_cadastro", { ascending: false });
        if (error) throw error;
        setUsuarios(data || []);
      } catch {
        Swal.fire("Erro", "Não foi possível carregar os usuários.", "error");
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  const aprovarUsuario = async (id, email) => {
    const confirma = await Swal.fire({
      title: "Aprovar usuário?",
      text: `Deseja liberar o acesso para ${email}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sim, aprovar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#6b7280",
    });
    if (!confirma.isConfirmed) return;

    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ ativo: true })
        .eq("id", id);
      if (error) throw error;
      setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, ativo: true } : u)));
      Swal.fire("Aprovado!", `${email} agora tem acesso ao sistema.`, "success");
    } catch {
      Swal.fire("Erro", "Não foi possível aprovar o usuário.", "error");
    }
  };

  const excluirUsuario = async (id, email) => {
    const confirma = await Swal.fire({
      title: "Excluir usuário?",
      html: `<p>Tem certeza que deseja excluir:</p><b>${email}</b><p class="text-gray-500 text-sm mt-2">O usuário deve ser removido manualmente do Auth do Supabase.</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",
    });
    if (!confirma.isConfirmed) return;

    try {
      const { error } = await supabase.from("usuarios").delete().eq("id", id);
      if (error) throw error;
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      Swal.fire("Excluído!", "Usuário removido com sucesso.", "success");
    } catch {
      Swal.fire("Erro", "Não foi possível excluir o usuário.", "error");
    }
  };

  const handleSaveEdit = (atualizado) => {
    setUsuarios((prev) => prev.map((u) => (u.id === atualizado.id ? atualizado : u)));
    setEditando(null);
    Swal.fire({
      title: "Salvo!",
      text: "Perfil atualizado com sucesso.",
      icon: "success",
      timer: 1800,
      showConfirmButton: false,
    });
  };

  useEffect(() => {
    setVisiveis(10);
  }, [busca, filtroStatus]);

  const usuariosFiltrados = usuarios
    .filter((u) => {
      if (filtroStatus === "ativos") return u.ativo && !u.inadimplente;
      if (filtroStatus === "pendentes") return !u.ativo && !u.inadimplente;
      if (filtroStatus === "inadimplentes") return u.inadimplente;
      return true;
    })
    .filter((u) =>
      [u.nome, u.email, u.cpf, u.bloco, u.apartamento]
        .join(" ")
        .toLowerCase()
        .includes(busca.toLowerCase())
    );

  const total = usuarios.length;
  const ativos = usuarios.filter((u) => u.ativo && !u.inadimplente).length;
  const pendentes = usuarios.filter((u) => !u.ativo && !u.inadimplente).length;
  const inadimplentes = usuarios.filter((u) => u.inadimplente).length;

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600 dark:text-gray-300 bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        Carregando usuários...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar mostrarVoltar={true} />

      {editando && (
        <EditModal
          usuario={editando}
          onClose={() => setEditando(null)}
          onSave={handleSaveEdit}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-10">
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
            Gerenciar Usuários<span className="text-indigo-500">.</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Gerencie os moradores e administradores do condomínio
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Users, label: "Total", value: total, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/30" },
            { icon: UserCheck, label: "Ativos", value: ativos, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
            { icon: Clock, label: "Pendentes", value: pendentes, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/30" },
            { icon: AlertCircle, label: "Inadimplentes", value: inadimplentes, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/30" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div
              key={label}
              className={`${bg} rounded-2xl p-4 flex items-center gap-3 border border-white/30 dark:border-gray-700/30`}
            >
              <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
              <div>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, CPF, bloco..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:ring-2 focus:ring-indigo-300 outline-none shadow-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "todos", label: "Todos" },
              { key: "ativos", label: "Ativos" },
              { key: "pendentes", label: "Pendentes" },
              { key: "inadimplentes", label: "Inadimplentes" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFiltroStatus(key)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                  filtroStatus === key
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : "bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        {usuariosFiltrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    <th className="px-5 py-3.5 text-left">Usuário</th>
                    <th className="px-5 py-3.5 text-left">Localização</th>
                    <th className="px-5 py-3.5 text-left">CPF</th>
                    <th className="px-5 py-3.5 text-center">Tipo</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.slice(0, visiveis).map((u, i) => (
                    <tr
                      key={u.id}
                      className={`transition hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20 ${
                        i !== usuariosFiltrados.length - 1
                          ? "border-b border-gray-100 dark:border-gray-700/60"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Initials nome={u.nome} />
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">
                              {u.nome || "—"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                        {u.bloco || u.apartamento
                          ? `Bl. ${u.bloco || "—"} / Apt. ${u.apartamento || "—"}`
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                        {u.cpf || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Badge ativo={u.ativo} inadimplente={u.inadimplente} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {!u.ativo && (
                            <button
                              onClick={() => aprovarUsuario(u.id, u.email)}
                              title="Aprovar"
                              className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setEditando(u)}
                            title="Editar perfil"
                            className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => excluirUsuario(u.id, u.email)}
                            title="Excluir"
                            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {usuariosFiltrados.slice(0, visiveis).map((u) => (
                <div
                  key={u.id}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-sm p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Initials nome={u.nome} />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                          {u.nome || "Sem nome"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Badge ativo={u.ativo} inadimplente={u.inadimplente} />
                      <RoleBadge role={u.role} />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>Bloco: <span className="text-gray-700 dark:text-gray-200 font-medium">{u.bloco || "—"}</span></span>
                    <span>Apto: <span className="text-gray-700 dark:text-gray-200 font-medium">{u.apartamento || "—"}</span></span>
                    <span className="col-span-2">CPF: <span className="text-gray-700 dark:text-gray-200 font-medium">{u.cpf || "—"}</span></span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {!u.ativo && (
                      <button
                        onClick={() => aprovarUsuario(u.id, u.email)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 transition"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Aprovar
                      </button>
                    )}
                    <button
                      onClick={() => setEditando(u)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => excluirUsuario(u.id, u.email)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Rodapé */}
        {usuariosFiltrados.length > 0 && (
          <div className="mt-6 flex flex-col items-center gap-2">
            {visiveis < usuariosFiltrados.length && (
              <button
                onClick={() => setVisiveis((v) => v + 10)}
                className="px-6 py-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition shadow-sm"
              >
                Exibir mais ({usuariosFiltrados.length - visiveis} restante{usuariosFiltrados.length - visiveis !== 1 ? "s" : ""})
              </button>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Exibindo {Math.min(visiveis, usuariosFiltrados.length)} de {usuariosFiltrados.length} usuário{usuariosFiltrados.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
