import ThemeIcon from '@/components/ui/Icon'
import styles from './ChatInput.module.css'

/**
 * Chat input field with dual submit/voice behaviour.
 * When the field is empty the button acts as a voice trigger
 * instead of submitting the form.
 */
function ChatInput({ value, onChange, onSubmit, onVoice, inputRef, placeholder }) {
  const isEmpty = value.trim() === ''

  const handleClick = (e) => {
    if (isEmpty && onVoice) {
      e.preventDefault()
      onVoice()
    }
  }

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
      <button
        type={isEmpty ? 'button' : 'submit'}
        className={styles.button}
        onClick={handleClick}
      >
        {isEmpty ? (
          <ThemeIcon name="voice-button" alt="voice" className={styles.icon} />
        ) : (
          <ThemeIcon name="send-button" alt="send" className={styles.icon} />
        )}
      </button>
    </form>
  )
}

export default ChatInput
