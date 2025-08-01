import React from 'react';
import { motion } from 'framer-motion';

interface QuestionDisplayProps {
  question: string;
  isListening: boolean;
  interimResult?: string;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  isListening,
  interimResult
}) => {
  return (
    <motion.div
      className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          📝 面试官问题
        </h3>
        <div className="flex gap-2">
          <button
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="复制问题"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="清除问题"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="min-h-[60px] flex items-center">
        {question ? (
          <div className="text-gray-200 leading-relaxed">
            {question}
          </div>
        ) : isListening ? (
          <div className="text-blue-400 italic flex items-center gap-2">
            {interimResult || '正在监听面试官提问...'}
            <motion.span
              className="inline-block w-0.5 h-5 bg-blue-400"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>
        ) : (
          <div className="text-gray-500 text-center w-full">
            点击"开始面试"按钮开始识别面试官问题
          </div>
        )}
      </div>

      {isListening && (
        <div className="flex items-center justify-center gap-1 mt-4">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-blue-400 rounded-full"
              animate={{
                height: [4, 20, 4],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default QuestionDisplay;