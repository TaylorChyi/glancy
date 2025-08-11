import { useId } from 'react'
import styles from './FormField.module.css'

function LabeledSelect({ label, value, onChange, options }) {
  const id = useId()
  const opts = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )
  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {opts.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default LabeledSelect
