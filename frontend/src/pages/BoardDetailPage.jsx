import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { boardService } from '../api/boardService';
import { BoardDetail } from '../features/boards/components/BoardDetail';
import { Spinner } from '../components/Spinner';
import { useCreateColumn, useDeleteColumn } from '../features/columns/hooks';
import { useCreateTicket, useDeleteTicket } from '../features/tickets/hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { columnSchema, ticketSchema } from '../features/tickets/schemas';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import styles from './BoardDetailPage.module.css';

const BoardDetailPage = () => {
  const { boardId } = useParams();
  const [modalType, setModalType] = useState(null); // 'column' | 'ticket'
  const [activeColumnId, setActiveColumnId] = useState(null);

  const { data: board, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => boardService.getBoardById(boardId),
  });

  const { mutate: createColumn } = useCreateColumn(boardId);
  const { mutate: deleteColumn } = useDeleteColumn(boardId);
  const { mutate: createTicket } = useCreateTicket(boardId); // Necesitará columnId en el call
  const { mutate: deleteTicket } = useDeleteTicket(boardId);

  const { register: regCol, handleSubmit: submitCol, reset: resetCol, formState: { errors: errCol } } = useForm({
    resolver: zodResolver(columnSchema),
  });

  const { register: regTck, handleSubmit: submitTck, reset: resetTck, formState: { errors: errTck } } = useForm({
    resolver: zodResolver(ticketSchema),
  });

  const handleCreateColumn = (data) => {
    createColumn(data, { onSuccess: () => setModalType(null) });
    resetCol();
  };

  const handleCreateTicket = (data) => {
    createTicket({ columnId: activeColumnId, ...data }, { onSuccess: () => setModalType(null) });
    resetTck();
  };

  if (isLoading) return <div className={styles.center}><Spinner /></div>;

  return (
    <div className={styles.page}>
      <div style={{ padding: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1>{board?.name}</h1>
          <p>{board?.description}</p>
        </div>
        <Button variant="primary" onClick={() => setModalType('column')}>Añadir Columna</Button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-6)', overflowX: 'auto' }}>
        {board?.columns?.map(col => (
          <div key={col._id} style={{ minWidth: '300px', background: 'var(--bg-primary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <h3>{col.name}</h3>
              <Button variant="danger" size="small" onClick={() => {
                if(window.confirm('¿Eliminar columna?')) deleteColumn({ columnId: col._id });
              }}>×</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {col.tickets?.map(t => (
                <div key={t._id} style={{ background: 'var(--bg-card)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', position: 'relative' }}>
                  <strong>{t.title}</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.description}</p>
                  <Button
                    variant="danger"
                    style={{ position: 'absolute', right: '5px', top: '5px', fontSize: '0.7rem', padding: '2px 5px' }}
                    onClick={() => deleteTicket({ columnId: col._id, ticketId: t._id })}
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              style={{ marginTop: 'var(--space-4)', width: '100%' }}
              onClick={() => { setActiveColumnId(col._id); setModalType('ticket'); }}
            >
              + Ticket
            </Button>
          </div>
        ))}
      </div>

      {modalType === 'column' && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Nueva Columna</h2>
            <form onSubmit={submitCol(handleCreateColumn)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input label="Nombre" {...regCol('name')} error={errCol.name?.message} />
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
                <Button type="submit" variant="primary">Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === 'ticket' && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Nuevo Ticket</h2>
            <form onSubmit={submitTck(handleCreateTicket)} style={{ display: 'flex', flexDirection: 'column', gap: ' ', gap: '1rem' }}>
              <Input label="Título" {...regTck('title')} error={errTck.title?.message} />
              <Input label="Descripción" {...regTck('description')} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem' }}>Prioridad</label>
                <select {...regTck('priority')} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
                <Button type="submit" variant="primary">Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardDetailPage;
