import React from 'react';
import styles from './ColumnView.module.css';
import { TicketCard } from '../../tickets/components/TicketCard';

export const ColumnView = ({ column }) => {
  return (
    <div className={styles.column}>
      <h3 className={styles.title}>{column.name}</h3>
      <div className={styles.ticketList}>
        {column.tickets?.map(ticket => (
          <TicketCard key={ticket._id} ticket={ticket} />
        ))}
      </div>
    </div>
  );
};
