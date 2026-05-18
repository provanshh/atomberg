export type Role = "employee" | "manager" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  designation: string;
  managerId?: string | null;
  avatar?: string;
  createdAt: string;
}

export type UoMType = "numeric" | "percentage" | "timeline" | "zero-based";
export type GoalStatus = "draft" | "submitted" | "approved" | "rejected" | "rework";
export type ProgressStatus = "not-started" | "on-track" | "at-risk" | "completed";
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export interface Goal {
  id: string;
  employeeId: string;
  thrustArea: string;
  title: string;
  description: string;
  uomType: UoMType;
  target: number;
  achievement: number;
  weightage: number;
  progressPercentage: number;
  status: GoalStatus;
  progressStatus: ProgressStatus;
  isLocked: boolean;
  isShared: boolean;
  sharedGoalId?: string | null;
  managerComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckIn {
  id: string;
  goalId: string;
  quarter: Quarter;
  plannedTarget: number;
  actualAchievement: number;
  status: ProgressStatus;
  managerComment?: string;
  checkinDate: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  actionType: string;
  moduleName: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export type NotificationType =
  | "submit"
  | "approve"
  | "reject"
  | "reminder"
  | "escalation"
  | "shared";

export interface AppNotification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Cycle {
  id: string;
  phaseName: string;
  startDate: string;
  endDate: string;
  status: "active" | "upcoming" | "closed";
}
