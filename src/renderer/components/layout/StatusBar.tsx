import React from 'react';
import { motion } from 'framer-motion';

interface StatusBarProps {
  status: 'idle' | 'listening' | 'analyzing' | 'hidden';
  confidence?: number;
  isOnline: boolean;
  isListening?: boolean;
  isLoading?: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({
  status,
  confidence,
  isOnline
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'listening':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-400/10',
          icon: '🎤',
          text: '正在监听...',
          animation: 'pulse'
        };
      case 'analyzing':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          icon: '🧠',
          text: 'AI分析中...',
          animation: 'spin'
        };
      case 'hidden':
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10',
          icon: '👁‍🗨',
          text: '已隐藏',
          animation: 'none'
        };
      default:
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10',
          icon: '⏸',
          text: '待机中',
          animation: 'none'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 border-t border-white/10">
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor}`}>
          <motion.div
            className={`text-sm ${config.color}`}
            animate={config.animation === 'pulse' ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {config.icon}
          </motion.div>
          <span className={`text-sm font-medium ${config.color}`}>
            {config.text}
          </span>
        </div>

        {confidence && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">置信度:</span>
            <div className="w-16 h-1.5 bg-gray-600 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-400 to-yellow-400"
                initial={{ width: 0 }}
                animate={{ width: `${confidence * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs text-gray-300">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className="text-xs text-gray-400">
          {isOnline ? '在线' : '离线'}
        </span>
      </div>
    </div>
  );
};

export default StatusBar;