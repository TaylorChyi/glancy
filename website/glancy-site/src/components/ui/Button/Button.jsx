import React from 'react'
import styles from './Button.module.css'

function Button({ className = '', children, ...props }) {
  return (
    <button className={`${styles.button} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}

export default Button
