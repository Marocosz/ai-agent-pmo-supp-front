import React, { useState, useEffect, useRef } from "react";
import { useSession } from "../contexts/SessionContext";
import { useChatSocket } from "../hooks/useChatSocket";
// Adicionamos IWsMessage para criar o balão do usuário
import type { ISessionStartRequest, IWsMessage } from "../types/chat.types";

/**
 * Componente: O formulário para iniciar uma nova sessão.
 * (Atualizado com placeholders e valores em branco)
 */
const StartSessionForm: React.FC = () => {
  const { startSession, status, error } = useSession();
  
  // Estado inicial agora está em branco
  const [formData, setFormData] = useState<ISessionStartRequest>({
    tipo_documento: "",
    codificacao: "",
    titulo_documento: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Iniciando sessão com:", formData);
    startSession(formData);
  };

  return (
    // Usa as classes CSS que definimos em App.css
    <div className="start-form">
      <h2>Iniciar Novo Documento</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="codificacao">Codificação (ex: FO-QUA-001)</label>
          <input
            type="text"
            id="codificacao"
            name="codificacao"
            value={formData.codificacao}
            onChange={handleChange}
            placeholder="Digite o código do documento..."
            required 
          />
        </div>
        <div>
          <label htmlFor="titulo_documento">Título do Documento</label>
          <input
            type="text"
            id="titulo_documento"
            name="titulo_documento"
            value={formData.titulo_documento}
            onChange={handleChange}
            placeholder="Ex: Padrão de Acesso ao Sistema..."
            required
          />
        </div>
        <div>
          <label htmlFor="tipo_documento">Tipo de Documento (ex: Formulário, PGP)</label>
          <input
            type="text"
            id="tipo_documento"
            name="tipo_documento"
            value={formData.tipo_documento}
            onChange={handleChange}
            placeholder="Digite o tipo do documento..."
            required
          />
        </div>
        <button type="submit" disabled={status === "connecting"}>
          {status === "connecting" ? "Iniciando..." : "Iniciar Chat"}
        </button>
        {status === "error" && error && (
          <p style={{ color: "red" }}>Erro: {error}</p>
        )}
      </form>
    </div>
  );
};

/**
 * Componente: A janela principal do chat.
 * (Atualizado com balão do usuário e layout correto)
 */
const ChatWindow: React.FC = () => {
  const { messages, setMessages, sendMessage, isConnecting, isConnected, error } = useChatSocket();
  const [userMessage, setUserMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref para auto-scroll

  // Efeito para rolar para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (userMessage.trim() && isConnected) {
      
      // --- Lógica do Balão do Usuário ---
      // 1. Cria o objeto da mensagem do usuário
      const userMsg: IWsMessage = {
        type: "user", // O novo tipo que estilizamos
        content: userMessage,
        actions: [], // Ações vazias
      };
      
      // 2. Adiciona IMEDIATAMENTE o balão do usuário ao chat
      setMessages((prevMessages) => [...prevMessages, userMsg]);
      
      // 3. Envia a mensagem (o texto puro) para o servidor
      sendMessage(userMessage);
      
      // 4. Limpa o input
      setUserMessage("");
    }
  };

  // Helper para mostrar o status da conexão
  const getStatusIndicator = () => {
    if (isConnecting) {
      return <span className="connecting">Conectando...</span>;
    }
    if (error) {
      return <span className="error">Erro de Conexão</span>;
    }
    if (isConnected) {
      return <span className="connected">Conectado</span>;
    }
    return <span className="error">Desconectado</span>;
  };

  return (
    // Usa as classes CSS que definimos em App.css
    <div className="chat-window">
      <div className="chat-header">
        <h2>Chat de Geração de Documento</h2>
        <div className="chat-header-status">
          Status: {getStatusIndicator()}
        </div>
      </div>

      <div className="message-list">
        {/* Loop para renderizar as mensagens */}
        {messages.map((msg, index) => (
          // O className agora usará `type-user` ou `type-text` etc.
          <div key={index} className={`message-bubble type-${msg.type}`}> 
            
            {/* --- Lógica de Título (Não mostrar "USER:") --- */}
            {msg.type !== 'user' && (
              // Mostra o tipo da mensagem (ex: [SUGGESTION])
              <p><strong>[{msg.type.toUpperCase()}]:</strong> {msg.content}</p>
            )}
            {msg.type === 'user' && (
              <p>{msg.content}</p> // Mensagem do usuário não tem título
            )}
            {/* --- FIM DA LÓGICA DE TÍTULO --- */}
            
            {/* Renderiza os botões (Aceitar/Recusar) */}
            {msg.actions && msg.actions.length > 0 && (
              <div className="action-buttons">
                {msg.actions.map(action => (
                  <button 
                    key={action.value} 
                    onClick={() => sendMessage(action.value)}
                    // Adiciona classe 'reject' para o botão de recusar
                    className={action.value.startsWith("reject") ? "reject" : ""}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
            
            {/* Renderiza o link do arquivo final */}
            {msg.type === 'final' && msg.file_path && (
              <p><strong>Download:</strong> {msg.file_path}</p>
            )}
          </div>
        ))}
        {/* Elemento invisível para o auto-scroll */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input de texto */}
      <div className="chat-input">
        <input 
          type="text" 
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isConnected ? "Digite seu resumo aqui..." : "Aguardando conexão..."}
          disabled={!isConnected}
        />
        <button onClick={handleSend} disabled={!isConnected}>
          Enviar
        </button>
      </div>
    </div>
  );
};

/**
 * Página principal que decide qual componente mostrar
 */
const ChatPage: React.FC = () => {
  const { sessionId, status } = useSession();

  // Se o sessionId existir E o status for 'connected', mostre o chat.
  if (sessionId && status === "connected") {
    return <ChatWindow />;
  }

  // Se não, mostre o formulário de login/início
  return <StartSessionForm />;
};

export default ChatPage;