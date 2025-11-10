import React, { useState, useEffect, useRef } from "react";
import { useSession } from "../contexts/SessionContext";
import { useChatSocket } from "../hooks/useChatSocket";
import type { ISessionStartRequest, IWsMessage } from "../types/chat.types";

/**
 * Componente: O formulário para iniciar uma nova sessão.
 */
const StartSessionForm: React.FC = () => {
  const { startSession, status, error } = useSession();
  
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
 */
const ChatWindow: React.FC = () => {
  const { 
    messages, 
    setMessages, 
    sendMessage, 
    isConnecting, 
    isConnected, 
    isAgentResponding, 
    error 
  } = useChatSocket();
  
  const [userMessage, setUserMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAgentResponding]);

  const handleSend = () => {
    if (userMessage.trim() && isConnected) {
      
      const userMsg: IWsMessage = {
        type: "user",
        content: userMessage,
        actions: [],
      };
      
      setMessages((prevMessages) => [...prevMessages, userMsg]);
      sendMessage(userMessage);
      setUserMessage("");
    }
  };
  
  const AgentPersona: React.FC = () => (
    <div className="agent-persona">
      <div className="agent-persona-icon">DC</div>
      <div className="agent-persona-name">Assistente de Documentação</div>
    </div>
  );
  
  const TypingIndicator: React.FC = () => (
    <div className="typing-indicator">
      <div className="agent-persona-icon">DC</div>
      <div className="typing-indicator-bubble">
        Digitando...
      </div>
    </div>
  );

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h2>Chat de Geração de Documento</h2>
      </div>

      <div className="message-list">
        {messages.map((msg, index) => (
          
          msg.type === 'user' ? (
            // Balão do Usuário (sem persona)
            <div key={index} className="message-bubble type-user"> 
              <p>{msg.content}</p>
            </div>
          ) : (
            // Bloco do Agente (Persona + Balão)
            <div key={index} className="agent-message-block">
              <AgentPersona />
              <div className={`message-bubble type-${msg.type}`}> 
                <p>{msg.content}</p>
                
                {msg.actions && msg.actions.length > 0 && (
                  <div className="action-buttons">
                    {msg.actions.map(action => (
                      <button 
                        key={action.value} 
                        onClick={() => sendMessage(action.value)}
                        className={action.value.startsWith("reject") ? "reject" : ""}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
                
                {msg.type === 'final' && msg.file_path && (
                  <p><strong>Download:</strong> {msg.file_path}</p>
                )}
              </div>
            </div>
          )
        ))}
        
        {isAgentResponding && <TypingIndicator />}
        
        {error && (
            <div className="agent-message-block">
                <AgentPersona />
                <div className="message-bubble type-error">
                    <p>{error}</p>
                </div>
            </div>
        )}

        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-wrapper">
        <div className="chat-input">
          <input 
            type="text" 
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isConnected ? "Digite seu resumo aqui..." : (isConnecting ? "Conectando ao chat..." : "Desconectado")}
            disabled={!isConnected}
          />
          <button onClick={handleSend} disabled={!isConnected}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Página principal que decide qual componente mostrar
 */
const ChatPage: React.FC = () => {
  const { sessionId, status } = useSession();

  // --- MUDANÇA PRINCIPAL AQUI ---
  if (sessionId && status === "connected") {
    // 1. Se a sessão está conectada, renderize o ChatWindow (tela inteira)
    return <ChatWindow />;
  }

  // 2. Se não, renderize o formulário DENTRO do container centralizado
  return (
    <div className="app-container">
      <StartSessionForm />
    </div>
  );
  // --- FIM DA MUDANÇA ---
};

export default ChatPage;