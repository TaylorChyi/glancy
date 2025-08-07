import ThemeIcon from '@/components/ui/Icon'
import styles from './ChatInput.module.css'

function ChatInput({ value, onChange, onSubmit, inputRef, placeholder }) {
  return (
    <form className={styles.container} onSubmit={onSubmit}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={styles.input}
      />
      <button type="submit" className={styles.button}>
        {value.trim() === '' ? (
          <ThemeIcon name="voice-button" alt="voice" className={styles.icon} />
        ) : (
          <ThemeIcon name="send-button" alt="send" className={styles.icon} />
        )}
      </button>
    </form>
  )
}

export default ChatInput
