import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function Logo({
  size = 'md',
  showText = true,
  to = '/',
  className = '',
  animated = true
}) {
  const sizeMap = {
    xs: { img: 'w-6 h-6', text: 'text-sm', badge: 'text-[9px] px-1 py-0.5' },
    sm: { img: 'w-8 h-8', text: 'text-base', badge: 'text-[10px] px-1.5 py-0.5' },
    md: { img: 'w-9 h-9', text: 'text-lg', badge: 'text-[10px] px-1.5 py-0.5' },
    lg: { img: 'w-11 h-11', text: 'text-xl', badge: 'text-xs px-2 py-0.5' },
    xl: { img: 'w-14 h-14', text: 'text-2xl', badge: 'text-xs px-2.5 py-1' }
  }

  const currentSize = sizeMap[size] || sizeMap.md

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className={`relative shrink-0 ${currentSize.img} rounded-xl overflow-hidden p-0.5 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent border border-white/10 flex items-center justify-center shadow-sm`}>
        <img
          src="/favicon.svg"
          alt="Raabta AI Logo"
          className="w-full h-full object-contain filter drop-shadow"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tight text-white ${currentSize.text}`}>
            Raabta
          </span>
          <span className={`font-extrabold uppercase rounded-md bg-gradient-to-r from-indigo-500 to-cyan-400 text-white shadow-sm shadow-indigo-500/25 ${currentSize.badge}`}>
            AI
          </span>
        </div>
      )}
    </div>
  )

  const MotionWrapper = animated ? motion.div : 'div'
  const motionProps = animated
    ? {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
      }
    : {}

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg">
        <MotionWrapper {...motionProps}>
          {content}
        </MotionWrapper>
      </Link>
    )
  }

  return (
    <MotionWrapper {...motionProps}>
      {content}
    </MotionWrapper>
  )
}
