import { ReactNode } from "react";

export interface ChatBotConfig {
  name?: string;
  chatbot_name?: string;
  flow_json?: string;
  env?: string;
}

// The shape of the data hook
export interface UseChatBotConfigResult {
  data: ChatBotConfig | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: any;
  update: (data: Partial<ChatBotConfig>) => Promise<void>;
}

export interface BackendProviderProps {
  children: ReactNode;
}