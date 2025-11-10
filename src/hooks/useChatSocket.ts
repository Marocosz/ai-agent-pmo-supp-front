import { useState, useEffect, useRef } from "react";
import { useSession } from "../contexts/SessionContext";
import type { IWsMessage } from "../types/chat.types"; 

const WS_URL_BASE = (import.meta.env.VITE_API_URL || "ws://127.0.0.1:8000")
                    .replace("http", "ws");

/**
 * Hook customizado para gerenciar a conexão WebSocket do chat.
 */
export const useChatSocket = () => {
  const { sessionId, status } = useSession(); 
  
  // O 'messages' e 'setMessages' vivem aqui dentro
  const [messages, setMessages] = useState<IWsMessage[]>([]); 
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);

  // Efeito principal: Conectar e Ouvir
  useEffect(() => {
    if (sessionId && status === "connected") {
      
      if (socketRef.current) return;

      setIsConnecting(true);
      setError(null);
      setMessages([]); // Limpa mensagens de chats anteriores
      console.log(`[useChatSocket] Tentando conectar ao WebSocket: ${WS_URL_BASE}/v1/session/chat/${sessionId}`);

      const socket = new WebSocket(`${WS_URL_BASE}/v1/session/chat/${sessionId}`);
      socketRef.current = socket;

      // --- Define os "Listeners" (Ouvintes) do WebSocket ---

      socket.onopen = () => {
        console.log("[useChatSocket] Conexão WebSocket estabelecida com sucesso.");
        setIsConnecting(false);
        setIsConnected(true);
      };

      socket.onclose = (event) => {
        console.log(`[useChatSocket] Conexão WebSocket fechada. Código: ${event.code}, Razão: ${event.reason}`);
        setIsConnecting(false);
        setIsConnected(false);
        socketRef.current = null;
        if (event.code !== 1000) { 
          setError(`Conexão perdida: ${event.reason || 'Erro desconhecido'}`);
        }
      };

      socket.onerror = (event) => {
        console.error("[useChatSocket] Erro no WebSocket:", event);
        setError("Ocorreu um erro na conexão do chat.");
        setIsConnecting(false);
        setIsConnected(false);
      };

      socket.onmessage = (event) => {
        // Nova mensagem recebida do Orquestrador!
        try {
          const messageData: IWsMessage = JSON.parse(event.data);
          console.log("[useChatSocket] Mensagem recebida do servidor:", messageData);
          
          setMessages((prevMessages) => [...prevMessages, messageData]);

        } catch (e) {
          console.error("[useChatSocket] Erro ao processar mensagem do WS:", e);
        }
      };

      // --- Função de Limpeza ---
      return () => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          console.log("[useChatSocket] Limpando e fechando conexão WS.");
          socketRef.current.close(1000, "Componente desmontado");
        }
        socketRef.current = null;
      };
    }
  }, [sessionId, status]);

  /**
   * Função pública para ENVIAR uma mensagem (ou ação) para o Orquestrador
   */
  const sendMessage = (message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log("[useChatSocket] Enviando mensagem para o servidor:", message);
      socketRef.current.send(message);
    } else {
      console.error("[useChatSocket] Não é possível enviar mensagem: WebSocket não está conectado.");
      setError("Não foi possível enviar a mensagem. Conexão perdida.");
    }
  };

  // Retorna tudo o que nossa UI (Página de Chat) vai precisar
  return {
    messages,
    // --- MUDANÇA AQUI: Exporta o 'setMessages' ---
    setMessages, // <-- Permite que o ChatPage.tsx adicione o balão do usuário
    // --- FIM DA MUDANÇA ---
    sendMessage,
    isConnecting,
    isConnected,
    error,
  };
};