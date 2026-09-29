export type Role = 'driver' | 'staff' | 'operator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  phone?: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  plate: string;
  make: string;
  model: string;
  color: string;
  isEV: boolean;
  isDefault: boolean;
}

export type SpaceStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';
export type SpaceType = 'standard' | 'compact' | 'large' | 'ev' | 'accessible';

export interface ParkingSpace {
  id: string;
  facilityId: string;
  floor: string;
  zone: string;
  label: string;
  type: SpaceType;
  status: SpaceStatus;
}

export interface ParkingFacility {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  totalSpaces: number;
  availableSpaces: number;
  reservedSpaces: number;
  occupiedSpaces: number;
  maintenanceSpaces: number;
  hourlyRate: number;
  dailyMax: number;
  rating: number;
  reviewCount: number;
  openNow: boolean;
  hours: string;
  amenities: string[];
  hasEV: boolean;
  hasCovered: boolean;
  hasAccessible: boolean;
  isReservable: boolean;
  distanceMiles?: number;
  operatorId: string;
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export interface Reservation {
  id: string;
  userId: string;
  facilityId: string;
  facilityName: string;
  spaceLabel?: string;
  vehicleId: string;
  vehiclePlate: string;
  startDateTime: string;
  endDateTime: string;
  durationHours: number;
  status: ReservationStatus;
  qrCode: string;
  totalCost: number;
  paid: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  hasEVCharging: boolean;
  evKwh?: number;
  evCost?: number;
}

export interface ParkingSession {
  id: string;
  reservationId: string;
  facilityId: string;
  facilityName: string;
  spaceLabel: string;
  vehiclePlate: string;
  checkInTime: string;
  estimatedCheckOut: string;
  elapsedMinutes: number;
  remainingMinutes: number;
  estimatedCost: number;
  hourlyRate: number;
  status: 'active' | 'extending' | 'completed';
  evKwh?: number;
  evCost?: number;
}

export type ViolationType =
  | 'overstay'
  | 'wrong_zone'
  | 'unauthorized'
  | 'reserved_misuse'
  | 'no_permit';

export type ViolationStatus = 'open' | 'appealed' | 'resolved' | 'fined';

export interface Violation {
  id: string;
  facilityId: string;
  facilityName: string;
  vehiclePlate: string;
  type: ViolationType;
  description: string;
  recordedBy: string;
  recordedAt: string;
  status: ViolationStatus;
  fine: number;
  evidence: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  facilityId: string;
  facilityName: string;
  role: string;
  active: boolean;
  scansToday: number;
  violationsLogged: number;
  lastActive: string;
}

export interface Review {
  id: string;
  facilityId: string;
  facilityName: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  category: string;
}

export type ComplaintStatus = 'open' | 'assigned' | 'in_progress' | 'resolved';

export interface Complaint {
  id: string;
  facilityId: string;
  facilityName: string;
  userId: string;
  userName: string;
  subject: string;
  description: string;
  category: string;
  status: ComplaintStatus;
  createdAt: string;
  assignedTo?: string;
  resolution?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'reminder' | 'expiry' | 'payment' | 'cancellation' | 'closure' | 'alert' | 'review';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface EVCharger {
  id: string;
  facilityId: string;
  label: string;
  power: number;
  pricePerKwh: number;
  status: 'available' | 'in_use' | 'maintenance';
}

export interface PricingRule {
  id: string;
  facilityId: string;
  name: string;
  type: 'hourly' | 'daily' | 'peak' | 'event' | 'overnight';
  rate: number;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  active: boolean;
}

export interface EventParking {
  id: string;
  facilityId: string;
  facilityName: string;
  name: string;
  date: string;
  expectedDemand: number;
  specialRate: number;
  advanceReservations: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
  ip: string;
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'suspended' | 'pending';
  joinedDate: string;
  facilityAccess?: string;
}

export interface Report {
  id: string;
  facilityId: string;
  facilityName: string;
  date: string;
  revenue: number;
  reservations: number;
  cancellations: number;
  noShows: number;
  occupancyRate: number;
  utilizationRate: number;
  violations: number;
}
