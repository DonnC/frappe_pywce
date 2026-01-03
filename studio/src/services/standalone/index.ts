import { useState, useEffect, useCallback } from "react";
import { ChatBotConfig, UseChatBotConfigResult } from "../types";
import { toast } from "sonner";

const STORAGE_KEY = "pywce_local_config";

export const useChatBotConfig = (): UseChatBotConfigResult => {
  const [data, setData] = useState<ChatBotConfig>();
  const [isLoading, setIsLoading] = useState(true);

  // Load from LocalStorage on mount
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setData(JSON.parse(stored));
      } else {
        setData({ chatbot_name: "My LocalBot", flow_json: "" });
      }
    } catch (e) {
      console.error("Failed to load local config", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update LocalStorage
  const update = async (newData: Partial<ChatBotConfig>) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const updated = { ...data, ...newData };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setData(updated);
        resolve();
      }, 500);
    });
  };

  return {
    data,
    isLoading,
    isValidating: false,
    error: null,
    update,
    mutate: async () => fetchData(),
  };
};

// Export the provider wrapper
export { default as BackendProvider } from "./provider";