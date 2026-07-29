import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Bell, HeartCrack, MessageSquare, BellRing, Check } from 'lucide-react'
import type { Contact } from '@/types'
import type { DraftWithContext } from '@/types'

interface NotificationBellProps {
  /** Contacts whose health has dropped into the danger band. */
  criticalContacts: Contact[]
  /** Drafts sitting in the review queue. */
  pendingDrafts: DraftWithContext[]
}

type Permission = 'default' | 'granted' | 'denied' | 'unsupported'

function readPermission(): Permission {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

/**
 * Notification bell with a real dropdown.
 *
 * Shows what actually needs attention — contacts whose health has decayed and
 * drafts awaiting review — and lets the user grant browser notification
 * permission, which is what useReminders needs to fire event reminders.
 */
export function NotificationBell({ criticalContacts, pendingDrafts }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [permission, setPermission] = useState<Permission>(readPermission)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const total = criticalContacts.length + pendingDrafts.length

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  const go = (path: string) => {
    setIsOpen(false)
    navigate(path)
  }

  return (
    <div className="relative" ref={containerRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(open => !open)}
        aria-label={
          total > 0
            ? `Notifications, ${total} ${total === 1 ? 'item needs' : 'items need'} attention`
            : 'Notifications'
        }
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="relative p-2 rounded-xl hover:bg-white/5 transition-colors"
      >
        <Bell className="w-5 h-5 text-moon-dust" />
        {total > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[1.05rem] h-[1.05rem] px-1 rounded-full bg-toxic-rose text-[0.625rem] font-bold text-white flex items-center justify-center">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-h-[26rem] overflow-y-auto rounded-2xl border border-white/10 bg-void-slate/95 backdrop-blur-xl shadow-2xl z-50"
          >
            <div className="px-4 py-3 border-b border-white/5">
              <h2 className="text-sm font-display font-semibold text-starlight">Notifications</h2>
            </div>

            {total === 0 && (
              <p className="px-4 py-6 text-sm text-moon-dust text-center">
                Nothing needs your attention.
              </p>
            )}

            {pendingDrafts.length > 0 && (
              <button
                role="menuitem"
                onClick={() => go('/review')}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
              >
                <MessageSquare className="w-4 h-4 mt-0.5 text-neon-violet flex-shrink-0" />
                <span>
                  <span className="block text-sm text-starlight">
                    {pendingDrafts.length} draft{pendingDrafts.length === 1 ? '' : 's'} awaiting review
                  </span>
                  <span className="block text-xs text-moon-dust">Open the War Room</span>
                </span>
              </button>
            )}

            {criticalContacts.map(contact => (
              <button
                key={contact.id}
                role="menuitem"
                onClick={() => go('/contacts')}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
              >
                <HeartCrack className="w-4 h-4 mt-0.5 text-toxic-rose flex-shrink-0" />
                <span>
                  <span className="block text-sm text-starlight">{contact.fullName}</span>
                  <span className="block text-xs text-moon-dust">
                    Health at {contact.healthScore}% — reach out soon
                  </span>
                </span>
              </button>
            ))}

            {permission !== 'unsupported' && (
              <div className="border-t border-white/5 px-4 py-3">
                {permission === 'granted' && (
                  <p className="flex items-center gap-2 text-xs text-cyber-emerald">
                    <Check className="w-3.5 h-3.5" /> Browser notifications enabled
                  </p>
                )}
                {permission === 'denied' && (
                  <p className="text-xs text-moon-dust">
                    Browser notifications are blocked. Re-enable them in your browser&rsquo;s site settings.
                  </p>
                )}
                {permission === 'default' && (
                  <button
                    onClick={requestPermission}
                    className="flex items-center gap-2 text-xs text-neon-violet hover:text-starlight transition-colors"
                  >
                    <BellRing className="w-3.5 h-3.5" /> Enable browser notifications
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
