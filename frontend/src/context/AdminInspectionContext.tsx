import { createContext, useContext, useMemo, useState } from 'react';

interface AdminInspectionState {
  inspectionMode: boolean;
  inspectedUserId: string | null;
  inspectedUserEmail: string | null;
  startInspection: (id: string, email: string) => void;
  endInspection: () => void;
}

const Ctx = createContext<AdminInspectionState | null>(null);

export function AdminInspectionProvider({ children }: { children: any }) {
  const [inspectionMode, setMode] = useState(false);
  const [inspectedUserId, setId] = useState<string | null>(null);
  const [inspectedUserEmail, setEmail] = useState<string | null>(null);

  const startInspection = (id: string, email: string) => {
    setMode(true);
    setId(id);
    setEmail(email);
  };
  const endInspection = () => {
    setMode(false);
    setId(null);
    setEmail(null);
  };

  const value = useMemo(() => ({ inspectionMode, inspectedUserId, inspectedUserEmail, startInspection, endInspection }), [inspectionMode, inspectedUserId, inspectedUserEmail]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminInspection() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAdminInspection must be used within AdminInspectionProvider');
  return ctx;
}
