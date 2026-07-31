import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  defaultStorefrontSettings,
  getStorefrontSettings,
  storefrontSettingsKey,
  type StorefrontSettings,
} from "@/services/store-settings";

const StorefrontSettingsContext = createContext<StorefrontSettings>(defaultStorefrontSettings);

export function StorefrontSettingsProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    queryKey: storefrontSettingsKey,
    queryFn: getStorefrontSettings,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
  const settings = data ?? defaultStorefrontSettings;

  return (
    <StorefrontSettingsContext.Provider value={settings}>
      {children}
    </StorefrontSettingsContext.Provider>
  );
}

export function useStorefrontSettings() {
  return useContext(StorefrontSettingsContext);
}
