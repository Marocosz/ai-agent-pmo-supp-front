import type { ISessionStartRequest, ISessionStartResponse } from "../types/chat.types";

// Pega a URL da API do .env do frontend (criaremos este .env depois)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8005";

/**
 * Chama o endpoint HTTP para iniciar uma nova sessão de chat.
 * @param startData Os dados iniciais (codificação, título, etc.)
 * @returns O session_id e a mensagem de boas-vindas.
 */
export const startSession = async (
  startData: ISessionStartRequest
): Promise<ISessionStartResponse> => {
  
  const response = await fetch(`${API_URL}/v1/session/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(startData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Falha ao iniciar a sessão.");
  }

  return response.json();
};