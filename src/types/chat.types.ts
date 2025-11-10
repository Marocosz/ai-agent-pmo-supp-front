// --- Schemas para o Chat (Websocket) ---
// Espelha o 'WsAction' do schemas.py
export interface IWsAction {
  label: string;
  value: string;
}

// Espelha o 'WsMessageOut' do schemas.py
export interface IWsMessage {
  type: "text" | "suggestion" | "final" | "error" | "user"; 
  content: string;
  actions: IWsAction[];
  suggestion_id?: string;
  file_path?: string;
}


// --- Schemas para o Início da Sessão (HTTP) ---
// Espelha o 'SessionStartRequest' do schemas.py
export interface ISessionStartRequest {
  tipo_documento: string;
  codificacao: string;
  titulo_documento: string;
}

// Espelha o 'SessionStartResponse' do schemas.py
export interface ISessionStartResponse {
  session_id: string;
  message: string;
}

// --- Schema para o Estado da Sessão (Frontend) ---
// Define o que vamos guardar no nosso 'contexto'
export interface ISessionContext {
  sessionId: string | null;
  status: "idle" | "connecting" | "connected" | "error";
  error: string | null;
  startSession: (data: ISessionStartRequest) => Promise<void>;
}