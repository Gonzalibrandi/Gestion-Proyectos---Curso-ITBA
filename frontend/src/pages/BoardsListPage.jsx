import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { boardSchema } from '../features/tickets/schemas';
import { useCreateBoard, useDeleteBoard } from '../features/boards/hooks';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import styles from './BoardsListPage.module.css';
import { Spinner } from '../components/Spinner';
import { useQuery } from '@tanstack/react-query';
import { boardService } from '../api/boardService';
import { useNavigate } from 'react-router-dom';

const BoardsListPage = () => {
  const [showModal, setShowModal] = useState(false);
  const { mutate: createBoard } = useCreateBoard();
  const { mutate: deleteBoard, isPending: isDeleting } = useDeleteBoard();
  const navigate = useNavigate();

  const { data: boards, isLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: boardService.getBoards,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(boardSchema),
  });

  const onSubmit = (data) => {
    createBoard(data, {
      onSuccess: () => setShowModal(false)
    });
    reset();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Mis Tableros</h1>
        <Button variant="primary" onClick={() => setShowModal(true)}>Crear Tablero</Button>
      </header>

      {isLoading ? (
        <div className={styles.center}><Spinner /></div>
      ) : (
        <div className={styles.grid}>
          {boards?.map(board => (
            <div key={board._id} className={styles.card}>
              <h3>{board.name}</h3>
              <p>{board.description || 'Sin descripción'}</p>
              <div className={styles.actions}>
                <Button variant="secondary" onClick={() => navigate(`/boards/${board._id}`)}>Abrir</Button>
                <Button
                  variant="danger"
                  disabled={isDeleting}
                  onClick={() => {
                    if(window.confirm('¿Eliminar tablero? Se borrarán todas sus columnas y tickets.')) {
                      deleteBoard(board._id);
                    }
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Nuevo Tablero</h2>
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input label="Nombre" {...register('name')} error={errors.name?.message} />
              <Input label="Descripción" {...register('description')} />
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button type="submit" variant="primary">Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardsListPage;
