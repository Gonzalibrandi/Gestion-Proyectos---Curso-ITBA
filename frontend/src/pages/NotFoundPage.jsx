import React from 'react';
import styles from './NotFoundPage.module.css';
import { Button } from '../components/Button';

const NotFoundPage = () => {
  return (
    <div className={styles.container}>
      <h1>404</h1>
      <p>Página no encontrada</p>
      <Button variant="primary" onClick={() => window.location.href = '/boards'}>
        Volver a Tableros
      </Button>
    </div>
  );
};

export default NotFoundPage;
