import styles from './Header.module.css'

type HeaderProps = {
  onTriggerUpload: () => void
  canUpload: boolean
  onLogout: () => void
}

const avatarSrc = '/Nikki.jpg'

function Header({ onTriggerUpload, canUpload, onLogout }: HeaderProps) {
  return (
    <header className={styles.wrapper}>
      <div className={styles.photoShell}>
        <img src={avatarSrc} alt="Placeholder portrait of Nikki" />
      </div>
      <p className={styles.description}>Nikki - someone I&apos;m learning piece by piece.</p>
      <div className={styles.uploadBlock}>
        <button
          className={`${styles.uploadButton} ${!canUpload ? styles.disabled : ''}`}
          type="button"
          onClick={onTriggerUpload}
          disabled={!canUpload}
        >
          {canUpload ? 'Upload fragment' : 'View only'}
        </button>
        <span className={styles.uploadHint}>
          {canUpload ? 'Drop in voice notes or still frames.' : 'Signed in as viewer.'}
        </span>
        <button type="button" className={styles.logoutButton} onClick={onLogout}>
          Log out
        </button>
      </div>
    </header>
  )
}

export default Header

