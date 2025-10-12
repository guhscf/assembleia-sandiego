import { useEffect, useState } from "react";
import { supabase } from "../supabase.js";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";
import Button from "../components/Button";

export default function Votacao() {
  const [assembleiaAtiva, setAssembleiaAtiva] = useState(null);
  const [opcoes, setOpcoes] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [votoSelecionado, setVotoSelecionado] = useState("");
  const [loading, setLoading] = useState(true);

  const carregarUsuario = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      const { data: userData } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", auth.user.id)
        .single();

      setUsuario(userData);
    }
  };

  const carregarAssembleiaAtiva = async () => {
    const { data, error } = await supabase
      .from("assembleias")
      .select("*")
      .eq("ativa", true)
      .order("criado_em", { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      setAssembleiaAtiva(data);
      setOpcoes(data.opcoes || []);
    }
  };

  useEffect(() => {
    Promise.all([carregarUsuario(), carregarAssembleiaAtiva()]).then(() =>
      setLoading(false)
    );
  }, []);

  const enviarVoto = async (e) => {
    e.preventDefault();

    if (!votoSelecionado) {
      Swal.fire("Atenção", "Selecione uma opção antes de confirmar.", "warning");
      return;
    }

    if (!usuario || !assembleiaAtiva) {
      Swal.fire("Erro", "Não foi possível validar seu usuário.", "error");
      return;
    }

    try {
      setLoading(true);

      // 🔒 Verifica se já existe voto do mesmo bloco/apto
      const { data: jaVotou } = await supabase
        .from("votos")
        .select("id")
        .eq("id_assembleia", assembleiaAtiva.id)
        .eq("bloco", usuario.bloco)
        .eq("apartamento", usuario.apartamento);

      if (jaVotou && jaVotou.length > 0) {
        Swal.fire(
          "Atenção",
          "Este apartamento já registrou um voto nesta assembleia.",
          "info"
        );
        setLoading(false);
        return;
      }

      // 🗳️ Insere o voto (com nome)
      const { error: insertError } = await supabase.from("votos").insert({
        id_assembleia: assembleiaAtiva.id,
        id_usuario: usuario.id,
        nome: usuario.nome, // 👈 novo campo adicionado
        bloco: usuario.bloco,
        apartamento: usuario.apartamento,
        cpf: usuario.cpf,
        voto: votoSelecionado,
        data_voto: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      Swal.fire({
        title: "Voto registrado!",
        text: "Seu voto foi computado com sucesso.",
        icon: "success",
        confirmButtonColor: "#4f46e5",
      });

      setVotoSelecionado("");
    } catch (error) {
      console.error(error);
      Swal.fire("Erro", "Não foi possível registrar o voto.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Carregando votação...
      </div>
    );

  if (!assembleiaAtiva)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 flex flex-col items-center justify-center text-gray-700">
        <Navbar mostrarVoltar={true} />
        <div className="text-center mt-10">
          <h2 className="text-2xl font-semibold">Nenhuma assembleia ativa.</h2>
          <p className="mt-2 text-gray-600">
            Aguarde até que uma nova assembleia seja ativada.
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100">
      <Navbar mostrarVoltar={true} />

      <div className="flex justify-center items-start pt-24 px-4">
        <div className="w-full max-w-2xl bg-white/40 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-lg border border-white/30">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 text-center">
            {assembleiaAtiva.titulo}
            <span className="text-indigo-500">.</span>
          </h1>

          <p className="text-center text-gray-600 mb-2 text-sm sm:text-base">
            Data da Assembleia:{" "}
            <b>
              {new Date(assembleiaAtiva.criado_em).toLocaleDateString("pt-BR")}
            </b>
          </p>

          <p className="text-center text-gray-600 mb-6 text-sm sm:text-base">
            {assembleiaAtiva.descricao || "Selecione uma opção para votar."}
          </p>

          <form onSubmit={enviarVoto} className="flex flex-col gap-5">
            {opcoes.length > 0 ? (
              opcoes.map((opcao, index) => (
                <label
                  key={index}
                  className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer transition ${
                    votoSelecionado === opcao
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-300 hover:border-indigo-300"
                  }`}
                >
                  <span className="text-gray-800 text-sm sm:text-base">
                    {opcao}
                  </span>
                  <input
                    type="radio"
                    name="voto"
                    value={opcao}
                    checked={votoSelecionado === opcao}
                    onChange={(e) => setVotoSelecionado(e.target.value)}
                    className="text-indigo-500 focus:ring-indigo-400"
                  />
                </label>
              ))
            ) : (
              <p className="text-center text-gray-500">
                Nenhuma opção disponível.
              </p>
            )}

            <Button type="submit" disabled={loading} fullWidth className="mt-4">
              {loading ? "Enviando..." : "Confirmar Voto"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
