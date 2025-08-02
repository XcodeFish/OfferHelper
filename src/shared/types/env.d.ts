declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    ELECTRON_IS_DEV: string;
    AI_API_BASE_URL: string;
    TENCENT_CLOUD_ASR_URL: string;
    LOG_LEVEL: string;
    AUTO_UPDATE_URL: string;
    
    // 腾讯云实时语音识别配置
    TENCENT_SECRET_ID: string;
    TENCENT_SECRET_KEY: string;
    TENCENT_APP_ID: string;
    TENCENT_ASR_ENGINE_MODEL_TYPE: string;
    TENCENT_ASR_VOICE_FORMAT: string;
    TENCENT_ASR_HOTWORD_ID?: string;
    TENCENT_ASR_CUSTOMIZATION_ID?: string;
    TENCENT_ASR_FILTER_DIRTY: string;
    TENCENT_ASR_FILTER_MODAL: string;
    TENCENT_ASR_FILTER_PUNC: string;
    TENCENT_ASR_CONVERT_NUM_MODE: string;
    TENCENT_ASR_WORD_INFO: string;
    TENCENT_ASR_VAD_SILENCE_TIME: string;
    TENCENT_ASR_NOISE_THRESHOLD: string;
    TENCENT_ASR_MAX_SPEAK_TIME: string;
  }
}