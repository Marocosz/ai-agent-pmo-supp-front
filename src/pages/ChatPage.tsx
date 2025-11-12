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

    const handleActionClick = (messageIndex: number, actionValue: string) => {
        // 1. Envia a ação para o backend
        sendMessage(actionValue);

        // 2. Atualiza o estado local das mensagens para desativar os botões
        setMessages((prevMessages) =>
            prevMessages.map((msg, index) => {
                if (index === messageIndex) {
                    // Adiciona a propriedade 'selectedActionValue' à mensagem específica
                    return { ...msg, selectedActionValue: actionValue };
                }
                return msg;
            })
        );
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
                <div className="spinner"></div>
                <span>Digitando...</span>
            </div>
        </div>
    );

    // --- INÍCIO DA MUDANÇA 1: Novo componente indicador ---
    const ProcessingIndicator: React.FC<{ content: string }> = ({ content }) => (
        <div className="typing-indicator"> {/* Reusa a mesma classe de layout */}
            <div className="agent-persona-icon">DC</div>
            <div className="typing-indicator-bubble">
                <div className="spinner"></div>
                {/* Usa o conteúdo da mensagem (ex: "Processando documento...") */}
                <span>{content || "Processando..."}</span>
            </div>
        </div>
    );
    // --- FIM DA MUDANÇA 1 ---

    return (
        <div className="chat-window">
            <div className="chat-header">
                <div className="chat-header-content">
                    <h2>Chat de Geração de Documento</h2>
                </div>
            </div>

            <div className="message-list">
                <div className="message-list-content">
                    
                    {messages.map((msg, index) => (

                        // --- INÍCIO DA MUDANÇA 2: Lógica de renderização ---
                        msg.type === 'user' ? (
                            <div key={index} className="message-bubble type-user">
                                <p>{msg.content}</p>
                            </div>
                        // Novo tipo "processing"
                        ) : msg.type === 'processing' ? (
                            <div key={index} className="agent-message-block">
                                <ProcessingIndicator content={msg.content} />
                            </div>
                        // Tipos restantes do agente
                        ) : (
                        // --- FIM DA MUDANÇA 2 ---
                            <div key={index} className="agent-message-block">
                                <AgentPersona />
                                <div className={`message-bubble type-${msg.type}`}>
                                    <p>{msg.content}</p>

                                    {/* Lógica dos botões (sem mudança) */}
                                    {msg.actions && msg.actions.length > 0 && (
                                        <div className="action-buttons">
                                            {msg.actions.map(action => {
                                                const isSelected = msg.selectedActionValue === action.value;
                                                const isOtherActionClicked = msg.selectedActionValue && !isSelected;

                                                let buttonClass = action.value.startsWith("reject") ? "reject" : "";
                                                if (isOtherActionClicked) {
                                                    buttonClass += " inactive";
                                                }

                                                return (
                                                    <button
                                                        key={action.value}
                                                        onClick={() => handleActionClick(index, action.value)}
                                                        disabled={!!msg.selectedActionValue}
                                                        className={buttonClass.trim()}
                                                    >
                                                        {action.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* --- INÍCIO DA MUDANÇA 3: Link de Download --- */}
                                    {msg.type === 'final' && msg.file_path && (
                                        <div className="download-link">
                                            <p><strong>Download:</strong></p>
                                            <a
                                                // Constrói a URL completa para o endpoint de download
                                                href={`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/v1/download/${msg.file_path}`}
                                                target="_blank" // Abre em nova aba
                                                rel="noopener noreferrer"
                                            >
                                                {msg.file_path} {/* Mostra só o nome do arquivo */}
                                            </a>
                                        </div>
                                    )}
                                    {/* --- FIM DA MUDANÇA 3 --- */}
                                </div>
                            </div>
                        )
                    ))}

                    {isAgentResponding && (
                        <div className="agent-message-block">
                            <TypingIndicator />
                        </div>
                    )}

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
            </div>

            <div className="chat-input-wrapper">
                <div className="chat-input-content">
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
        </div>
    );
};

/**
 * Página principal que decide qual componente mostrar
 */
const ChatPage: React.FC = () => {
    const { sessionId, status } = useSession();

    if (sessionId && status === "connected") {
        return <ChatWindow />;
    }

    // Envolve o formulário no container para centralizá-lo
    return (
        <div className="app-container">
            <StartSessionForm />
        </div>
    );
};

export default ChatPage;