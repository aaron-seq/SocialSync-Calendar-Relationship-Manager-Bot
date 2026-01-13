import { motion } from 'framer-motion'
import { ContactPlanet } from './contact-planet'
import { Sparkles } from 'lucide-react'

interface Contact {
  id: string
  fullName: string
  nickname?: string
  avatarUrl?: string
  healthScore: number
  intimacyLevel: number
  relationType: string
}

interface OrbitViewProps {
  contacts: Contact[]
  onContactClick?: (contact: Contact) => void
}

export function OrbitView({ contacts, onContactClick }: OrbitViewProps) {
  // Generate orbit rings based on intimacy levels
  const orbitRings = [
    { distance: 120, label: 'Inner Circle' },
    { distance: 200, label: 'Close Friends' },
    { distance: 280, label: 'Friends' },
    { distance: 360, label: 'Acquaintances' },
  ]
  
  return (
    <div className="relative w-full h-[600px] flex items-center justify-center">
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at center, transparent 0%, transparent 50%, rgba(167, 139, 250, 0.1) 100%)`,
        }}
      />
      
      {/* Orbit Rings */}
      {orbitRings.map((ring, i) => (
        <motion.div
          key={i}
          className="orbit-ring"
          style={{
            width: ring.distance * 2,
            height: ring.distance * 2,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
        />
      ))}
      
      {/* Center - The User (Sun) */}
      <motion.div
        className="relative z-10 w-20 h-20 rounded-full bg-gradient-neon flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        whileHover={{ scale: 1.1 }}
      >
        <Sparkles className="w-8 h-8 text-white" />
        
        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-neon-violet/30 blur-xl -z-10" />
        
        {/* Pulse Ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-neon-violet"
          animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
      
      {/* Contact Planets */}
      {contacts.map((contact, index) => (
        <ContactPlanet
          key={contact.id}
          contact={contact}
          index={index}
          totalContacts={contacts.length}
          onClick={() => onContactClick?.(contact)}
        />
      ))}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-card p-4 rounded-xl">
        <h4 className="text-xs font-medium text-moon-dust mb-2">Orbit Legend</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full bg-cyber-emerald" />
            <span className="text-moon-dust">Healthy (70%+)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full bg-solar-amber" />
            <span className="text-moon-dust">Needs Attention (40-69%)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full bg-toxic-rose animate-pulse" />
            <span className="text-moon-dust">Critical (&lt;40%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
