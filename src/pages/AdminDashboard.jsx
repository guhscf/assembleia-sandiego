import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Gerenciar Usuários",
      description: "Veja usuários pendentes, aprove ou remova cadastros.",
      color: "bg-blue-100",
      icon: "🪪",
      action: () => navigate("/usuarios"),
    },
    {
      title: "Nova Assembleia",
      description: "Crie uma nova assembleia, defina pautas e opções de voto.",
      color: "bg-blue-100",
      icon: "🗳️",
      action: () => navigate("/nova-assembleia"),
    },
    {
      title: "Gerenciar Assembleias",
      description: "Ative, desative ou visualize a participação das assembleias.",
      color: "bg-blue-100",
      icon: "⚙️",
      action: () => navigate("/gerenciar-assembleias"),
    },
    {
      title: "Resultados",
      description: "Visualize e exporte os resultados das assembleias.",
      color: "bg-blue-100",
      icon: "📊",
      action: () => navigate("/resultados"),
    },
    {
      title: "Gerenciar Reservas",
      description: "Aprove ou recuse solicitações de reserva do salão de festas.",
      color: "bg-blue-100",
      icon: "📅",
      action: () => navigate("/gerenciar-reservas"),
    },
    {
      title: "Gerenciar Avisos",
      description: "Crie e gerencie comunicados exibidos para os moradores.",
      color: "bg-blue-100",
      icon: "🔔",
      action: () => navigate("/gerenciar-avisos"),
    },
    {
      title: "Portal do Morador",
      description: "Visualize a tela inicial dos moradores do condomínio.",
      color: "bg-blue-100",
      icon: "🏠",
      action: () => navigate("/home"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100">
      <Navbar mostrarVoltar={true} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-10">
          Painel do Administrador<span className="text-indigo-500">.</span>
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {cards.map((card, index) => (
            <div
              key={index}
              onClick={card.action}
              className={`${card.color} cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-transform rounded-2xl shadow-md p-6 flex flex-col items-center justify-center text-center`}
            >
              <div className="text-4xl sm:text-5xl mb-4">{card.icon}</div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                {card.title}
              </h2>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
