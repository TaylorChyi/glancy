import { cloneElement, isValidElement } from 'react'
import styles from './FormField.module.css'

function FormField({ label, id, children, className = '' }) {
  const cls = [styles.field, className].filter(Boolean).join(' ')
  const content =
    isValidElement(children) && !children.props.id
      ? cloneElement(children, { id })
      : children
  return (
    <div className={cls}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      {content}
    </div>
  )
}

export default FormField
