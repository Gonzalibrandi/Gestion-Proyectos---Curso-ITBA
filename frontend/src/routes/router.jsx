import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import BoardsListPage from '../pages/BoardsListPage';
import BoardDetailPage from '../pages/BoardDetailPage';
import NotFoundPage from '../pages/NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/boards" replace /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/boards',
    element: (
      <ProtectedRoute>
        <BoardsListPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/boards/:boardId',
    element: (
      <ProtectedRoute>
        <BoardDetailPage />
      </ProtectedRoute>
    )
  },
  { path: '*', element: <NotFoundPage /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;

// Helper internal to fix the redirect
function Navigate({ to, replace }) {
  React.useEffect(() => {
    window.location.href = to;
  }, [to]);
  return null;
}
