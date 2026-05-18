import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AppNotification, AuditLog, CheckIn, Cycle, Goal, User } from "./types";
import { seedCycles } from "./mock-data";
import {
  api,
  mapUser,
  mapGoal,
  mapGoalForBackend,
  mapCheckIn,
  mapCheckInForBackend,
  mapNotification,
  mapAuditLog,
} from "./api";

interface AppState {
  users: User[];
  goals: Goal[];
  checkIns: CheckIn[];
  notifications: AppNotification[];
  audit: AuditLog[];
  cycles: Cycle[];
  currentUserId: string | null;
}

interface AppContextValue extends AppState {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  signup: (data: {
    name: string;
    email: string;
    role: User["role"];
    department: string;
    designation: string;
    password?: string;
  }) => Promise<User>;
  setCurrentUser: (id: string) => void;
  addGoal: (
    g: Omit<Goal, "id" | "createdAt" | "updatedAt" | "progressPercentage" | "progressStatus">,
  ) => Goal;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  submitGoals: (employeeId: string) => void;
  approveGoal: (id: string, comment?: string) => void;
  rejectGoal: (id: string, comment: string) => void;
  requestRework: (id: string, comment: string) => void;
  unlockGoal: (id: string) => void;
  addCheckIn: (c: Omit<CheckIn, "id" | "checkinDate">) => void;
  markAllNotificationsRead: () => void;
  pushAudit: (entry: Omit<AuditLog, "id" | "timestamp">) => void;
  pushNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function calcProgress(g: Pick<Goal, "uomType" | "target" | "achievement">): number {
  const { uomType, target, achievement } = g;
  if (uomType === "zero-based") return achievement === 0 ? 100 : 0;
  if (uomType === "timeline") {
    if (!target) return 0;
    return Math.min(100, Math.round((achievement / target) * 100));
  }
  if (!target) return 0;
  const pct = (achievement / target) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function progressStatusFor(pct: number): Goal["progressStatus"] {
  if (pct >= 100) return "completed";
  if (pct >= 60) return "on-track";
  if (pct > 0) return "at-risk";
  return "not-started";
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    users: [],
    goals: [],
    checkIns: [],
    notifications: [],
    audit: [],
    cycles: seedCycles,
    currentUserId: null,
  });

