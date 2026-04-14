import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Building2, CalendarDays, Megaphone, AlertCircle } from "lucide-react";

const modulos = [
  {
    titulo: "Assembleia",
    descricao: "Participe das assembleias e vote nas pautas do condomínio.",
    Icone: Building2,
    rota: "/evento",
    iconeBg: "bg-indigo-100 dark:bg-indigo-900/40",
    iconeColor: "text-indigo-600 dark:text-indigo-400",
    borderColor: "border-indigo-100 dark:border-indigo-800",
    hoverClasses: "hover:border-indigo-300 hover:shadow-indigo-100/60 dark:hover:border-indigo-600",
  },
  {
    titulo: "Reservar Salão de Festas",
    descricao: "Agende o salão de festas para eventos e comemorações.",
    Icone: CalendarDays,
    rota: "/salao",
    iconeBg: "bg-sky-100 dark:bg-sky-900/40",
    iconeColor: "text-sky-600 dark:text-sky-400",
    borderColor: "border-sky-100 dark:border-sky-800",
    hoverClasses: "hover:border-sky-300 hover:shadow-sky-100/60 dark:hover:border-sky-600",
  },
  {
    titulo: "Mural de Avisos",
    descricao: "Fique por dentro das novidades e comunicados do condomínio.",
    Icone: Megaphone,
    rota: "/mural",
    iconeBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconeColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-100 dark:border-emerald-800",
    hoverClasses: "hover:border-emerald-300 hover:shadow-emerald-100/60 dark:hover:border-emerald-600",
  },
  {
    titulo: "Ocorrências",
    descricao: "Registre reclamações ou ocorrências para a administração.",
    Icone: AlertCircle,
    rota: "/ocorrencias",
    iconeBg: "bg-rose-100 dark:bg-rose-900/40",
    iconeColor: "text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-100 dark:border-rose-800",
    hoverClasses: "hover:border-rose-300 hover:shadow-rose-100/60 dark:hover:border-rose-600",
  },
];

export default function Home() {
  const navigate = useNavigate();

  const hora = new Date().getHours();
  const saudacao =
    hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="min-h-screen">
      <Navbar mostrarVoltar={true} />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mt-8 mb-10 sm:mt-10 sm:mb-12">
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 leading-tight">
            Residencial{" "}
            <span className="text-indigo-500">San Diego</span>
            <span className="text-indigo-400">.</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
            {saudacao}! O que você deseja fazer hoje?
          </p>
        </div>

        {/* Grid de módulos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {modulos.map(
            ({
              titulo,
              descricao,
              Icone,
              rota,
              iconeBg,
              iconeColor,
              borderColor,
              hoverClasses,
            }) => (
              <button
                key={rota}
                onClick={() => navigate(rota)}
                className={`
                  flex flex-col items-start gap-4 p-5 sm:p-6
                  rounded-2xl border ${borderColor}
                  bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm
                  shadow-md ${hoverClasses}
                  transition-all duration-200 hover:scale-[1.02] hover:shadow-lg
                  text-left w-full
                `}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${iconeBg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icone className={`w-6 h-6 ${iconeColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 leading-snug">
                    {titulo}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    {descricao}
                  </p>
                </div>

                <div
                  className={`flex items-center gap-1 text-sm font-medium ${iconeColor}`}
                >
                  Acessar
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            )
          )}
        </div>
      </main>
    </div>
  );
}
