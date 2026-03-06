import React from 'react'

interface NamiIconProps {
  size?: number
  animated?: boolean
  className?: string
}

const NamiIcon: React.FC<NamiIconProps> = ({ size = 100, animated = false, className = '' }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-full border-4 border-white shadow-xl ${className}`}
      style={{
        width: size,
        height: size,
        animation: animated ? 'float 3s ease-in-out infinite' : 'none'
      }}
    >
      <img
        src="/icon/nami_icon.png"
        alt="Nami"
        className="w-full h-full object-cover"
      />

      {/* 法式裝飾邊框 */}
      <div className="absolute inset-0 border-[6px] border-blue-400/10 rounded-full pointer-events-none"></div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
      `}</style>
    </div>
  )
}

export default NamiIcon
