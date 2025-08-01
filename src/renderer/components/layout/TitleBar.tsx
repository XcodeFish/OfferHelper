import React from 'react';
import { Minus, X, Settings } from 'lucide-react';
import { useAppStore } from '../../store';

interface TitleBarProps {
  title: string;
  onMinimize?: () => void;
  onClose?: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({ 
  title, 
  onMinimize, 
  onClose 
}) => {
  const { setCurrentView } = useAppStore();

  const handleMinimize = () => {
    window.electron?.window?.minimize();
    onMinimize?.();
  };

  const handleClose = () => {
    window.electron?.app?.quit();
    onClose?.();
  };

  const handleSettings = () => {
    console.log('TitleBar: 点击设置按钮');
    console.log('TitleBar: 当前视图:', useAppStore.getState().ui.currentView);
    setCurrentView('settings');
    console.log('TitleBar: 设置视图后:', useAppStore.getState().ui.currentView);
  };

  return (
    <div className="title-bar">
      <div className="title-content">
        <div className="app-icon">🎯</div>
        <span className="app-title">{title}</span>
      </div>

      <div className="window-controls">
        <button
          className="control-btn settings"
          onClick={handleSettings}
          title="设置"
          style={{
            background: 'rgba(71, 85, 105, 0.5)',
            color: '#e2e8f0',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            borderRadius: '4px',
            padding: '4px 8px',
            marginRight: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(71, 85, 105, 0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(71, 85, 105, 0.5)';
          }}
        >
          <Settings size={12} />
        </button>
        <button
          className="control-btn minimize"
          onClick={handleMinimize}
          title="最小化"
        >
          <Minus size={12} />
        </button>
        <button
          className="control-btn close"
          onClick={handleClose}
          title="关闭"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;