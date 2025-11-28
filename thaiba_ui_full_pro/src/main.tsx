import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './routes/App'
import './styles/globals.css'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { NotificationProvider } from './context/NotificationContext'
import { TaskProvider } from './context/TaskContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <TaskProvider>
            <App />
          </TaskProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
)
