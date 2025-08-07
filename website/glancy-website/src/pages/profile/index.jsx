import { useState, useEffect } from 'react'
import '@/pages/App/App.css'
import styles from './Profile.module.css'
import Avatar from '@/components/ui/Avatar'
import { useLanguage } from '@/context'
import MessagePopup from '@/components/ui/MessagePopup'
import AgeStepper from '@/components/form/AgeStepper/AgeStepper.jsx'
import GenderSelect from '@/components/form/GenderSelect/GenderSelect.jsx'
import EditableField from '@/components/form/EditableField/EditableField.jsx'
import { useApi } from '@/hooks'
import { useUser } from '@/context'
import { cacheBust } from '@/utils/url.js'
import ThemeIcon from '@/components/ui/Icon'
import Tooltip from '@/components/ui/Tooltip'

function Profile({ onCancel }) {
  const { t } = useLanguage()
  const { user: currentUser, setUser } = useUser()
  const api = useApi()
  const [username, setUsername] = useState(currentUser?.username || '')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [phone, setPhone] = useState(currentUser?.phone || '')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [interests, setInterests] = useState('')
  const [goal, setGoal] = useState('')
  const [avatar, setAvatar] = useState('')
  const [popupOpen, setPopupOpen] = useState(false)
  const [popupMsg, setPopupMsg] = useState('')

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return
    const preview = URL.createObjectURL(file)
    setAvatar(preview)
    try {
      const data = await api.users.uploadAvatar({
        userId: currentUser.id,
        file,
        token: currentUser.token
      })
      const url = cacheBust(data.avatar)
      setAvatar(url)
      setUser({ ...currentUser, avatar: url })
    } catch (err) {
      console.error(err)
      setPopupMsg(t.fail)
      setPopupOpen(true)
    } finally {
      URL.revokeObjectURL(preview)
    }
  }

  useEffect(() => {
    if (!currentUser) return
    api.profiles
      .fetchProfile({ userId: currentUser.id, token: currentUser.token })
      .then((data) => {
        setAge(data.age)
        setGender(data.gender)
        setInterests(data.interest)
        setGoal(data.goal)
        if (data.avatar) {
          const url = cacheBust(data.avatar)
          setAvatar(url)
        }
      })
      .catch((err) => {
        console.error(err)
        setPopupMsg(t.fail)
        setPopupOpen(true)
      })
  }, [api, t, currentUser])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!currentUser) return
    await api.profiles.saveProfile({
      userId: currentUser.id,
      token: currentUser.token,
      profile: {
        age,
        gender,
        job: '',
        interest: interests,
        goal
      }
    })
    setPopupMsg(t.updateSuccess)
    setPopupOpen(true)
  }


  return (
    <div className="app">
      <h2>{t.profileTitle}</h2>
      <form onSubmit={handleSave} className={styles['profile-card']}>
        <div className={styles['avatar-area']}>
          {avatar && typeof avatar === 'string' ? (
            <img src={avatar} alt="avatar" />
          ) : (
            <Avatar width={100} height={100} style={{ borderRadius: '20px' }} />
          )}
          <span className={styles['avatar-hint']}>{t.avatarHint}</span>
          <input
            type="file"
            onChange={handleAvatarChange}
            style={{ position: 'absolute', inset: 0, opacity: 0 }}
          />
        </div>
        <EditableField
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t.usernamePlaceholder}
          inputClassName={styles['username-input']}
          buttonText={t.editButton}
        />
        <EditableField
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailPlaceholder}
          inputClassName={styles['email-input']}
          buttonText={t.editButton}
        />
        <EditableField
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t.phonePlaceholder}
          inputClassName={styles['phone-input']}
          buttonText={t.editButton}
        />
        <div className={styles.basic}>
          <div className={styles.item}>
            <ThemeIcon name="cake" className={styles.icon} width={20} height={20} />
            <span>{t.ageLabel}</span>
            <AgeStepper value={age} onChange={setAge} />
            <Tooltip text={t.ageHelp}>?</Tooltip>
          </div>
          <div className={styles.item}>
            <ThemeIcon name="user" className={styles.icon} width={20} height={20} />
            <span>{t.genderLabel}</span>
            <GenderSelect value={gender} onChange={setGender} />
            <Tooltip text={t.genderHelp}>?</Tooltip>
          </div>
          <div className={styles.item}>
            <ThemeIcon name="star-outline" className={styles.icon} width={20} height={20} />
            <span>{t.interestsLabel}</span>
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder={t.interestsPlaceholder}
            />
            <Tooltip text={t.interestsHelp}>?</Tooltip>
          </div>
          <div className={styles.item}>
            <ThemeIcon name="target" className={styles.icon} width={20} height={20} />
            <span>{t.goalLabel}</span>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={t.goalPlaceholder}
            />
            <Tooltip text={t.goalHelp}>?</Tooltip>
          </div>
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles['save-btn']}>
            {t.saveButton}
          </button>
          <button type="button" className={styles['cancel-btn']} onClick={onCancel}>
            {t.cancelButton}
          </button>
        </div>
      </form>
      <MessagePopup
        open={popupOpen}
        message={popupMsg}
        onClose={() => setPopupOpen(false)}
      />
    </div>
  )
}

export default Profile
