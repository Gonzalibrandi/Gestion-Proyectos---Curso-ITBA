import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ThemeToggle } from '../components/ThemeToggle'
import { LoginForm } from '../features/auth/components/LoginForm'
import { useLogin } from '../features/auth/hooks/useLogin'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { user, login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const loginMutation = useLogin()
  const navigate = useNavigate()
  const location = useLocation()

  // Ruta original guardada por ProtectedRoute (o /boards por defecto)
  const from = location.state?.from?.pathname || '/boards'

  // Con sesión activa no tiene sentido mostrar el login
  if (user) return <Navigate to={from} replace />

  const handleSubmit = (credentials) => {
    loginMutation.mutate(credentials, {
      onSuccess: (loggedUser) => {
        login(loggedUser)
        toast.success(`Hola, ${loggedUser.name}`)
        navigate(from, { replace: true })
      },
      // El 401 se muestra dentro del formulario; el resto de los errores, en un Toast (§8)
      onError: (error) => {
        if (error.status !== 401) toast.error(error.message)
      },
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>
      <section className={styles.card}>
        <header className={styles.header}>
          <span className={styles.brand}>
            kanban<span className={styles.accent}>/</span>itba
          </span>
          <h1 className={styles.title}>Iniciar sesión</h1>
        </header>
        <LoginForm onSubmit={handleSubmit} isSubmitting={loginMutation.isPending} serverError={loginMutation.error} />
      </section>
    </div>
  )
}
