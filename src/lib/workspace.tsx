import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./api";
import type { Chatbot, MeFeatures } from "./types";

type WorkspaceValue = {
  features: MeFeatures | null;
  refreshFeatures: () => Promise<void>;
  bots: Chatbot[] | null;
  reloadBots: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState<MeFeatures | null>(null);
  const [bots, setBots] = useState<Chatbot[] | null>(null);

  const refreshFeatures = useCallback(async () => {
    try { setFeatures((await api.get("/me/features")).data); } catch { /* optional */ }
  }, []);
  const reloadBots = useCallback(async () => {
    try { setBots((await api.get("/chatbots")).data); } catch { setBots([]); }
  }, []);

  useEffect(() => { refreshFeatures(); reloadBots(); }, [refreshFeatures, reloadBots]);

  const value = useMemo(() => ({ features, refreshFeatures, bots, reloadBots }), [features, refreshFeatures, bots, reloadBots]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}
