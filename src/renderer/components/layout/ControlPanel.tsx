import React from 'react';
import { useAppStore } from '../../store';
import { speechService } from '../../services/SpeechService';

interface ControlPanelProps {
  onSettingsClick?: () => void;
  onKnowledgeClick?: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onSettingsClick,
  onKnowledgeClick
}) => {
  const { speech, setCurrentView } = useAppStore();

  const handleToggleListening = () => {
    speechService.toggleListening();
  };

  const handleHide = () => {
    if (window.electron?.window) {
      window.electron.window.hide();
    }
  };

  const handleSettings = () => {
    console.log('点击设置按钮，当前视图:', useAppStore.getState().ui.currentView);
    setCurrentView('settings');
    console.log('设置视图后，当前视图:', useAppStore.getState().ui.currentView);
    onSettingsClick?.();
  };

  const handleKnowledge = () => {
    console.log('点击知识库按钮，当前视图:', useAppStore.getState().ui.currentView);
    setCurrentView('knowledge');
    console.log('设置视图后，当前视图:', useAppStore.getState().ui.currentView);
    onKnowledgeClick?.();
  };

  return (
    <div className="control-panel p-4 border-t border-gray-700">
      <div className="flex flex-col gap-3">
        {/* 主要控制按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleToggleListening}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-base ${
              speech.isListening
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {speech.isListening ? '🛑 停止面试' : '🎤 开始面试'}
          </button>
        </div>

        {/* 次要控制按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleKnowledge}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors min-h-[44px]"
            title="知识库"
          >
            📚 知识库
          </button>
          
          <button
            onClick={handleSettings}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors min-h-[44px]"
            title="设置"
          >
            ⚙️ 设置
          </button>
          
          <button
            onClick={handleHide}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors min-h-[44px]"
            title="隐藏助手"
          >
            👁️ 隐藏
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;