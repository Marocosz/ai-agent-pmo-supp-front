import './App.css'
import ChatPage from './pages/ChatPage'

function App() {
  return (
    // O 'className' "app-container" não está no CSS,
    // mas o '#root' em index.css já está centralizando o conteúdo.
    // Esta é a estrutura correta.
    <ChatPage />
  )
}

export default App