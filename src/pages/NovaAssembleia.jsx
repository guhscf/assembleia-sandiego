import { useState } from "react";
import { supabase } from "../supabase.js";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";

export default function NovaAssembleia() {
  const [idAssembleia, setIdAssembleia] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [senha, setSenha] = useState("");
  const [opcoes, setOpcoes] = useState(["Sim", "Não", "Abstenção"]);
  const [loading, setLoading] = useState(false);

  const adicionarOpcao = () => setOpcoes([...opcoes, ""]);
  const removerOpcao = (index) => setOpcoes(opcoes.filter((_, i) => i !== index));
  const atualizarOpcao = (index, valor) => {
    const novaLista = [...opcoes];
    novaLista[index] = valor;
    setOpcoes(novaLista);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idAssembleia || !titulo || !descricao || !data || !senha) {
      Swal.fire({
        title: "Campos obrigatórios!",
        text: "Preencha todos os campos antes de criar a assembleia.",
        icon: "warning",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from("assembleias").insert({
        id_assembleia: idAssembleia,
        titulo,
        descricao,
        data,
        senha_acesso: senha,
        ativa: true,
        opcoes,
        criado_em: new Date().toISOString(),
      });

      if (error) throw error;

      Swal.fire({
        title: "Assembleia criada!",
        html: `
          <p><strong>ID:</strong> ${idAssembleia}</p>
          <p><strong>Senha:</strong> ${senha}</p>
        `,
        icon: "success",
        confirmButtonColor: "#4f46e5",
      });

      setIdAssembleia("");
      setTitulo("");
      setDescricao("");
      setData("");
      setSenha("");
      setOpcoes(["Sim", "Não", "Abstenção"]);
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Erro ao criar assembleia",
        text: "Verifique as informações e tente novamente.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100">
      <Navbar mostrarVoltar={true} />

      <div className="max-w-3xl mx-auto bg-white/40 backdrop-blur-md shadow-lg border border-white/30 rounded-3xl p-10 mt-24">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Nova Assembleia<span className="text-indigo-500">.</span>
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="ID da Assembleia (único)"
              value={idAssembleia}
              onChange={(e) => setIdAssembleia(e.target.value)}
              required
              className="p-4 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none"
            />

            <input
              type="password"
              placeholder="Senha de acesso"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="p-4 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none"
            />
          </div>

          <input
            type="text"
            placeholder="Título da Assembleia"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            className="p-4 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none"
          />

          <textarea
            placeholder="Descrição / pauta da assembleia"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
            rows="3"
            className="p-4 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
          />

          <input
            type="datetime-local"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
            className="p-4 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none"
          />

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Opções de voto
            </label>
            <div className="flex flex-col gap-3">
              {opcoes.map((opcao, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={opcao}
                    onChange={(e) => atualizarOpcao(index, e.target.value)}
                    className="flex-1 p-3 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removerOpcao(index)}
                    className="text-red-500 hover:text-red-600 font-semibold text-lg"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={adicionarOpcao}
              className="mt-3 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm font-medium rounded-xl shadow-md hover:opacity-90 transition"
            >
              + Adicionar opção
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`mt-6 py-4 rounded-xl text-white font-semibold text-lg shadow-md transition-transform transform hover:scale-[1.02] ${
              loading
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-gradient-to-r from-sky-500 to-indigo-500 hover:opacity-90"
            }`}
          >
            {loading ? "Criando..." : "Criar Assembleia"}
          </button>
        </form>
      </div>
    </div>
  );
}
