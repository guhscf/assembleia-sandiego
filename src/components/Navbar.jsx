import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabase.js";

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

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/30 backdrop-blur-md border-b border-white/40 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Título */}
          <div
            className="text-2xl sm:text-3xl font-bold text-gray-800 cursor-pointer select-none"
            onClick={() => navigate("/")}
          >
            {titulo}<span className="text-indigo-500">+</span>
          </div>

          {/* Botão de menu mobile */}
          <div className="flex sm:hidden">
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-white/40 focus:outline-none"
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
          <div className="hidden sm:flex space-x-6 items-center">
            {mostrarVoltar && (
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-xl text-white bg-indigo-500 hover:bg-indigo-600 shadow-md transition"
              >
                Voltar
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600 shadow-md transition"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {menuAberto && (
        <div className="sm:hidden bg-white/50 backdrop-blur-md border-t border-white/40">
          <div className="px-4 py-3 space-y-3">
            {mostrarVoltar && (
              <button
                onClick={() => {
                  setMenuAberto(false);
                  navigate(-1);
                }}
                className="w-full text-center px-4 py-2 rounded-xl text-white bg-indigo-500 hover:bg-indigo-600 shadow-md transition"
              >
                Voltar
              </button>
            )}
            <button
              onClick={() => {
                setMenuAberto(false);
                handleLogout();
              }}
              className="w-full text-center px-4 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600 shadow-md transition"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