  const [loading, setLoading] = useState(true);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state],
  );

  const syncData = useCallback(async (userId: string, role: string) => {
    try {
      // 1. Fetch current user profile
      const rawProfile = await api.get<unknown>("/users/profile");
      const loggedInUser = mapUser(rawProfile);

      // 2. Fetch goals
      const rawMyGoals = await api.get<unknown[]>("/goals/my-goals");
      const allGoals = rawMyGoals.map(mapGoal);

      if (role === "manager" || role === "admin") {
        try {
          const rawTeamGoals = await api.get<unknown[]>("/goals/team-goals");
          const teamGoalsMapped = rawTeamGoals.map(mapGoal);
          // Combine goals avoiding duplicates
          const seen = new Set(allGoals.map((g) => g.id));
          teamGoalsMapped.forEach((g) => {
            if (!seen.has(g.id)) {
              allGoals.push(g);
              seen.add(g.id);
            }
          });
        } catch (e) {
          console.warn("Failed to fetch team goals:", e);
        }
      }

      // 3. Fetch checkins
      const rawMyCheckins = await api.get<unknown[]>("/checkins/my-checkins");
      const allCheckIns = rawMyCheckins.map(mapCheckIn);

      if (role === "manager" || role === "admin") {
        try {
          const rawTeamCheckins = await api.get<unknown[]>("/checkins/team");
          const teamCheckinsMapped = rawTeamCheckins.map(mapCheckIn);
          const seen = new Set(allCheckIns.map((c) => c.id));
          teamCheckinsMapped.forEach((c) => {
            if (!seen.has(c.id)) {
              allCheckIns.push(c);
              seen.add(c.id);
            }
          });
        } catch (e) {
          console.warn("Failed to fetch team checkins:", e);
        }
      }

      // 4. Fetch notifications
      let notifications: AppNotification[] = [];
      try {
        const rawNotifications = await api.get<unknown[]>("/notifications");
        notifications = rawNotifications.map(mapNotification);
      } catch (e) {
        console.warn("Failed to fetch notifications:", e);
      }

      // 5. Fetch audit logs if admin
      let auditLogs: AuditLog[] = [];
      if (role === "admin") {
        try {
          const rawAudit = await api.get<unknown[]>("/audit");
          auditLogs = rawAudit.map(mapAuditLog);
        } catch (e) {
          console.warn("Failed to fetch audit logs:", e);
        }
      }

      // 6. Fetch users list
      let usersList: User[] = [loggedInUser];
      try {
        if (role === "admin") {
          const rawUsers = await api.get<unknown[]>("/users/all");
          usersList = rawUsers.map(mapUser);
        } else if (role === "manager") {
          const rawTeam = await api.get<unknown[]>("/users/team");
          const teamMapped = rawTeam.map(mapUser);
          const seen = new Set([loggedInUser.id]);
          usersList = [loggedInUser, ...teamMapped.filter((u) => !seen.has(u.id))];
        }
      } catch (e) {
        console.warn("Failed to fetch users list:", e);
      }

      setState((s) => ({
        ...s,
        users: usersList,
        goals: allGoals,
        checkIns: allCheckIns,
        notifications,
        audit: auditLogs,
        currentUserId: loggedInUser.id,
      }));
    } catch (err) {
      console.error("Backend synchronization failed:", err);
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    const initSession = async () => {
      const access = localStorage.getItem("goalsync_access_token");
      if (access) {
        try {
          const rawProfile = await api.get<unknown>("/users/profile");
          const user = mapUser(rawProfile);
          await syncData(user.id, user.role);
        } catch (err) {
          console.warn("Session restore failed, clearing tokens", err);
          api.setTokens(null, null);
        }
      }
      setLoading(false);
    };
    initSession();
  }, [syncData]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const data = await api.post<unknown>("/auth/login", { email, password });
        const {
          access_token,
          refresh_token,
          user: rawUser,
        } = data as {
          access_token: string;
          refresh_token: string;
          user: unknown;
        };
        api.setTokens(access_token, refresh_token);

        const user = mapUser(rawUser);
        setState((s) => ({
          ...s,
          currentUserId: user.id,
          users: [user, ...s.users.filter((u) => u.id !== user.id)],
        }));
        await syncData(user.id, user.role);
        return user;
      } catch (err) {
        console.error("Login failed:", err);
        throw err;
      }
    },
    [syncData],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout").catch(() => {});
    } finally {
      api.setTokens(null, null);
      setState((s) => ({
        ...s,
        users: [],
        goals: [],
        checkIns: [],
        notifications: [],
        audit: [],
        currentUserId: null,
      }));
    }
  }, []);

  const signup = useCallback(
    async (data: {
      name: string;
      email: string;
      role: User["role"];
      department: string;
      designation: string;
      password?: string;
    }) => {
      try {
        const payload = {
          name: data.name,
          email: data.email,
          password: data.password || "goalsync-demo-pw",
          role: data.role.toUpperCase(),
          department: data.department,
          designation: data.designation,
        };

        // 1. Sign up
        const rawUser = await api.post<unknown>("/auth/signup", payload);
        const user = mapUser(rawUser);

        // 2. Automate login immediately
        await login(data.email, payload.password);
        return user;
      } catch (err) {
        console.error("Signup failed:", err);
        throw err;
      }
    },
    [login],
  );

  const pushAudit = useCallback((entry: Omit<AuditLog, "id" | "timestamp">) => {
    // Keep local representation
    setState((s) => ({
      ...s,
      audit: [{ id: `a-${Date.now()}`, timestamp: new Date().toISOString(), ...entry }, ...s.audit],
    }));
  }, []);

  const pushNotification = useCallback((n: Omit<AppNotification, "id" | "createdAt" | "read">) => {
    setState((s) => ({
      ...s,
      notifications: [
        { id: `n-${Date.now()}`, createdAt: new Date().toISOString(), read: false, ...n },
        ...s.notifications,
      ],
    }));
  }, []);

  const addGoal = useCallback(
    (g: Omit<Goal, "id" | "createdAt" | "updatedAt" | "progressPercentage" | "progressStatus">) => {
      const pct = calcProgress(g);
      const tempId = `g-temp-${Date.now()}`;
      const newGoal: Goal = {
        id: tempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        progressPercentage: pct,
        progressStatus: progressStatusFor(pct),
        ...g,
      };

      // Optimistic local state update
      setState((s) => ({ ...s, goals: [newGoal, ...s.goals] }));
      pushAudit({
        userId: g.employeeId,
        actionType: "CREATE",
        moduleName: "Goals",
        newValue: g.title,
      });

      // Background server call
      (async () => {
        try {
          const payload = mapGoalForBackend(newGoal);
          const rawRes = await api.post<unknown>("/goals/create", payload);
          const savedGoal = mapGoal(rawRes);

          // Swap tempId with actual database ID
          setState((s) => ({
            ...s,
            goals: s.goals.map((x) => (x.id === tempId ? savedGoal : x)),
          }));
        } catch (err) {
          console.error("Failed to create goal in backend:", err);
          // Rollback on failure
          setState((s) => ({ ...s, goals: s.goals.filter((x) => x.id !== tempId) }));
        }
      })();

      return newGoal;
    },
    [pushAudit],
  );

  const updateGoal = useCallback((id: string, patch: Partial<Goal>) => {
    // Optimistic update
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) => {
        if (g.id !== id) return g;
        const merged = { ...g, ...patch, updatedAt: new Date().toISOString() };
        const pct = calcProgress(merged);
        return { ...merged, progressPercentage: pct, progressStatus: progressStatusFor(pct) };
      }),
    }));

    // Background server call
    (async () => {
      try {
        const payload = mapGoalForBackend(patch);
        const rawRes = await api.patch<unknown>(`/goals/update/${id}`, payload);
        const updated = mapGoal(rawRes);

        setState((s) => ({
          ...s,
          goals: s.goals.map((x) => (x.id === id ? updated : x)),
        }));
      } catch (err) {
        console.error("Failed to update goal in backend:", err);
      }
    })();
  }, []);

  const deleteGoal = useCallback((id: string) => {
    // Optimistic update
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));

    // Background server call
    (async () => {
      try {
        await api.delete(`/goals/delete/${id}`);
      } catch (err) {
        console.error("Failed to delete goal in backend:", err);
      }
    })();
  }, []);

  const submitGoals = useCallback(
    (employeeId: string) => {
      // Optimistic update
      setState((s) => ({
        ...s,
        goals: s.goals.map((g) =>
          g.employeeId === employeeId && g.status === "draft" ? { ...g, status: "submitted" } : g,
        ),
      }));
      pushAudit({ userId: employeeId, actionType: "SUBMIT", moduleName: "Goals" });

      // Background server call
      (async () => {
        try {
          await api.post("/goals/submit");
          // Refetch goals to verify exact state
          const raw = await api.get<unknown[]>("/goals/my-goals");
          setState((s) => ({ ...s, goals: raw.map(mapGoal) }));
        } catch (err) {
          console.error("Failed to submit goals in backend:", err);
        }
      })();
    },
    [pushAudit],
  );

  const approveGoal = useCallback(
    (id: string, comment?: string) => {
      // Optimistic update
      setState((s) => ({
        ...s,
        goals: s.goals.map((g) =>
          g.id === id ? { ...g, status: "approved", isLocked: true, managerComment: comment } : g,
        ),
      }));
      pushAudit({
        userId: state.currentUserId ?? "system",
        actionType: "APPROVE",
        moduleName: "Goals",
        newValue: "approved",
      });

      // Background server call
      (async () => {
        try {
          await api.post(`/goals/approve/${id}`, { comment });
        } catch (err) {
          console.error("Failed to approve goal in backend:", err);
        }
      })();
    },
    [state.currentUserId, pushAudit],
  );

  const rejectGoal = useCallback(
    (id: string, comment: string) => {
      // Optimistic update
      setState((s) => ({
        ...s,
        goals: s.goals.map((g) =>
          g.id === id ? { ...g, status: "rejected", managerComment: comment } : g,
        ),
      }));
      pushAudit({
        userId: state.currentUserId ?? "system",
        actionType: "REJECT",
        moduleName: "Goals",
        newValue: "rejected",
      });

      // Background server call
      (async () => {
        try {
          await api.post(`/goals/reject/${id}`, { comment });
        } catch (err) {
          console.error("Failed to reject goal in backend:", err);
        }
      })();
    },
    [state.currentUserId, pushAudit],
  );

  const requestRework = useCallback((id: string, comment: string) => {
    // Optimistic update
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) =>
        g.id === id ? { ...g, status: "rework", managerComment: comment } : g,
      ),
    }));

    // Background server call
    (async () => {
      try {
        await api.post(`/goals/rework/${id}`, { comment });
      } catch (err) {
        console.error("Failed to request rework in backend:", err);
      }
    })();
  }, []);

  const unlockGoal = useCallback(
    (id: string) => {
      // Optimistic update
      setState((s) => ({
        ...s,
        goals: s.goals.map((g) => (g.id === id ? { ...g, isLocked: false, status: "draft" } : g)),
      }));
      pushAudit({
        userId: state.currentUserId ?? "system",
        actionType: "UNLOCK",
        moduleName: "Goals",
      });

      // Background server call
      (async () => {
        try {
          await api.post(`/goals/unlock/${id}`);
        } catch (err) {
          console.error("Failed to unlock goal in backend:", err);
        }
      })();
    },
    [state.currentUserId, pushAudit],
  );

  const addCheckIn = useCallback(
    (c: Omit<CheckIn, "id" | "checkinDate">) => {
      const tempId = `c-temp-${Date.now()}`;
      const checkIn: CheckIn = {
        id: tempId,
        checkinDate: new Date().toISOString(),
        ...c,
      };

      // Optimistic update
      setState((s) => ({
        ...s,
        checkIns: [checkIn, ...s.checkIns],
        goals: s.goals.map((g) => {
          if (g.id !== c.goalId) return g;
          const merged = {
            ...g,
            achievement: c.actualAchievement,
            updatedAt: new Date().toISOString(),
          };
          const pct = calcProgress(merged);
          return { ...merged, progressPercentage: pct, progressStatus: progressStatusFor(pct) };
        }),
      }));
      pushAudit({
        userId: state.currentUserId ?? "system",
        actionType: "CHECKIN",
        moduleName: "CheckIns",
        newValue: `${c.quarter}: ${c.actualAchievement}`,
      });

      // Background server call
      (async () => {
        try {
          const payload = mapCheckInForBackend(checkIn);
          const rawRes = await api.post<unknown>("/checkins/create", payload);
          const saved = mapCheckIn(rawRes);

          setState((s) => ({
            ...s,
            checkIns: s.checkIns.map((x) => (x.id === tempId ? saved : x)),
          }));
        } catch (err) {
          console.error("Failed to save checkin in backend:", err);
        }
      })();
    },
    [state.currentUserId, pushAudit],
  );

  const markAllNotificationsRead = useCallback(() => {
    // Optimistic update
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) =>
        n.recipientId === s.currentUserId ? { ...n, read: true } : n,
      ),
    }));

    // Background server call
    (async () => {
      try {
        await api.post("/notifications/mark-read");
      } catch (err) {
        console.error("Failed to mark notifications read in backend:", err);
      }
    })();
  }, [state.currentUserId]);

  const value: AppContextValue = {
    ...state,
    currentUser,
    loading,
    login,
    logout,
    signup,
    setCurrentUser: (id) => setState((s) => ({ ...s, currentUserId: id })),
    addGoal,
    updateGoal,
    deleteGoal,
    submitGoals,
    approveGoal,
    rejectGoal,
    requestRework,
    unlockGoal,
    addCheckIn,
    markAllNotificationsRead,
    pushAudit,
    pushNotification,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
