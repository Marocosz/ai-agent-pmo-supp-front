import { useState, useEffect, useRef } from "react";
// Importa nosso hook de contexto que já criamos
import { useSession } from "../contexts/SessionContext"; 
// Importa os tipos que definimos
import type { IWsMessage } from "../types/chat.types"; 

// Pega a URL do WebSocket do .env do frontend (criaremos este .env depois)
const WS_URL_BASE = (import.meta.env.VITE_API_URL || "ws://127.0.0.1:8000")
                    .replace("http", "ws"); // Garante que é 'ws://'

/**
 * Hook customizado para gerenciar a conexão WebSocket do chat.
 */
export const useChatSocket = () => {
  // 1. Pega o 'sessionId' e o 'status' do nosso contexto global
  const { sessionId, status } = useSession(); 
  
  // 2. Estados internos do hook
  const [messages, setMessages] = useState<IWsMessage[]>([]); // Lista de mensagens do chat
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // 3. O 'useRef' é a forma correta de guardar o objeto do WebSocket
  //    para que ele não seja recriado a cada renderização.
  const socketRef = useRef<WebSocket | null>(null);

  // 4. Efeito principal: Conectar e Ouvir
  useEffect(() => {
    // Só tenta conectar se tivermos um sessionId E se o contexto disse que a sessão HTTP foi "connected"
    if (sessionId && status === "connected") {
      
      // Se já houver um socket, não faça nada
      if (socketRef.current) return;

      setIsConnecting(true);
      setError(null);
      setMessages([]); // Limpa mensagens de chats anteriores
      console.log(`[useChatSocket] Tentando conectar ao WebSocket: ${WS_URL_BASE}/v1/session/chat/${sessionId}`);

      // Cria a nova conexão WebSocket
      const socket = new WebSocket(`${WS_URL_BASE}/v1/session/chat/${sessionId}`);
      socketRef.current = socket; // Armazena a conexão na referência

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
        socketRef.current = null; // Limpa a referência
        if (event.code !== 1000) { // 1000 é "Normal Closure" (Geração concluída)
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
          
          // Adiciona a nova mensagem à nossa lista de mensagens
          setMessages((prevMessages) => [...prevMessages, messageData]);

        } catch (e) {
          console.error("[useChatSocket] Erro ao processar mensagem do WS:", e);
        }
      };

      // --- Função de Limpeza ---
      // Isso é executado se o componente "desmontar"
      return () => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          console.log("[useChatSocket] Limpando e fechando conexão WS.");
          socketRef.current.close(1000, "Componente desmontado");
        }
        socketRef.current = null;
      };
    }
  }, [sessionId, status]); // Re-execute este efeito se 'sessionId' ou 'status' mudarem

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
    messages,     // A lista de mensagens do chat
    sendMessage,  // A função para enviar uma resposta/ação
    isConnecting, // Verdadeiro enquanto o WS está conectando
    isConnected,  // Verdadeiro quando o WS está pronto
    error,        // Mensagem de erro, se houver
  };
};