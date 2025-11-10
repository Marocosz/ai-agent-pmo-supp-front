import { useState, useEffect, useRef } from "react";
import { useSession } from "../contexts/SessionContext";
import type { IWsMessage } from "../types/chat.types"; 

const WS_URL_BASE = (import.meta.env.VITE_API_URL || "ws://127.0.0.1:8000")
                    .replace("http", "ws");

export const useChatSocket = () => {
  const { sessionId, status } = useSession(); 
  const [messages, setMessages] = useState<IWsMessage[]>([]); 
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // --- MUDANÇA: Novo estado para "Digitando..." ---
  const [isAgentResponding, setIsAgentResponding] = useState(false);
  // --- FIM DA MUDANÇA ---
  
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (sessionId && status === "connected") {
      // ... (lógica de conexão 'socket = new WebSocket...') ...
      if (socketRef.current) return;
      setIsConnecting(true);
      setError(null);
      setMessages([]);
      console.log(`[useChatSocket] Tentando conectar ao WebSocket: ${WS_URL_BASE}/v1/session/chat/${sessionId}`);
      const socket = new WebSocket(`${WS_URL_BASE}/v1/session/chat/${sessionId}`);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("[useChatSocket] Conexão WebSocket estabelecida.");
        setIsConnecting(false);
        setIsConnected(true);
      };

      socket.onclose = (event) => {
        // ... (lógica de onclose) ...
        setIsConnecting(false);
        setIsConnected(false);
        socketRef.current = null;
        if (event.code !== 1000) { 
          setError(`Conexão perdida: ${event.reason || 'Erro desconhecido'}`);
        }
      };

      socket.onerror = (event) => {
        // ... (lógica de onerror) ...
        console.error("[useChatSocket] Erro no WebSocket:", event);
        setError("Ocorreu um erro na conexão do chat.");
        setIsConnecting(false);
        setIsConnected(false);
      };

      socket.onmessage = (event) => {
        // --- MUDANÇA: Agente parou de digitar ---
        setIsAgentResponding(false);
        // --- FIM DA MUDANÇA ---
        
        try {
          const messageData: IWsMessage = JSON.parse(event.data);
          console.log("[useChatSocket] Mensagem recebida:", messageData);
          setMessages((prevMessages) => [...prevMessages, messageData]);
        } catch (e) {
          console.error("[useChatSocket] Erro ao processar mensagem:", e);
        }
      };

      return () => {
        // ... (lógica de limpeza) ...
      };
    }
  }, [sessionId, status]);

  const sendMessage = (message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log("[useChatSocket] Enviando mensagem:", message);
      socketRef.current.send(message);
      
      // --- MUDANÇA: Agente vai começar a "digitar" ---
      // (Ignora se for um clique de botão)
      if (!message.startsWith("accept:") && !message.startsWith("reject:")) {
        setIsAgentResponding(true);
      }
      // --- FIM DA MUDANÇA ---

    } else {
      console.error("[useChatSocket] Não é possível enviar: WebSocket não conectado.");
      setError("Não foi possível enviar a mensagem. Conexão perdida.");
    }
  };

  return {
    messages,
    setMessages, 
    sendMessage,
    isConnecting,
    isConnected,
    isAgentResponding, // <-- Exporta o novo estado
    error,
  };
};