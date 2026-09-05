import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function Logo({
  size = 'md',
  showText = true,
  to = '/',
  className = '',
  animated = true,
  theme = 'light'
}) {
  const sizeMap = {
    xs: {
      emblem: 'h-6 w-auto',
      textRaabta: 'text-sm font-black',
      textAi: 'text-sm font-extrabold',
      gap: 'gap-1.5'
    },
    sm: {
      emblem: 'h-8 w-auto',
      textRaabta: 'text-base font-black',
      textAi: 'text-base font-extrabold',
      gap: 'gap-2'
    },
    md: {
      emblem: 'h-9 w-auto',
      textRaabta: 'text-lg sm:text-xl font-black',
      textAi: 'text-lg sm:text-xl font-extrabold',
      gap: 'gap-2.5'
    },
    lg: {
      emblem: 'h-11 w-auto',
      textRaabta: 'text-2xl font-black',
      textAi: 'text-2xl font-extrabold',
      gap: 'gap-3'
    },
    xl: {
      emblem: 'h-14 w-auto',
      textRaabta: 'text-3xl font-black',
      textAi: 'text-3xl font-extrabold',
      gap: 'gap-3.5'
    }
  }

  const currentSize = sizeMap[size] || sizeMap.md

  const content = (
    <div className={`inline-flex items-center ${currentSize.gap} select-none ${className}`}>
      {/* Official Emblem */}
      <div className="shrink-0 flex items-center justify-center">
        <img
          src="/favicon.svg"
          alt="Raabta AI Emblem"
          className={`${currentSize.emblem} object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-xs`}
          loading="eager"
        />
      </div>

      {/* Official Typography */}
      {showText && (
        <div className="flex items-center tracking-wider leading-none">
          <span
            className={`tracking-tight transition-colors duration-200 ${
              theme === 'dark' ? 'text-white' : 'text-[#083344]'
            } ${currentSize.textRaabta}`}
          >
            RAABTA
          </span>
          <span
            className={`ml-1 tracking-tight text-emerald-600 transition-colors duration-200 ${currentSize.textAi}`}
          >
            AI
          </span>
        </div>
      )}
    </div>
  )

  const MotionWrapper = animated ? motion.div : 'div'
  const motionProps = animated
    ? {
        initial: { opacity: 0, y: -4 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
      }
    : {}

  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
        aria-label="Raabta AI Home"
      >
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
