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

      const { error: insertError } = await supabase.from("votos").insert({
        id_assembleia: assembleiaAtiva.id,
        id_usuario: usuario.id,
        nome: usuario.nome,
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
      <div className="flex justify-center items-center min-h-screen text-gray-600 dark:text-gray-300 bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        Carregando votação...
      </div>
    );

  if (usuario?.inadimplente)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center px-4">
        <Navbar mostrarVoltar={true} />
        <div className="w-full max-w-md bg-white/40 dark:bg-gray-800/50 backdrop-blur-md rounded-3xl shadow-lg border border-white/30 dark:border-gray-700/30 p-8 text-center mt-10">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Participação bloqueada
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            Existem <span className="font-semibold text-red-500">pendências financeiras</span> associadas à sua unidade.
            <br /><br />
            Regularize sua situação junto à administração do condomínio para poder participar das assembleias.
          </p>
        </div>
      </div>
    );

  if (!assembleiaAtiva)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center text-gray-700 dark:text-gray-200">
        <Navbar mostrarVoltar={true} />
        <div className="text-center mt-10">
          <h2 className="text-2xl font-semibold">Nenhuma assembleia ativa.</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Aguarde até que uma nova assembleia seja ativada.
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar mostrarVoltar={true} />

      <div className="flex justify-center items-start pt-24 px-4">
        <div className="w-full max-w-2xl bg-white/40 dark:bg-gray-800/50 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-lg border border-white/30 dark:border-gray-700/30">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">
            {assembleiaAtiva.titulo}
            <span className="text-indigo-500">.</span>
          </h1>

          <p className="text-center text-gray-600 dark:text-gray-300 mb-2 text-sm sm:text-base">
            Data da Assembleia:{" "}
            <b>
              {new Date(assembleiaAtiva.criado_em).toLocaleDateString("pt-BR")}
            </b>
          </p>

          <p className="text-center text-gray-600 dark:text-gray-300 mb-6 text-sm sm:text-base">
            {assembleiaAtiva.descricao || "Selecione uma opção para votar."}
          </p>

          <form onSubmit={enviarVoto} className="flex flex-col gap-5">
            {opcoes.length > 0 ? (
              opcoes.map((opcao, index) => (
                <label
                  key={index}
                  className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer transition ${
                    votoSelecionado === opcao
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                      : "border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 dark:bg-gray-700/30"
                  }`}
                >
                  <span className="text-gray-800 dark:text-gray-100 text-sm sm:text-base">
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
              <p className="text-center text-gray-500 dark:text-gray-400">
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
