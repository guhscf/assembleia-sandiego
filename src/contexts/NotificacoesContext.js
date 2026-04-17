import { createContext, useContext, useState, useCallback } from "react";

const NotificacoesContext = createContext(null);

export function NotificacoesProvider({ children }) {
  const [notificacoes, setNotificacoes] = useState([]);

  const adicionarNotificacao = useCallback((notif) => {
    setNotificacoes((prev) => [
      { id: Date.now(), titulo: notif.title, corpo: notif.body, lida: false, hora: new Date() },
      ...prev,
    ]);
  }, []);

  const marcarTodasLidas = useCallback(() => {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  }, []);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <NotificacoesContext.Provider value={{ notificacoes, adicionarNotificacao, marcarTodasLidas, naoLidas }}>
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes() {
  return useContext(NotificacoesContext);
}
