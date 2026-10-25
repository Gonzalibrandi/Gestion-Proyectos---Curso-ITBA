import React from 'react';
import styles from './BoardDetail.module.css';
import { ColumnView } from '../../columns/components/ColumnView';

export const BoardDetail = ({ board }) => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{board.name}</h1>
        <p>{board.description}</p>
      </header>
      <div className={styles.board}>
        {board.columns?.map(col => (
          <ColumnView key={col._id} column={col} />
        ))}
      </div>
    </div>
  );
};
