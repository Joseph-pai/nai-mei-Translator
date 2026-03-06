import React from 'react'

interface NamiIconProps {
  size?: number
  className?: string
  animated?: boolean
}

export const NamiIcon: React.FC<NamiIconProps> = ({ 
  size = 64, 
  className = '', 
  animated = false 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ 
        animation: animated ? 'wave 2s ease-in-out infinite' : 'none'
      }}
    >
      {/* 奈美的頭部 */}
      <circle cx="50" cy="35" r="18" fill="#FDBCB4" stroke="#8B7355" strokeWidth="1"/>
      
      {/* 髮型 - 短髮瀏海 */}
      <path
        d="M 32 30 Q 35 20, 50 18 Q 65 20, 68 30 Q 66 25, 50 23 Q 34 25, 32 30"
        fill="#4A4A4A"
        stroke="#2C2C2C"
        strokeWidth="1"
      />
      
      {/* 眼睛 */}
      <circle cx="42" cy="33" r="2" fill="#2C2C2C"/>
      <circle cx="58" cy="33" r="2" fill="#2C2C2C"/>
      
      {/* 微笑 */}
      <path
        d="M 45 40 Q 50 43, 55 40"
        stroke="#E74C3C"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* 身體 - 簡約連衣裙 */}
      <path
        d="M 35 50 Q 50 48, 65 50 L 63 85 Q 50 88, 37 85 Z"
        fill="#E8B4B8"
        stroke="#C97C80"
        strokeWidth="1"
      />
      
      {/* 裝飾 - 領結 */}
      <circle cx="50" cy="52" r="3" fill="#F39C12"/>
      
      {/* 手臂 - 揮手姿勢 */}
      <path
        d="M 65 55 Q 75 50, 80 45"
        stroke="#FDBCB4"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        style={{ 
          transformOrigin: '65px 55px',
          animation: animated ? 'wave-hand 1s ease-in-out infinite' : 'none'
        }}
      />
      
      <path
        d="M 35 55 Q 25 58, 20 62"
        stroke="#FDBCB4"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* 動畫定義 */}
      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes wave-hand {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }
      `}</style>
    </svg>
  )
}

export default NamiIcon
