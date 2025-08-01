import React from 'react';
import { motion } from 'framer-motion';
import TitleBar from './TitleBar';
import StatusBar from './StatusBar';
import ControlPanel from './ControlPanel';
import QuestionDisplay from '../features/QuestionDisplay';
import AnswerPanel from '../features/AnswerPanel';
import { useAppStore } from '../../store';

const MainLayout: React.FC = () => {
  const { ui, speech, ai } = useAppStore();

  return (
    <div className="app-container">
      <TitleBar title="OfferHelper" />
      
      <div className="content-area">
        <StatusBar 
          status={speech.isListening ? 'listening' : ai.isAnalyzing ? 'analyzing' : 'idle'}
          isOnline={true}
          confidence={ai.currentResponse?.confidence}
        />

        <QuestionDisplay
          question={speech.currentQuestion}
          isListening={speech.isListening}
          interimResult={speech.interimResult}
        />

        {ai.currentResponse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AnswerPanel
              response={ai.currentResponse}
              isLoading={ai.isAnalyzing}
              onCopy={() => {}}
              onRegenerate={() => {}}
              onClose={() => {}}
            />
          </motion.div>
        )}

        <ControlPanel
          onSettingsClick={() => {}}
          onKnowledgeClick={() => {}}
        />
      </div>
    </div>
  );
};

export default MainLayout;