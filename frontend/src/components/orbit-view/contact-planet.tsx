import { motion } from 'framer-motion'
import { cn, getHealthColor, calculateOrbitDistance } from '@/lib/utils'

interface Contact {
  id: string
  fullName: string
  nickname?: string
  avatarUrl?: string
  healthScore: number
  intimacyLevel: number
  relationType: string
}

interface ContactPlanetProps {
  contact: Contact
  index: number
  totalContacts: number
  onClick?: () => void
}

export function ContactPlanet({ contact, index, totalContacts, onClick }: ContactPlanetProps) {
  const isCritical = contact.healthScore < 40
  const healthColor = getHealthColor(contact.healthScore)
  const orbitDistance = calculateOrbitDistance(contact.healthScore, contact.intimacyLevel)
  
  // Calculate position on orbit
  const angle = (index / totalContacts) * 360
  const angleRad = (angle * Math.PI) / 180
  
  // Size based on intimacy (more intimate = larger)
  const size = 48 + (contact.intimacyLevel * 3)
  
  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: `calc(50% + ${Math.cos(angleRad) * orbitDistance}px)`,
        top: `calc(50% + ${Math.sin(angleRad) * orbitDistance}px)`,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.15, zIndex: 50 }}
      onClick={onClick}
    >
      {/* Planet Body */}
      <div
        className={cn(
          'w-full h-full rounded-full flex items-center justify-center',
          'backdrop-blur-md bg-glass-layer/60 border-2 transition-all duration-300',
          isCritical 
            ? 'border-toxic-rose shadow-neon-rose' 
            : healthColor === 'high'
              ? 'border-cyber-emerald/50'
              : 'border-moon-dust/30'
        )}
      >
        {contact.avatarUrl ? (
          <img
            src={contact.avatarUrl}
            alt={contact.fullName}
            className="w-full h-full rounded-full object-cover opacity-90"
          />
        ) : (
          <span className="text-sm font-bold text-starlight">
            {(contact.nickname || contact.fullName).charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      
      {/* Critical Pulsing Ring */}
      {isCritical && (
        <motion.div
          className="absolute inset-0 rounded-full border border-toxic-rose"
          animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Hover Tooltip */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 -top-12 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100"
        initial={{ opacity: 0, y: 5 }}
        whileHover={{ opacity: 1, y: 0 }}
      >
        <div className="glass-card px-3 py-1.5 rounded-lg text-sm">
          <span className="font-medium text-starlight">
            {contact.nickname || contact.fullName}
          </span>
          <span className={cn(
            'ml-2 text-xs',
            healthColor === 'high' ? 'text-cyber-emerald' :
            healthColor === 'medium' ? 'text-solar-amber' : 'text-toxic-rose'
          )}>
            {contact.healthScore}%
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
