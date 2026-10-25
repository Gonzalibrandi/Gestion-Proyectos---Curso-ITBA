import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import BoardsListPage from '../pages/BoardsListPage'
import BoardDetailPage from '../pages/BoardDetailPage'
import NotFoundPage from '../pages/NotFoundPage'
import { ProtectedRoute } from './ProtectedRoute'
import { AppLayout } from './AppLayout'

// Matriz de rutas de la SPA (requerimientos.md §5)
const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/boards" replace /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/boards', element: <BoardsListPage /> },
          { path: '/boards/:boardId', element: <BoardDetailPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

export const AppRouter = () => <RouterProvider router={router} />
