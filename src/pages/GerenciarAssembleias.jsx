import { useEffect, useState } from "react";
import { supabase } from "../supabase.js";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";
import Button from "../components/Button";

export default function GerenciarAssembleias() {
  const [assembleias, setAssembleias] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarAssembleias = async () => {
    try {
      const { data, error } = await supabase
        .from("assembleias")
        .select("*")
        .order("criado_em", { ascending: false });

      if (error) throw error;
      setAssembleias(data || []);
    } catch (error) {
      console.error("Erro ao carregar assembleias:", error);
      Swal.fire("Erro", "Não foi possível carregar as assembleias.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAssembleias();
  }, []);

  const excluirAssembleia = async (id, titulo) => {
    const confirma = await Swal.fire({
      title: "Excluir assembleia?",
      html: `
        <p>Tem certeza que deseja excluir a assembleia:</p>
        <b>${titulo}</b>
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
      const { error } = await supabase.from("assembleias").delete().eq("id", id);
      if (error) throw error;

      setAssembleias((prev) => prev.filter((a) => a.id !== id));

      Swal.fire({
        title: "Excluída!",
        text: "A assembleia foi removida com sucesso.",
        icon: "success",
        confirmButtonColor: "#4f46e5",
      });
    } catch (error) {
      console.error(error);
      Swal.fire("Erro", "Não foi possível excluir a assembleia.", "error");
    }
  };

  const alternarStatus = async (id, titulo, ativa) => {
    const novoStatus = !ativa;

    const confirma = await Swal.fire({
      title: `${novoStatus ? "Ativar" : "Inativar"} assembleia?`,
      text: `Deseja ${novoStatus ? "ativar" : "inativar"} a assembleia "${titulo}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
    });

    if (!confirma.isConfirmed) return;

    try {
      const { error } = await supabase
        .from("assembleias")
        .update({ ativa: novoStatus })
        .eq("id", id);

      if (error) throw error;

      setAssembleias((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ativa: novoStatus } : a))
      );

      Swal.fire(
        "Atualizado!",
        `A assembleia foi ${novoStatus ? "ativada" : "inativada"} com sucesso.`,
        "success"
      );
    } catch (error) {
      console.error(error);
      Swal.fire("Erro", "Não foi possível alterar o status.", "error");
    }
  };

  const verParticipacao = async (assembleiaId) => {
    try {
      // 🔹 Busca quem votou (agrupando bloco/apartamento)
      const { data: votos, error: votosError } = await supabase
        .from("votos")
        .select("bloco, apartamento")
        .eq("id_assembleia", assembleiaId);

      if (votosError) throw votosError;

      const votaram = new Set(
        votos.map((v) => `${v.bloco}-${v.apartamento}`)
      );

      // 🔹 Busca todos usuários ativos
      const { data: usuarios, error: usuariosError } = await supabase
        .from("usuarios")
        .select("bloco, apartamento")
        .eq("ativo", true);

      if (usuariosError) throw usuariosError;

      const todos = new Set(
        usuarios.map((u) => `${u.bloco}-${u.apartamento}`)
      );

      // 🔹 Calcula faltantes
      const faltando = [...todos].filter((b) => !votaram.has(b));

      // 🔹 Exibe resultado
      const formatarLista = (lista, cor) =>
        lista.length > 0
          ? lista.map((item) => `<li style="color:${cor}; font-weight:500">${item.replace("-", " Ap ")}</li>`).join("")
          : `<li style="color:gray">Nenhum</li>`;

      Swal.fire({
        title: "📊 Participação na Assembleia",
        html: `
          <div style="text-align:left">
            <p><b style="color:#16a34a">🟩 Votaram:</b></p>
            <ul>${formatarLista([...votaram], "#16a34a")}</ul>
            <hr style="margin:10px 0"/>
            <p><b style="color:#dc2626">🟥 Faltando votar:</b></p>
            <ul>${formatarLista(faltando, "#dc2626")}</ul>
          </div>
        `,
        width: 500,
        confirmButtonColor: "#4f46e5",
      });
    } catch (error) {
      console.error(error);
      Swal.fire("Erro", "Não foi possível carregar a participação.", "error");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Carregando assembleias...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar mostrarVoltar={true} />

      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-2xl p-6 sm:p-8 mt-20">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
          Gerenciar Assembleias<span className="text-indigo-500">.</span>
        </h1>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse text-sm text-gray-700">
            <thead>
              <tr className="bg-indigo-100 text-gray-700">
                <th className="p-3 text-left">Título</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Data</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {assembleias.length > 0 ? (
                assembleias.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b hover:bg-indigo-50 transition"
                  >
                    <td className="p-3">{a.titulo}</td>
                    <td className="p-3 text-center">
                      {a.ativa ? (
                        <span className="text-green-600 font-medium">Ativa</span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          Inativa
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {new Date(a.criado_em).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-3 text-center space-x-2">
                      <Button
                        onClick={() =>
                          alternarStatus(a.id, a.titulo, a.ativa)
                        }
                        variant="secondary"
                      >
                        {a.ativa ? "Inativar" : "Ativar"}
                      </Button>
                      <Button
                        onClick={() => verParticipacao(a.id)}
                        variant="secondary"
                      >
                        Ver Participação
                      </Button>
                      <Button
                        onClick={() => excluirAssembleia(a.id, a.titulo)}
                        variant="danger"
                      >
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-6 text-gray-500 font-medium"
                  >
                    Nenhuma assembleia encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {assembleias.length > 0 ? (
            assembleias.map((a) => (
              <div
                key={a.id}
                className="bg-white/70 backdrop-blur-md border border-white/30 shadow-md rounded-xl p-4"
              >
                <p className="text-gray-800 font-semibold text-sm break-all">
                  {a.titulo}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  Status:{" "}
                  {a.ativa ? (
                    <span className="text-green-600 font-medium">Ativa</span>
                  ) : (
                    <span className="text-red-600 font-medium">Inativa</span>
                  )}
                </p>
                <p className="text-gray-600 text-sm">
                  Data: {new Date(a.criado_em).toLocaleDateString("pt-BR")}
                </p>

                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <Button
                    onClick={() =>
                      alternarStatus(a.id, a.titulo, a.ativa)
                    }
                    variant="secondary"
                    fullWidth
                  >
                    {a.ativa ? "Inativar" : "Ativar"}
                  </Button>
                  <Button
                    onClick={() => verParticipacao(a.id)}
                    variant="secondary"
                    fullWidth
                  >
                    Ver Participação
                  </Button>
                  <Button
                    onClick={() => excluirAssembleia(a.id, a.titulo)}
                    variant="danger"
                    fullWidth
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 font-medium">
              Nenhuma assembleia encontrada.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
