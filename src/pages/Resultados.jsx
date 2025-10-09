import { useEffect, useState } from "react";
import { supabase } from "../supabase.js";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";

export default function Resultados() {
  const [assembleias, setAssembleias] = useState([]);
  const [assembleiaSelecionada, setAssembleiaSelecionada] = useState("");
  const [votos, setVotos] = useState([]);
  const [dadosGrafico, setDadosGrafico] = useState([]);

  // 🔹 Carrega assembleias ao iniciar
  useEffect(() => {
    const carregarAssembleias = async () => {
      const { data, error } = await supabase.from("assembleias").select("*");
      if (error) console.error("Erro ao carregar assembleias:", error);
      else setAssembleias(data || []);
    };
    carregarAssembleias();
  }, []);

  // 🔹 Carrega votos da assembleia selecionada
  useEffect(() => {
    if (!assembleiaSelecionada) return;

    const carregarVotos = async () => {
      const { data, error } = await supabase
        .from("votos")
        .select("*")
        .eq("id_assembleia", assembleiaSelecionada);

      if (error) {
        console.error("Erro ao carregar votos:", error);
        return;
      }

      setVotos(data);

      const contagem = {};
      data.forEach((v) => {
        contagem[v.voto] = (contagem[v.voto] || 0) + 1;
      });

      const dados = Object.entries(contagem).map(([opcao, quantidade]) => ({
        name: opcao,
        value: quantidade,
      }));

      setDadosGrafico(dados);
    };

    carregarVotos();
  }, [assembleiaSelecionada]);

  // 📥 Exporta CSV
  const exportarCSV = () => {
    if (votos.length === 0) {
      Swal.fire({
        title: "Sem votos para exportar",
        text: "Selecione uma assembleia com votos registrados.",
        icon: "info",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    let csv = "Opção,Votos\n";
    dadosGrafico.forEach((linha) => {
      csv += `${linha.name},${linha.value}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `resultado_${assembleiaSelecionada}.csv`;
    link.click();
  };

  const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100">
      <Navbar mostrarVoltar={true} />

      <div className="max-w-4xl mx-auto mt-24 p-8 bg-white/40 backdrop-blur-md shadow-lg border border-white/30 rounded-3xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Resultados das Assembleias<span className="text-indigo-500">.</span>
        </h1>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
          <select
            value={assembleiaSelecionada}
            onChange={(e) => setAssembleiaSelecionada(e.target.value)}
            className="p-3 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none w-full md:w-2/3"
          >
            <option value="">Selecione uma assembleia...</option>
            {assembleias.map((a) => (
              <option key={a.id} value={a.id}>
                {a.titulo}
              </option>
            ))}
          </select>

          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-medium shadow-md hover:opacity-90 transition"
          >
            <Download size={18} />
            Exportar CSV
          </button>
        </div>

        {dadosGrafico.length > 0 ? (
          <div className="flex flex-col items-center gap-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosGrafico}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    isAnimationActive={true}
                  >
                    {dadosGrafico.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/70 rounded-xl shadow-sm border border-gray-200 w-full p-5">
              <h2 className="text-lg font-semibold text-gray-700 mb-3 text-center">
                Detalhes dos votos
              </h2>
              <div className="flex flex-wrap justify-center gap-6 text-gray-700">
                {dadosGrafico.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100 min-w-[120px]"
                  >
                    <span
                      className="w-4 h-4 rounded-full mb-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></span>
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-sm text-gray-500">
                      {item.value} voto{item.value > 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : assembleiaSelecionada ? (
          <p className="text-center text-gray-600">
            Nenhum voto registrado ainda para esta assembleia.
          </p>
        ) : (
          <p className="text-center text-gray-500">
            Selecione uma assembleia para visualizar os resultados.
          </p>
        )}
      </div>
    </div>
  );
}
