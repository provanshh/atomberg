import type { AppNotification, AuditLog, CheckIn, Goal, GoalStatus, ProgressStatus, Role, UoMType, User, NotificationType } from "./types";

const API_BASE = "http://localhost:8080";

function progressStatusFor(pct: number): ProgressStatus {
  if (pct >= 100) return "completed";
  if (pct >= 60) return "on-track";
  if (pct > 0) return "at-risk";
  return "not-started";
}

export function mapUser(b: any): User {
  if (!b) return null as any;
  return {
    id: String(b.id),
    name: b.name,
    email: b.email,
    role: (b.role || "EMPLOYEE").toLowerCase() as Role,
    department: b.department || "",
    designation: b.designation || "",
    managerId: b.manager_id ? String(b.manager_id) : null,
    avatar: b.avatar_url || "",
    createdAt: b.created_at ? new Date(b.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

export function mapGoal(b: any): Goal {
  const uomMapBack: Record<string, UoMType> = {
    MIN: "numeric",
    MAX: "percentage",
    TIMELINE: "timeline",
    ZERO_BASED: "zero-based",
  };
  return {
    id: String(b.id),
    employeeId: String(b.employee_id),
    thrustArea: b.thrust_area,
    title: b.title,
    description: b.description || "",
    uomType: uomMapBack[b.uom_type] || "numeric",
    target: b.target_value,
    achievement: b.achievement_value || 0,
    weightage: b.weightage,
    progressPercentage: b.progress_percentage || 0,
    status: (b.status || "DRAFT").toLowerCase() as GoalStatus,
    progressStatus: progressStatusFor(b.progress_percentage || 0),
    isLocked: b.is_locked || false,
    isShared: false,
    managerComment: b.manager_comment || "",
    createdAt: b.created_at || new Date().toISOString(),
    updatedAt: b.updated_at || new Date().toISOString(),
  };
}

export function mapGoalForBackend(f: Partial<Goal>) {
  const uomMapSend: Record<string, string> = {
    numeric: "MIN",
    percentage: "MAX",
    timeline: "TIMELINE",
    "zero-based": "ZERO_BASED",
  };
  const body: any = {};
  if (f.thrustArea !== undefined) body.thrust_area = f.thrustArea;
  if (f.title !== undefined) body.title = f.title;
  if (f.description !== undefined) body.description = f.description || "";
  if (f.uomType !== undefined) body.uom_type = uomMapSend[f.uomType] || "MIN";
  if (f.target !== undefined) body.target_value = Number(f.target);
  if (f.achievement !== undefined) body.achievement_value = Number(f.achievement);
  if (f.weightage !== undefined) body.weightage = Number(f.weightage);
  return body;
}

export function mapCheckIn(b: any): CheckIn {
  const statusMapBack: Record<string, ProgressStatus> = {
    NOT_STARTED: "not-started",
    ON_TRACK: "on-track",
    COMPLETED: "completed",
  };
  return {
    id: String(b.id),
    goalId: String(b.goal_id),
    quarter: b.quarter,
    plannedTarget: b.planned_target,
    actualAchievement: b.actual_achievement || 0,
    status: statusMapBack[b.status] || "on-track",
    managerComment: b.manager_comment || "",
    checkinDate: b.created_at || new Date().toISOString(),
  };
}

export function mapCheckInForBackend(f: any) {
  const statusMapSend: Record<string, string> = {
    "not-started": "NOT_STARTED",
    "on-track": "ON_TRACK",
    "at-risk": "ON_TRACK",
    completed: "COMPLETED",
  };
  return {
    goal_id: Number(f.goalId),
    quarter: f.quarter,
    planned_target: Number(f.plannedTarget),
    actual_achievement: Number(f.actualAchievement || 0),
    employee_comment: f.employeeComment || "Quarterly check-in update",
    status: statusMapSend[f.status] || "ON_TRACK",
  };
}

export function mapNotification(b: any): AppNotification {
  return {
    id: String(b.id),
    recipientId: String(b.recipient_id),
    type: (b.type || "submit").toLowerCase() as NotificationType,
    title: b.title,
    message: b.message,
    read: b.read || false,
    createdAt: b.created_at || new Date().toISOString(),
  };
}

export function mapAuditLog(b: any): AuditLog {
  return {
    id: String(b.id),
    userId: String(b.user_id),
    actionType: b.action_type,
    moduleName: b.module_name,
    oldValue: b.old_value || "",
    newValue: b.new_value || "",
    timestamp: b.timestamp || new Date().toISOString(),
  };
}

class APIClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("goalsync_access_token");
      this.refreshToken = localStorage.getItem("goalsync_refresh_token");
    }
  }

  setTokens(access: string | null, refresh: string | null) {
    this.accessToken = access;
    this.refreshToken = refresh;
    if (typeof window !== "undefined") {
      if (access) localStorage.setItem("goalsync_access_token", access);
      else localStorage.removeItem("goalsync_access_token");

      if (refresh) localStorage.setItem("goalsync_refresh_token", refresh);
      else localStorage.removeItem("goalsync_refresh_token");
    }
  }

  getAccessToken() {
    return this.accessToken;
  }

  getRefreshToken() {
    return this.refreshToken;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    } as Record<string, string>;

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.refreshToken && endpoint !== "/auth/login" && endpoint !== "/auth/refresh") {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Refresh-Token": this.refreshToken,
          },
        });
        if (refreshRes.ok) {
          const body = await refreshRes.json();
          const { access_token, refresh_token } = body.data;
          this.setTokens(access_token, refresh_token);

          headers["Authorization"] = `Bearer ${access_token}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          if (!retryResponse.ok) {
            const errBody = await retryResponse.json().catch(() => ({}));
            throw new Error(errBody.message || "Request failed after token refresh");
          }
          const resJson = await retryResponse.json();
          return resJson.data;
        } else {
          this.setTokens(null, null);
          throw new Error("Session expired. Please log in again.");
        }
      } catch (err) {
        this.setTokens(null, null);
        throw err;
      }
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.message || `HTTP error ${response.status}`);
    }

    const resJson = await response.json();
    return resJson.data;
  }

  get<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  post<T>(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: "DELETE", headers });
  }
}

export const api = new APIClient();
