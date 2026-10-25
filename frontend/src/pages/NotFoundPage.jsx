import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

const NotFoundPage = () => {
  return (
    <div className={styles.container}>
      <h1>404</h1>
      <p>Página no encontrada</p>
      {/* Navegación pura: acá sí corresponde <Link> (requerimientos.md §5) */}
      <Link to="/boards">Volver a Tableros</Link>
    </div>
  );
};

export default NotFoundPage;
