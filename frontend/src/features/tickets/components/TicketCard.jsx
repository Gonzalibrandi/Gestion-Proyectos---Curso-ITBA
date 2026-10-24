import React from 'react';
import styles from './TicketCard.module.css';

export const TicketCard = ({ ticket }) => {
  const priorityColors = {
    low: 'var(--text-secondary)',
    medium: 'var(--accent-color)',
    high: 'var(--danger-color)',
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{ticket.title}</span>
        <span
          className={styles.priority}
          style={{ color: priorityColors[ticket.priority] || priorityColors.medium }}
        >
          {ticket.priority === 'low' ? 'Baja' : ticket.priority === 'medium' ? 'Media' : 'Alta'}
        </span>
      </div>
      {ticket.description && <p className={styles.description}>{ticket.description}</p>}
    </div>
  );
};
