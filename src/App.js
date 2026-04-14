import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { DarkModeProvider } from "./contexts/DarkModeContext";

import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Home from "./pages/Home";
import EventoAccess from "./pages/EventoAccess";
import Votacao from "./pages/Votacao";
import NovaAssembleia from "./pages/NovaAssembleia";
import AdminDashboard from "./pages/AdminDashboard";
import Usuarios from "./pages/Usuarios";
import Resultados from "./pages/Resultados";
import RecuperarSenha from "./pages/RecuperarSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import GerenciarAssembleias from "./pages/GerenciarAssembleias";
import ReservarSalao from "./pages/ReservarSalao";
import GerenciarReservas from "./pages/GerenciarReservas";
import GerenciarAvisos from "./pages/GerenciarAvisos";
import MuralAvisos from "./pages/MuralAvisos";
import Ocorrencias from "./pages/Ocorrencias";
import GerenciarOcorrencias from "./pages/GerenciarOcorrencias";

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const verificarSessao = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: dadosUsuario, error } = await supabase
        .from("usuarios")
        .select("role, ativo")
        .eq("id", user.id)
        .single();

      if (error || !dadosUsuario) {
        setUsuario(null);
        setPerfil(null);
        setCarregando(false);
        return;
      }

      if (dadosUsuario.ativo) {
        setUsuario(user);
        setPerfil(dadosUsuario.role);
      } else {
        await supabase.auth.signOut();
        setUsuario(null);
        setPerfil(null);
      }
    } else {
      setUsuario(null);
      setPerfil(null);
    }

    setCarregando(false);
  };

  useEffect(() => {
    verificarSessao();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUsuario(null);
        setPerfil(null);
        setCarregando(false);
      } else if (event === "PASSWORD_RECOVERY") {
        // Não logar — redirecionar para tela de redefinição
        setCarregando(false);
        navigate("/redefinir-senha", { replace: true });
      } else if (event === "SIGNED_IN") {
        // Ignorar SIGNED_IN se estiver na tela de redefinição
        if (window.location.pathname === "/redefinir-senha") return;
        verificarSessao();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (carregando) return;

    if (usuario && perfil) {
      const jaNaRota =
        (perfil === "admin" && location.pathname !== "/") ||
        (perfil === "morador" && location.pathname !== "/");

      if (!jaNaRota) {
        if (perfil === "admin") navigate("/admin", { replace: true });
        if (perfil === "morador") navigate("/home", { replace: true });
      }
    }
  }, [usuario, perfil, carregando, navigate, location.pathname]);

  if (carregando) {
    return (
      <DarkModeProvider>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-700 dark:text-gray-200 text-lg font-medium">
          Carregando...
        </div>
      </DarkModeProvider>
    );
  }

  return (
    <DarkModeProvider>
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden">
      <div className="flex flex-col min-h-screen px-2 sm:px-4 md:px-6 lg:px-8">
        <main className="flex-grow w-full">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/cadastro"
              element={!usuario ? <Cadastro /> : <Navigate to="/" />}
            />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route
              path="/home"
              element={usuario ? <Home /> : <Navigate to="/" />}
            />
            <Route path="/evento" element={<EventoAccess />} />
            <Route
              path="/salao"
              element={usuario ? <ReservarSalao /> : <Navigate to="/" />}
            />

            <Route
              path="/votacao"
              element={usuario && perfil === "morador" ? <Votacao /> : <Navigate to="/" />}
            />
            <Route
              path="/admin"
              element={usuario && perfil === "admin" ? <AdminDashboard /> : <Navigate to="/" />}
            />
            <Route
              path="/nova-assembleia"
              element={usuario && perfil === "admin" ? <NovaAssembleia /> : <Navigate to="/" />}
            />
            <Route
              path="/usuarios"
              element={usuario && perfil === "admin" ? <Usuarios /> : <Navigate to="/" />}
            />
            <Route
              path="/resultados"
              element={usuario && perfil === "admin" ? <Resultados /> : <Navigate to="/" />}
            />
            <Route
              path="/gerenciar-assembleias"
              element={usuario && perfil === "admin" ? <GerenciarAssembleias /> : <Navigate to="/" />}
            />
            <Route
              path="/gerenciar-reservas"
              element={usuario && perfil === "admin" ? <GerenciarReservas /> : <Navigate to="/" />}
            />
            <Route
              path="/gerenciar-avisos"
              element={usuario && perfil === "admin" ? <GerenciarAvisos /> : <Navigate to="/" />}
            />
            <Route
              path="/mural"
              element={usuario ? <MuralAvisos /> : <Navigate to="/" />}
            />
            <Route
              path="/ocorrencias"
              element={usuario ? <Ocorrencias /> : <Navigate to="/" />}
            />
            <Route
              path="/gerenciar-ocorrencias"
              element={usuario && perfil === "admin" ? <GerenciarOcorrencias /> : <Navigate to="/" />}
            />
          </Routes>
        </main>
      </div>
    </div>
    </DarkModeProvider>
  );
}