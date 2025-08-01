import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIResponse {
  answer: string;
  confidence: number;
  keywords: string[];
  category: string;
  suggestions: string[];
}

interface AnswerPanelProps {
  response: AIResponse | null;
  isLoading: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  onClose: () => void;
}

const AnswerPanel: React.FC<AnswerPanelProps> = ({
  response,
  isLoading,
  onCopy,
  onRegenerate,
  onClose
}) => {
  if (isLoading) {
    return (
      <motion.div
        className="bg-white/5 border border-white/10 rounded-xl p-6 mb-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <motion.div
            className="text-2xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            🧠
          </motion.div>
          <span className="text-lg text-gray-300">AI正在分析问题...</span>
        </div>
        <div className="flex justify-center">
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.16
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (!response) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-4"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              💡 建议回答
            </h3>
            <div className="px-2 py-1 bg-gradient-to-r from-green-400/20 to-yellow-400/20 rounded-lg">
              <span className="text-xs font-medium text-green-300">
                置信度: {Math.round(response.confidence * 100)}%
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onCopy}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="复制回答"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={onRegenerate}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="重新生成"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="关闭"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4 p-3 bg-black/20 rounded-lg border-l-4 border-blue-400">
            <div className="text-gray-200 leading-relaxed">
              {response.answer}
            </div>
          </div>

          {response.keywords.length > 0 && (
            <div className="mb-4">
              <span className="text-sm text-gray-400 mb-2 block">关键词:</span>
              <div className="flex flex-wrap gap-2">
                {response.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-400/20 text-blue-300 text-xs rounded-lg border border-blue-400/30"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {response.suggestions.length > 0 && (
            <div>
              <span className="text-sm text-gray-400 mb-2 block">💡 回答建议:</span>
              <ul className="space-y-1">
                {response.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnswerPanel;