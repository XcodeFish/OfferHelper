import React from 'react';
import { useAppStore } from '../../store';
import QuestionDisplay from '../features/QuestionDisplay';
import AnswerPanel from '../features/AnswerPanel';
import KnowledgeBase from '../features/KnowledgeBase';
import Settings from '../features/Settings';

// 定义MainContent组件
const MainContent: React.FC = () => {
  const { speech, ai, ui, setCurrentView } = useAppStore();

  const renderContent = () => {
    switch (ui.currentView) {
      case 'settings':
        return (
          <div className="w-full h-full">
            <Settings onBack={() => setCurrentView('main')} />
          </div>
        );
      case 'knowledge':
        return <KnowledgeBase onBack={() => setCurrentView('main')} />;
      case 'main':
      default:
        return (
          <div className="space-y-4">
            <QuestionDisplay
              question={speech.currentQuestion}
              isListening={speech.isListening}
              interimResult={speech.interimResult}
            />

            {ai.currentResponse && (
              <AnswerPanel
                response={ai.currentResponse}
                isLoading={ai.isAnalyzing}
                onCopy={() => {
                  if (ai.currentResponse) {
                    navigator.clipboard.writeText(ai.currentResponse.answer);
                  }
                }}
                onRegenerate={() => {
                  // TODO: 实现重新生成功能
                  console.log('重新生成回答');
                }}
                onClose={() => {
                  useAppStore.getState().setCurrentResponse(null);
                }}
              />
            )}

            {ai.isAnalyzing && !ai.currentResponse && (
              <div className="loading-panel p-6 text-center bg-white/5 border border-white/10 rounded-xl">
                <div className="loading-spinner animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">AI正在分析问题...</p>
              </div>
            )}

            {!ai.currentResponse && !ai.isAnalyzing && !speech.currentQuestion && (
              <div className="welcome-panel p-6 text-center bg-white/5 border border-white/10 rounded-xl">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-white mb-2">欢迎使用 OfferHelper</h3>
                <p className="text-gray-400 mb-4">您的专业面试AI助手</p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>• 点击"开始面试"按钮开始识别面试官问题</p>
                  <p>• AI将为您生成专业的回答建议</p>
                  <p>• 使用知识库管理您的面试知识点</p>
                  <p>• 在设置中配置个性化选项</p>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="main-content flex-1 p-4 space-y-4 overflow-y-auto">
      {renderContent()}
    </div>
  );
};

// 导出组件（同时支持命名导出和默认导出）
export { MainContent };
export default MainContent;