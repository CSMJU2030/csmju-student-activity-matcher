// ============================================================
// Interest Match - Type Definitions
// ============================================================

export interface InterestCategory {
  id: string;
  name: string;
  icon: string;
  color: string; // tailwind color class
}

export interface Interest {
  id: string;
  name: string;
  categoryId: string;
  icon?: string;
  isCustom?: boolean;
}

export interface LookingForOption {
  id: string;
  label: string;
  icon: string;
}

export interface Student {
  id: string;
  studentId: string; // e.g. "65012345"
  name: string;
  email: string;
  avatar: string;
  faculty: string;
  program: string;
  year: number;
  bio?: string;
  interestIds: string[];
  lookingForIds: string[];
  groupIds: string[];
  activityIds: string[];
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  interestIds: string[];
  creatorId: string;
  memberIds: string[];
  createdAt: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  coverImage: string;
  interestIds: string[];
  creatorId: string;
  participantIds: string[];
  createdAt: string;
}

export interface MatchResult {
  student: Student;
  commonInterests: Interest[];
  matchPercentage: number;
  totalUniqueInterests: number;
}

export interface User {
  id: string;
  email: string;
  role: "student" | "admin";
  studentId?: string;
  name: string;
  avatar: string;
  /** When the Core Hub session token expires (ISO 8601), from /api/v1/me. */
  sessionExpiresAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
}

// Admin insight type
export interface Insight {
  id: string;
  title: string;
  description: string;
  type: "info" | "suggestion" | "warning";
  icon: string;
}
