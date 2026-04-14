import { useEffect, useState } from "react";
import { supabase } from "../supabase.js";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";
import Button from "../components/Button";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        const { data, error } = await supabase
          .from("usuarios")
          .select("*")
          .order("data_cadastro", { ascending: false });

        if (error) throw error;
        setUsuarios(data || []);
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        Swal.fire("Erro", "Não foi possível carregar os usuários.", "error");
      } finally {
        setLoading(false);
      }
    };

    carregarUsuarios();
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

      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ativo: true } : u))
      );

      Swal.fire("Aprovado!", `${email} agora tem acesso ao sistema.`, "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Erro", "Não foi possível aprovar o usuário.", "error");
    }
  };

  const excluirUsuario = async (id, email) => {
    const confirma = await Swal.fire({
      title: "Excluir usuário?",
      html: `
        <p>Tem certeza que deseja excluir o usuário:</p>
        <b>${email}</b>
        <p class="text-gray-600 text-sm mt-2">
          Essa ação remove o registro do banco de dados.<br/>
          O usuário permanecerá no Auth do Supabase e deve ser excluído manualmente.
        </p>
      `,
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

      Swal.fire({
        title: "Excluído!",
        text: "Usuário removido do banco de dados com sucesso.",
        icon: "success",
        confirmButtonColor: "#4f46e5",
      });
    } catch (error) {
      console.error(error);
      Swal.fire(
        "Erro",
        "Não foi possível excluir o usuário do banco de dados.",
        "error"
      );
    }
  };

  const usuariosFiltrados = usuarios.filter((u) =>
    [u.nome, u.email, u.cpf, u.bloco, u.apartamento]
      .join(" ")
      .toLowerCase()
      .includes(busca.toLowerCase())
  );

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600 dark:text-gray-300 bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        Carregando usuários...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar mostrarVoltar={true} />

      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 sm:p-8 mt-20">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
          Gerenciar Usuários<span className="text-indigo-500">.</span>
        </h1>

        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-3">
          <input
            type="text"
            placeholder="Buscar usuário..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full md:w-1/2 p-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-200 outline-none text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Tabela Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse text-sm text-gray-700 dark:text-gray-200">
            <thead>
              <tr className="bg-indigo-100 dark:bg-indigo-900/50 text-gray-700 dark:text-gray-200">
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">E-mail</th>
                <th className="p-3 text-left">CPF</th>
                <th className="p-3 text-left">Bloco</th>
                <th className="p-3 text-left">Apartamento</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Tipo</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length > 0 ? (
                usuariosFiltrados.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition whitespace-nowrap"
                  >
                    <td className="p-3">{u.nome || "-"}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.cpf || "-"}</td>
                    <td className="p-3">{u.bloco || "-"}</td>
                    <td className="p-3">{u.apartamento || "-"}</td>
                    <td className="p-3 text-center">
                      {u.ativo ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">Ativo</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-medium">Pendente</span>
                      )}
                    </td>
                    <td className="p-3 text-center capitalize">
                      {u.role || "morador"}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center items-center gap-2">
                        {!u.ativo && (
                          <Button
                            onClick={() => aprovarUsuario(u.id, u.email)}
                            variant="secondary"
                          >
                            Aprovar
                          </Button>
                        )}
                        <Button
                          onClick={() => excluirUsuario(u.id, u.email)}
                          variant="danger"
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-6 text-gray-500 dark:text-gray-400 font-medium"
                  >
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {usuariosFiltrados.length > 0 ? (
            usuariosFiltrados.map((u) => (
              <div
                key={u.id}
                className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-md border border-white/30 dark:border-gray-600/30 shadow-md rounded-xl p-4"
              >
                <p className="text-gray-800 dark:text-gray-100 font-semibold text-sm break-all">
                  {u.nome || "-"}
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-xs">{u.email}</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">CPF: {u.cpf || "-"}</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Bloco: {u.bloco || "-"} | Apt: {u.apartamento || "-"}
                </p>
                <p className="text-gray-700 dark:text-gray-200 text-sm mt-1">
                  Status:{" "}
                  {u.ativo ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">Ativo</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 font-medium">Pendente</span>
                  )}
                </p>
                <div className="flex gap-2 mt-3">
                  {!u.ativo && (
                    <Button
                      onClick={() => aprovarUsuario(u.id, u.email)}
                      variant="secondary"
                      fullWidth
                    >
                      Aprovar
                    </Button>
                  )}
                  <Button
                    onClick={() => excluirUsuario(u.id, u.email)}
                    variant="danger"
                    fullWidth
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 font-medium">
              Nenhum usuário encontrado.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
