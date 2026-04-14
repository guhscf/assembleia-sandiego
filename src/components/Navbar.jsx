import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabase.js";
import { Sun, Moon, ChevronLeft, LogOut } from "lucide-react";
import { useDarkMode } from "../contexts/DarkModeContext";

const TITULOS = {
  "/home":          "SanDiego",
  "/evento":        "Assembleia",
  "/votacao":       "Assembleia",
  "/salao":         "Reserva",
  "/mural":         "Avisos",
  "/ocorrencias":   "Ocorrencias",
  "/admin":         "SanDiego",
  "/nova-assembleia":        "Assembleia",
  "/gerenciar-assembleias":  "Assembleia",
  "/usuarios":      "SanDiego",
  "/resultados":      "SanDiego",
  "/gerenciar-reservas": "Reservas",
};

export default function Navbar({ mostrarVoltar = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const { darkMode, toggleDarkMode } = useDarkMode();

  const titulo = TITULOS[location.pathname] ?? "SanDiego";

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Erro ao sair:", error.message);
    }
  };

  const ModoToggle = () => (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide select-none">
        Modo
      </span>

      <button
        onClick={toggleDarkMode}
        title={darkMode ? "Mudar para claro" : "Mudar para escuro"}
        className="relative w-16 h-8 rounded-full focus:outline-none"
        style={{
          backgroundColor: darkMode ? "#1f2937" : "#e5e7eb",
          boxShadow: darkMode
            ? "inset 2px 2px 5px #111827, inset -2px -2px 5px #374151"
            : "inset 2px 2px 5px #c9cdd4, inset -2px -2px 5px #ffffff",
          transition: "background-color 600ms ease, box-shadow 600ms ease",
        }}
      >
        {/* Círculo deslizante */}
        <span
          className="absolute top-1 w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            left: darkMode ? "calc(100% - 1.75rem)" : "0.25rem",
            backgroundColor: darkMode ? "#374151" : "#ffffff",
            boxShadow: darkMode
              ? "2px 2px 6px #111827, -1px -1px 4px #4b5563"
              : "2px 2px 6px #b0b4bb, -1px -1px 4px #ffffff",
            transition: "left 600ms cubic-bezier(0.4, 0, 0.2, 1), background-color 600ms ease, box-shadow 600ms ease",
          }}
        >
          {darkMode
            ? <Moon className="w-3.5 h-3.5 text-indigo-300" />
            : <Sun className="w-3.5 h-3.5 text-amber-400" />
          }
        </span>
      </button>
    </div>
  );

  return (
    <>
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/30 dark:bg-gray-900/40 backdrop-blur-md border-b border-white/40 dark:border-gray-700/40 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Título */}
          <div
            className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 cursor-pointer select-none"
            onClick={() => navigate("/")}
          >
            {titulo}<span className="text-indigo-500">+</span>
          </div>

          {/* Botão de menu mobile */}
          <div className="flex sm:hidden">
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-700/40 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {menuAberto ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Menu Desktop */}
          <div className="hidden sm:flex items-center gap-3">
            <ModoToggle />
            {mostrarVoltar && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-700/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-700/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {menuAberto && (
        <div className="sm:hidden bg-white/50 dark:bg-gray-800/80 backdrop-blur-md border-t border-white/40 dark:border-gray-700/40">
          <div className="px-4 py-3 flex items-center justify-between">
            <ModoToggle />
            <button
              onClick={() => { setMenuAberto(false); handleLogout(); }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-700/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      )}
    </nav>

      {/* Botão Voltar flutuante — apenas mobile */}
      {mostrarVoltar && (
        <button
          onClick={() => navigate(-1)}
          className="sm:hidden fixed top-[4.5rem] left-4 z-40 flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium text-indigo-600 dark:text-indigo-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-indigo-100 dark:border-indigo-700/40 shadow-md hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
      )}
    </>
  );
}
