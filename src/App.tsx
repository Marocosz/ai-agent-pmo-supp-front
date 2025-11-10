import './App.css'
import ChatPage from './pages/ChatPage' // 1. Importa nossa página

function App() {
  // Retorna APENAS o ChatPage.
  // O ChatPage agora decide se mostra o formulário (centralizado)
  // ou o chat (tela inteira).
  return (
    <ChatPage />
  )
}

export default App