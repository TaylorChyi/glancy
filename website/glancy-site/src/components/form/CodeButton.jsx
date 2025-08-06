import { useState, useEffect } from 'react'
import styles from './AuthForm.module.css'

// button with 60s countdown after click

function CodeButton({ onClick }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (count === 0) return undefined
    const id = setInterval(() => {
      setCount((c) => c - 1)
    }, 1000)
    return () => clearInterval(id)
  }, [count])

  const handleClick = () => {
    if (onClick) onClick()
    setCount(60)
  }

  return (
    <button
      type="button"
      className={styles['code-btn']}
      disabled={count > 0}
      onClick={handleClick}
    >
      {count > 0 ? `${count}s` : 'Get code'}
    </button>
  )
}

export default CodeButton
