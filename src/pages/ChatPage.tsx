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
        setMessages, // <-- Importante, estamos usando isso agora
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

    // --- INÍCIO DA MUDANÇA ---
    /**
     * Lida com o clique em um botão de ação (ex: Aprovar, Aceitar, Recusar)
     */
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
    // --- FIM DA MUDANÇA ---

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

    return (
        <div className="chat-window">
            <div className="chat-header">
                <div className="chat-header-content">
                    <h2>Chat de Geração de Documento</h2>
                </div>
            </div>

            <div className="message-list">
                <div className="message-list-content">
                    {/* --- INÍCIO DA MUDANÇA: Adicionado 'index' ao map --- */}
                    {messages.map((msg, index) => (

                        msg.type === 'user' ? (
                            <div key={index} className="message-bubble type-user">
                                <p>{msg.content}</p>
                            </div>
                        ) : (
                            <div key={index} className="agent-message-block">
                                <AgentPersona />
                                <div className={`message-bubble type-${msg.type}`}>
                                    <p>{msg.content}</p>

                                    {/* --- INÍCIO DA MUDANÇA: Lógica dos botões atualizada --- */}
                                    {msg.actions && msg.actions.length > 0 && (
                                        <div className="action-buttons">
                                            {msg.actions.map(action => {
                                                // Lógica para classes e disabled
                                                const isSelected = msg.selectedActionValue === action.value;
                                                const isOtherActionClicked = msg.selectedActionValue && !isSelected;

                                                let buttonClass = action.value.startsWith("reject") ? "reject" : "";
                                                if (isOtherActionClicked) {
                                                    buttonClass += " inactive";
                                                }

                                                return (
                                                    <button
                                                        key={action.value}
                                                        // Chama a nova função com o índice da mensagem
                                                        onClick={() => handleActionClick(index, action.value)}
                                                        // Desativa TODOS os botões se UM já foi clicado
                                                        disabled={!!msg.selectedActionValue}
                                                        className={buttonClass.trim()} // Usa a classe dinâmica
                                                    >
                                                        {action.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {/* --- FIM DA MUDANÇA --- */}

                                    {msg.type === 'final' && msg.file_path && (
                                        <p><strong>Download:</strong> {msg.file_path}</p>
                                    )}
                                </div>
                            </div>
                        )
                    ))}
                    {/* --- FIM DA MUDANÇA --- */}

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