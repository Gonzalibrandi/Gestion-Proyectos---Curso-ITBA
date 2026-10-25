import React from 'react';
import styles from './Button.module.css';

export const Button = ({ children, variant = 'primary', disabled = false, ...props }) => {
  return (
    <button
      className={`${styles.btn} ${styles[variant]}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
