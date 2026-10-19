import axios from 'axios'
import { ApiError } from './ApiError'
import { clearSession, getSession } from './session'

const LOGIN_PATH = '/auth/login'
const NETWORK_ERROR_MESSAGE = 'No se pudo conectar con el servidor'

// Única instancia de Axios de la app (requerimientos.md §7.1)
export const httpClient = axios.create({
  // La URL base sale EXCLUSIVAMENTE de la variable de entorno
  baseURL: import.meta.env.VITE_API_URL,
  // El plan gratuito de Render puede tardar ~50 s en despertar: nunca menos de 60 s (§11.2)
  timeout: 90_000,
})

// Callback para reaccionar a un 401 fuera del login (lo registra AuthProvider en la Fase 4)
let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

// Interceptor de petición: identifica al usuario actual con el header X-User-Id
httpClient.interceptors.request.use((config) => {
  const session = getSession()
  if (session?._id) {
    config.headers.set('X-User-Id', session._id)
  }
  return config
})

// Interceptor de respuesta: transforma cualquier fallo en un ApiError { status, message }
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Sin respuesta del servidor: falla de red, CORS o timeout
    if (!error.response) {
      return Promise.reject(new ApiError(0, NETWORK_ERROR_MESSAGE))
    }

    const { status, data } = error.response
    const message = typeof data?.error === 'string' ? data.error : `Error inesperado del servidor (${status})`

    // 401 fuera del login: la sesión ya no es válida, se borra y se avisa para volver a /login
    if (status === 401 && error.config?.url !== LOGIN_PATH) {
      clearSession()
      unauthorizedHandler?.()
    }

    return Promise.reject(new ApiError(status, message))
  },
)
