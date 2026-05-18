import type {
  AppNotification,
  AuditLog,
  CheckIn,
  Goal,
  GoalStatus,
  ProgressStatus,
  Role,
  UoMType,
  User,
  NotificationType,
} from "./types";

const API_BASE = "http://localhost:8080";

type BackendRecord = Record<string, unknown>;

function asRecord(value: unknown): BackendRecord | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as BackendRecord;
  }
  return null;
}

function progressStatusFor(pct: number): ProgressStatus {
  if (pct >= 100) return "completed";
  if (pct >= 60) return "on-track";
  if (pct > 0) return "at-risk";
  return "not-started";
}

export function mapUser(b: unknown): User {
  const record = asRecord(b);
  if (!record) return null as unknown as User;
  return {
    id: String(record.id),
    name: String(record.name ?? ""),
    email: String(record.email ?? ""),
    role: String(record.role ?? "EMPLOYEE").toLowerCase() as Role,
    department: String(record.department ?? ""),
    designation: String(record.designation ?? ""),
    managerId: record.manager_id ? String(record.manager_id) : null,
    avatar: String(record.avatar_url ?? ""),
    createdAt: record.created_at
      ? new Date(String(record.created_at)).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  };
}

export function mapGoal(b: unknown): Goal {
  const record = asRecord(b) ?? {};
  const uomMapBack: Record<string, UoMType> = {
    MIN: "numeric",
    MAX: "percentage",
    TIMELINE: "timeline",
    ZERO_BASED: "zero-based",
  };
  return {
    id: String(record.id),
    employeeId: String(record.employee_id),
    thrustArea: String(record.thrust_area ?? ""),
    title: String(record.title ?? ""),
    description: String(record.description ?? ""),
    uomType: uomMapBack[String(record.uom_type)] || "numeric",
    target: Number(record.target_value ?? 0),
    achievement: Number(record.achievement_value ?? 0),
    weightage: Number(record.weightage ?? 0),
    progressPercentage: Number(record.progress_percentage ?? 0),
    status: String(record.status ?? "DRAFT").toLowerCase() as GoalStatus,
    progressStatus: progressStatusFor(Number(record.progress_percentage ?? 0)),
    isLocked: Boolean(record.is_locked),
    isShared: false,
    managerComment: String(record.manager_comment ?? ""),
    createdAt: String(record.created_at ?? new Date().toISOString()),
    updatedAt: String(record.updated_at ?? new Date().toISOString()),
  };
}

export function mapGoalForBackend(f: Partial<Goal>): Record<string, unknown> {
  const uomMapSend: Record<string, string> = {
    numeric: "MIN",
    percentage: "MAX",
    timeline: "TIMELINE",
    "zero-based": "ZERO_BASED",
  };
  const body: Record<string, unknown> = {};
  if (f.thrustArea !== undefined) body.thrust_area = f.thrustArea;
  if (f.title !== undefined) body.title = f.title;
  if (f.description !== undefined) body.description = f.description || "";
  if (f.uomType !== undefined) body.uom_type = uomMapSend[f.uomType] || "MIN";
  if (f.target !== undefined) body.target_value = Number(f.target);
  if (f.achievement !== undefined) body.achievement_value = Number(f.achievement);
  if (f.weightage !== undefined) body.weightage = Number(f.weightage);
  return body;
}

export function mapCheckIn(b: unknown): CheckIn {
  const record = asRecord(b) ?? {};
  const statusMapBack: Record<string, ProgressStatus> = {
    NOT_STARTED: "not-started",
    ON_TRACK: "on-track",
    COMPLETED: "completed",
  };
  return {
    id: String(record.id),
    goalId: String(record.goal_id),
    quarter: String(record.quarter) as CheckIn["quarter"],
    plannedTarget: Number(record.planned_target ?? 0),
    actualAchievement: Number(record.actual_achievement ?? 0),
    status: statusMapBack[String(record.status)] || "on-track",
    managerComment: String(record.manager_comment ?? ""),
    checkinDate: String(record.created_at ?? new Date().toISOString()),
  };
}

type CheckInInput = Partial<CheckIn> & { employeeComment?: string };

export function mapCheckInForBackend(f: CheckInInput): Record<string, unknown> {
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
    status: statusMapSend[f.status || "on-track"] || "ON_TRACK",
  };
}

export function mapNotification(b: unknown): AppNotification {
  const record = asRecord(b) ?? {};
  return {
    id: String(record.id),
    recipientId: String(record.recipient_id),
    type: String(record.type ?? "submit").toLowerCase() as NotificationType,
    title: String(record.title ?? ""),
    message: String(record.message ?? ""),
    read: Boolean(record.read),
    createdAt: String(record.created_at ?? new Date().toISOString()),
  };
}

export function mapAuditLog(b: unknown): AuditLog {
  const record = asRecord(b) ?? {};
  return {
    id: String(record.id),
    userId: String(record.user_id),
    actionType: String(record.action_type ?? ""),
    moduleName: String(record.module_name ?? ""),
    oldValue: String(record.old_value ?? ""),
    newValue: String(record.new_value ?? ""),
    timestamp: String(record.timestamp ?? new Date().toISOString()),
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

    if (
      response.status === 401 &&
      this.refreshToken &&
      endpoint !== "/auth/login" &&
      endpoint !== "/auth/refresh"
    ) {
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

  post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
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
