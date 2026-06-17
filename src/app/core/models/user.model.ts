export enum UserRole {
  GUEST = 'GUEST',
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  CRAFTSMAN = 'CRAFTSMAN',
  ADMIN = 'ADMIN'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISABLED = 'DISABLED'
}

export interface User {
  id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  createdAt: Date;
  phone?: string;
  city?: string;
  address?: string;
  profileImageUrl?: string;
}
