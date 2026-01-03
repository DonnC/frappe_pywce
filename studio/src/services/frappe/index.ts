import { useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk";
import { ChatBotConfig, UseChatBotConfigResult } from "../types";

const DOC_NAME = "ChatBot Config";

export const useChatBotConfig = (): UseChatBotConfigResult => {
  const { data, error, isLoading, isValidating, mutate } = useFrappeGetDoc<ChatBotConfig>(DOC_NAME, DOC_NAME);
  const { updateDoc } = useFrappeUpdateDoc<ChatBotConfig>();

  const update = async (newData: Partial<ChatBotConfig>) => {
    await updateDoc(DOC_NAME, DOC_NAME, newData);
    await mutate();
  };

  return { data, isLoading, isValidating, error, update };
};

export { default as BackendProvider } from "./provider";