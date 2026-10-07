import type {
  User, ParkingFacility, ParkingSpace, Reservation,
  ParkingSession, Violation, StaffMember, Review, Complaint,
  Notification, EVCharger, PricingRule, EventParking, AuditLog,
  PlatformUser, Report,
} from '@/types';

export const users: User[] = [
  { id: 'u1', name: 'Alex Morgan', email: 'alex@email.com', role: 'driver', avatar: 'AM', phone: '555-0101' },
  { id: 'u2', name: 'Jamie Chen', email: 'jamie@email.com', role: 'staff', avatar: 'JC' },
  { id: 'u3', name: 'Priya Patel', email: 'priya@email.com', role: 'operator', avatar: 'PP' },
  { id: 'u4', name: 'Sam Rivera', email: 'sam@email.com', role: 'admin', avatar: 'SR' },
];

export const facilities: ParkingFacility[] = [
  {
    id: 'f1', name: 'Downtown Central Garage', address: '100 Market St', city: 'San Francisco',
    lat: 37.7749, lng: -122.4194, totalSpaces: 240, availableSpaces: 87, reservedSpaces: 23,
    occupiedSpaces: 125, maintenanceSpaces: 5, hourlyRate: 4.5, dailyMax: 32, rating: 4.6,
    reviewCount: 312, openNow: true, hours: '24/7',
    amenities: ['EV Charging', 'Covered', 'Security', 'Restrooms', 'CCTV'],
    hasEV: true, hasCovered: true, hasAccessible: true, isReservable: true, distanceMiles: 0.3, operatorId: 'u3',
  },
  {
    id: 'f2', name: 'Mission Bay Lot', address: '450 Mission Bay Blvd', city: 'San Francisco',
    lat: 37.7705, lng: -122.3935, totalSpaces: 120, availableSpaces: 42, reservedSpaces: 8,
    occupiedSpaces: 65, maintenanceSpaces: 5, hourlyRate: 3.0, dailyMax: 18, rating: 4.2,
    reviewCount: 156, openNow: true, hours: '6:00 AM - 11:00 PM',
    amenities: ['EV Charging', 'Open Air', 'Security'],
    hasEV: true, hasCovered: false, hasAccessible: true, isReservable: true, distanceMiles: 1.2, operatorId: 'u3',
  },
  {
    id: 'f3', name: 'SoMa Premium Parking', address: '78 Brannan St', city: 'San Francisco',
    lat: 37.7793, lng: -122.4075, totalSpaces: 180, availableSpaces: 12, reservedSpaces: 30,
    occupiedSpaces: 133, maintenanceSpaces: 5, hourlyRate: 6.0, dailyMax: 45, rating: 4.8,
    reviewCount: 489, openNow: true, hours: '24/7',
    amenities: ['EV Charging', 'Covered', 'Security', 'Restrooms', 'CCTV', 'Valet'],
    hasEV: true, hasCovered: true, hasAccessible: true, isReservable: true, distanceMiles: 0.7, operatorId: 'u3',
  },
  {
    id: 'f4', name: 'Richmond District Lot', address: '320 Geary Blvd', city: 'San Francisco',
    lat: 37.7812, lng: -122.4636, totalSpaces: 80, availableSpaces: 55, reservedSpaces: 5,
    occupiedSpaces: 18, maintenanceSpaces: 2, hourlyRate: 2.5, dailyMax: 15, rating: 3.9,
    reviewCount: 78, openNow: false, hours: '7:00 AM - 9:00 PM',
    amenities: ['Open Air', 'Security'],
    hasEV: false, hasCovered: false, hasAccessible: true, isReservable: false, distanceMiles: 2.8, operatorId: 'u3',
  },
  {
    id: 'f5', name: 'Bayview EV Hub', address: '590 Third St', city: 'San Francisco',
    lat: 37.7562, lng: -122.3975, totalSpaces: 60, availableSpaces: 28, reservedSpaces: 10,
    occupiedSpaces: 19, maintenanceSpaces: 3, hourlyRate: 3.5, dailyMax: 24, rating: 4.4,
    reviewCount: 203, openNow: true, hours: '24/7',
    amenities: ['EV Charging', 'Covered', 'CCTV', 'Restrooms', 'Cafe'],
    hasEV: true, hasCovered: true, hasAccessible: true, isReservable: true, distanceMiles: 1.9, operatorId: 'u3',
  },
  {
    id: 'f6', name: 'Embarcadero Garage', address: '1 Spear St', city: 'San Francisco',
    lat: 37.7925, lng: -122.3935, totalSpaces: 300, availableSpaces: 134, reservedSpaces: 20,
    occupiedSpaces: 141, maintenanceSpaces: 5, hourlyRate: 5.0, dailyMax: 38, rating: 4.5,
    reviewCount: 367, openNow: true, hours: '24/7',
    amenities: ['Covered', 'Security', 'Restrooms', 'CCTV', 'Valet'],
    hasEV: false, hasCovered: true, hasAccessible: true, isReservable: true, distanceMiles: 1.1, operatorId: 'u3',
  },
];

export const spaces: ParkingSpace[] = [
  { id: 's1', facilityId: 'f1', floor: '1', zone: 'A', label: 'A-12', type: 'standard', status: 'available' },
  { id: 's2', facilityId: 'f1', floor: '1', zone: 'A', label: 'A-13', type: 'standard', status: 'occupied' },
  { id: 's3', facilityId: 'f1', floor: '1', zone: 'A', label: 'A-14', type: 'ev', status: 'available' },
  { id: 's4', facilityId: 'f1', floor: '1', zone: 'B', label: 'B-05', type: 'compact', status: 'reserved' },
  { id: 's5', facilityId: 'f1', floor: '2', zone: 'C', label: 'C-01', type: 'accessible', status: 'available' },
  { id: 's6', facilityId: 'f1', floor: '2', zone: 'C', label: 'C-02', type: 'standard', status: 'maintenance' },
  { id: 's7', facilityId: 'f1', floor: '2', zone: 'D', label: 'D-10', type: 'large', status: 'available' },
  { id: 's8', facilityId: 'f1', floor: '2', zone: 'D', label: 'D-11', type: 'ev', status: 'occupied' },
  { id: 's9', facilityId: 'f1', floor: '3', zone: 'E', label: 'E-03', type: 'standard', status: 'available' },
  { id: 's10', facilityId: 'f1', floor: '3', zone: 'E', label: 'E-04', type: 'standard', status: 'available' },
];

export const reservations: Reservation[] = [
  {
    id: 'r1', userId: 'u1', facilityId: 'f1', facilityName: 'Downtown Central Garage',
    spaceLabel: 'A-12', vehicleId: 'v1', vehiclePlate: 'GLR-2841',
    startDateTime: '2026-09-28T10:00', endDateTime: '2026-09-28T14:00',
    durationHours: 4, status: 'active', qrCode: 'PE-R1-XK29', totalCost: 18, paid: true,
    checkInTime: '2026-09-28T10:05', hasEVCharging: true, evKwh: 12.5, evCost: 3.75,
  },
  {
    id: 'r2', userId: 'u1', facilityId: 'f3', facilityName: 'SoMa Premium Parking',
    spaceLabel: 'B-08', vehicleId: 'v2', vehiclePlate: 'MXD-7732',
    startDateTime: '2026-09-25T09:00', endDateTime: '2026-09-25T17:00',
    durationHours: 8, status: 'completed', qrCode: 'PE-R2-LM44', totalCost: 45, paid: true,
    checkInTime: '2026-09-25T09:10', checkOutTime: '2026-09-25T17:05', hasEVCharging: false,
  },
  {
    id: 'r3', userId: 'u1', facilityId: 'f2', facilityName: 'Mission Bay Lot',
    vehicleId: 'v1', vehiclePlate: 'GLR-2841',
    startDateTime: '2026-09-30T11:00', endDateTime: '2026-09-30T15:00',
    durationHours: 4, status: 'confirmed', qrCode: 'PE-R3-QB81', totalCost: 12, paid: true,
    hasEVCharging: false,
  },
  {
    id: 'r4', userId: 'u1', facilityId: 'f5', facilityName: 'Bayview EV Hub',
    vehicleId: 'v1', vehiclePlate: 'GLR-2841',
    startDateTime: '2026-09-20T13:00', endDateTime: '2026-09-20T16:00',
    durationHours: 3, status: 'cancelled', qrCode: 'PE-R4-WN12', totalCost: 10.5, paid: false,
    hasEVCharging: false,
  },
  {
    id: 'r5', userId: 'u1', facilityId: 'f6', facilityName: 'Embarcadero Garage',
    vehicleId: 'v2', vehiclePlate: 'MXD-7732',
    startDateTime: '2026-09-15T08:00', endDateTime: '2026-09-15T18:00',
    durationHours: 10, status: 'completed', qrCode: 'PE-R5-RT66', totalCost: 38, paid: true,
    checkInTime: '2026-09-15T08:15', checkOutTime: '2026-09-15T18:10', hasEVCharging: false,
  },
];

export const activeSession: ParkingSession = {
  id: 'ps1', reservationId: 'r1', facilityId: 'f1', facilityName: 'Downtown Central Garage',
  spaceLabel: 'A-12', vehiclePlate: 'GLR-2841',
  checkInTime: '2026-09-28T10:05', estimatedCheckOut: '2026-09-28T14:05',
  elapsedMinutes: 127, remainingMinutes: 113, estimatedCost: 18, hourlyRate: 4.5, status: 'active',
  evKwh: 12.5, evCost: 3.75,
};

export const violations: Violation[] = [
  {
    id: 'vio1', facilityId: 'f1', facilityName: 'Downtown Central Garage',
    vehiclePlate: 'NYC-3321', type: 'overstay', description: 'Vehicle stayed 2 hours past reservation end time.',
    recordedBy: 'Jamie Chen', recordedAt: '2026-09-28T08:30', status: 'open', fine: 25, evidence: 'Photo of vehicle and timestamp log.',
  },
  {
    id: 'vio2', facilityId: 'f3', facilityName: 'SoMa Premium Parking',
    vehiclePlate: 'TRB-9087', type: 'wrong_zone', description: 'Compact vehicle parked in large vehicle zone.',
    recordedBy: 'Jamie Chen', recordedAt: '2026-09-27T14:15', status: 'fined', fine: 15, evidence: 'Zone photo with vehicle visible.',
  },
  {
    id: 'vio3', facilityId: 'f1', facilityName: 'Downtown Central Garage',
    vehiclePlate: 'PLM-4456', type: 'unauthorized', description: 'No reservation or payment found for vehicle.',
    recordedBy: 'Jamie Chen', recordedAt: '2026-09-26T19:00', status: 'resolved', fine: 0, evidence: 'System lookup showed no active session.',
  },
  {
    id: 'vio4', facilityId: 'f2', facilityName: 'Mission Bay Lot',
    vehiclePlate: 'GHJ-1192', type: 'reserved_misuse', description: 'Non-reservation vehicle in reserved spot B-03.',
    recordedBy: 'Jamie Chen', recordedAt: '2026-09-25T11:20', status: 'appealed', fine: 20, evidence: 'Photo of reserved sign and vehicle.',
  },
];

export const staffMembers: StaffMember[] = [
  { id: 'st1', name: 'Jamie Chen', email: 'jamie@email.com', phone: '555-0201', facilityId: 'f1', facilityName: 'Downtown Central Garage', role: 'Senior Attendant', active: true, scansToday: 47, violationsLogged: 2, lastActive: '2026-09-28T09:45' },
  { id: 'st2', name: 'Marcus Lee', email: 'marcus@email.com', phone: '555-0202', facilityId: 'f1', facilityName: 'Downtown Central Garage', role: 'Attendant', active: true, scansToday: 31, violationsLogged: 0, lastActive: '2026-09-28T09:30' },
  { id: 'st3', name: 'Diana Ruiz', email: 'diana@email.com', phone: '555-0203', facilityId: 'f3', facilityName: 'SoMa Premium Parking', role: 'Senior Attendant', active: true, scansToday: 52, violationsLogged: 1, lastActive: '2026-09-28T09:50' },
  { id: 'st4', name: 'Tom Park', email: 'tom@email.com', phone: '555-0204', facilityId: 'f2', facilityName: 'Mission Bay Lot', role: 'Attendant', active: false, scansToday: 0, violationsLogged: 0, lastActive: '2026-09-27T18:00' },
  { id: 'st5', name: 'Lisa Wong', email: 'lisa@email.com', phone: '555-0205', facilityId: 'f5', facilityName: 'Bayview EV Hub', role: 'Attendant', active: true, scansToday: 28, violationsLogged: 1, lastActive: '2026-09-28T09:15' },
];

export const reviews: Review[] = [
  { id: 'rv1', facilityId: 'f1', facilityName: 'Downtown Central Garage', userId: 'u1', userName: 'Alex Morgan', rating: 5, comment: 'Super clean and the EV charging was seamless. Will park here again!', date: '2026-09-25', category: 'EV Charging' },
  { id: 'rv2', facilityId: 'f1', facilityName: 'Downtown Central Garage', userId: 'u10', userName: 'Sarah K.', rating: 4, comment: 'Great location, but finding a spot on floor 3 was tricky.', date: '2026-09-22', category: 'Accessibility' },
  { id: 'rv3', facilityId: 'f3', facilityName: 'SoMa Premium Parking', userId: 'u11', userName: 'Mike T.', rating: 5, comment: 'Valet service is top notch. Worth the premium price.', date: '2026-09-24', category: 'Service' },
  { id: 'rv4', facilityId: 'f2', facilityName: 'Mission Bay Lot', userId: 'u12', userName: 'Jenny L.', rating: 3, comment: 'Open air lot, got a bit wet during rain. Otherwise fine.', date: '2026-09-20', category: 'Facility' },
  { id: 'rv5', facilityId: 'f5', facilityName: 'Bayview EV Hub', userId: 'u13', userName: 'Carlos R.', rating: 5, comment: 'Best EV charging rates in the city. Super convenient.', date: '2026-09-26', category: 'EV Charging' },
];

export const complaints: Complaint[] = [
  { id: 'c1', facilityId: 'f1', facilityName: 'Downtown Central Garage', userId: 'u10', userName: 'Sarah K.', subject: 'Overcharged for parking', description: 'I was charged for 5 hours but only parked for 3.', category: 'Billing', status: 'assigned', createdAt: '2026-09-26', assignedTo: 'Jamie Chen' },
  { id: 'c2', facilityId: 'f2', facilityName: 'Mission Bay Lot', userId: 'u12', userName: 'Jenny L.', subject: 'Poor lighting at night', description: 'The lot was very dark and felt unsafe at 10 PM.', category: 'Safety', status: 'open', createdAt: '2026-09-24' },
  { id: 'c3', facilityId: 'f3', facilityName: 'SoMa Premium Parking', userId: 'u11', userName: 'Mike T.', subject: 'Valet was slow', description: 'Waited 20 minutes for valet to bring my car.', category: 'Service', status: 'resolved', createdAt: '2026-09-22', assignedTo: 'Diana Ruiz', resolution: 'Valet staffing increased during peak hours. Customer offered discount.' },
  { id: 'c4', facilityId: 'f5', facilityName: 'Bayview EV Hub', userId: 'u13', userName: 'Carlos R.', subject: 'EV charger not working', description: 'Charger #3 was out of order.', category: 'Equipment', status: 'in_progress', createdAt: '2026-09-27', assignedTo: 'Lisa Wong' },
];

export const notifications: Notification[] = [
  { id: 'n1', userId: 'u1', type: 'reminder', title: 'Reservation Reminder', message: 'Your reservation at Mission Bay Lot starts in 2 days.', date: '2026-09-28T08:00', read: false },
  { id: 'n2', userId: 'u1', type: 'expiry', title: 'Session Expiring Soon', message: 'Your parking session at Downtown Central Garage expires in 2 hours.', date: '2026-09-28T12:00', read: false },
  { id: 'n3', userId: 'u1', type: 'payment', title: 'Payment Receipt', message: 'Your payment of $45.00 for SoMa Premium Parking was processed.', date: '2026-09-25T17:10', read: true },
  { id: 'n4', userId: 'u1', type: 'cancellation', title: 'Reservation Cancelled', message: 'Your reservation at Bayview EV Hub was cancelled. Refund processed.', date: '2026-09-20T10:00', read: true },
  { id: 'n5', userId: 'u1', type: 'review', title: 'Leave a Review', message: 'How was your experience at Embarcadero Garage? Leave a review.', date: '2026-09-15T18:15', read: true },
];

export const evChargers: EVCharger[] = [
  { id: 'ev1', facilityId: 'f1', label: 'EV-01', power: 50, pricePerKwh: 0.35, status: 'available' },
  { id: 'ev2', facilityId: 'f1', label: 'EV-02', power: 50, pricePerKwh: 0.35, status: 'in_use' },
  { id: 'ev3', facilityId: 'f1', label: 'EV-03', power: 150, pricePerKwh: 0.45, status: 'available' },
  { id: 'ev4', facilityId: 'f3', label: 'EV-01', power: 100, pricePerKwh: 0.40, status: 'in_use' },
  { id: 'ev5', facilityId: 'f5', label: 'EV-01', power: 150, pricePerKwh: 0.38, status: 'available' },
  { id: 'ev6', facilityId: 'f5', label: 'EV-02', power: 150, pricePerKwh: 0.38, status: 'available' },
  { id: 'ev7', facilityId: 'f5', label: 'EV-03', power: 50, pricePerKwh: 0.35, status: 'maintenance' },
  { id: 'ev8', facilityId: 'f2', label: 'EV-01', power: 50, pricePerKwh: 0.30, status: 'available' },
];

export const pricingRules: PricingRule[] = [
  { id: 'pr1', facilityId: 'f1', name: 'Standard Hourly', type: 'hourly', rate: 4.5, startTime: '00:00', endTime: '23:59', daysOfWeek: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], active: true },
  { id: 'pr2', facilityId: 'f1', name: 'Peak Surcharge', type: 'peak', rate: 6.0, startTime: '07:00', endTime: '10:00', daysOfWeek: ['Mon','Tue','Wed','Thu','Fri'], active: true },
  { id: 'pr3', facilityId: 'f1', name: 'Evening Event', type: 'event', rate: 8.0, startTime: '17:00', endTime: '23:00', daysOfWeek: ['Fri','Sat'], active: true },
  { id: 'pr4', facilityId: 'f1', name: 'Daily Max', type: 'daily', rate: 32, startTime: '00:00', endTime: '23:59', daysOfWeek: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], active: true },
  { id: 'pr5', facilityId: 'f1', name: 'Overnight Special', type: 'overnight', rate: 12, startTime: '22:00', endTime: '06:00', daysOfWeek: ['Mon','Tue','Wed','Thu','Sun'], active: true },
  { id: 'pr6', facilityId: 'f3', name: 'Premium Hourly', type: 'hourly', rate: 6.0, startTime: '00:00', endTime: '23:59', daysOfWeek: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], active: true },
  { id: 'pr7', facilityId: 'f3', name: 'Daily Max', type: 'daily', rate: 45, startTime: '00:00', endTime: '23:59', daysOfWeek: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], active: true },
];

export const eventParkings: EventParking[] = [
  { id: 'e1', facilityId: 'f1', facilityName: 'Downtown Central Garage', name: 'Giants Game Day', date: '2026-10-05', expectedDemand: 220, specialRate: 12, advanceReservations: 85 },
  { id: 'e2', facilityId: 'f6', facilityName: 'Embarcadero Garage', name: 'Food Festival Weekend', date: '2026-10-12', expectedDemand: 280, specialRate: 15, advanceReservations: 120 },
  { id: 'e3', facilityId: 'f3', facilityName: 'SoMa Premium Parking', name: 'Tech Conference', date: '2026-10-18', expectedDemand: 170, specialRate: 20, advanceReservations: 95 },
];

export const auditLogs: AuditLog[] = [
  { id: 'a1', userId: 'u4', userName: 'Sam Rivera', action: 'USER_SUSPENDED', resource: 'PlatformUser', details: 'Suspended user account u15 for fraudulent activity.', timestamp: '2026-09-28T09:45', ip: '10.0.1.24' },
  { id: 'a2', userId: 'u3', userName: 'Priya Patel', action: 'FACILITY_UPDATED', resource: 'ParkingFacility', details: 'Updated pricing for SoMa Premium Parking.', timestamp: '2026-09-28T08:30', ip: '10.0.1.12' },
  { id: 'a3', userId: 'u4', userName: 'Sam Rivera', action: 'CONFIG_CHANGED', resource: 'SystemConfig', details: 'Updated global cancellation policy to 2-hour window.', timestamp: '2026-09-27T16:00', ip: '10.0.1.24' },
  { id: 'a4', userId: 'u3', userName: 'Priya Patel', action: 'STAFF_ASSIGNED', resource: 'StaffMember', details: 'Assigned Lisa Wong to Bayview EV Hub.', timestamp: '2026-09-27T14:00', ip: '10.0.1.12' },
  { id: 'a5', userId: 'u2', userName: 'Jamie Chen', action: 'VIOLATION_RECORDED', resource: 'Violation', details: 'Recorded overstay violation for vehicle NYC-3321.', timestamp: '2026-09-28T08:30', ip: '10.0.2.45' },
  { id: 'a6', userId: 'u4', userName: 'Sam Rivera', action: 'REFUND_APPROVED', resource: 'Payment', details: 'Approved $45 refund for complaint c3.', timestamp: '2026-09-26T11:00', ip: '10.0.1.24' },
];

export const platformUsers: PlatformUser[] = [
  { id: 'u1', name: 'Alex Morgan', email: 'alex@email.com', role: 'driver', status: 'active', joinedDate: '2026-08-15' },
  { id: 'u2', name: 'Jamie Chen', email: 'jamie@email.com', role: 'staff', status: 'active', joinedDate: '2026-07-01' },
  { id: 'u3', name: 'Priya Patel', email: 'priya@email.com', role: 'operator', status: 'active', joinedDate: '2026-06-10' },
  { id: 'u4', name: 'Sam Rivera', email: 'sam@email.com', role: 'admin', status: 'active', joinedDate: '2026-05-01' },
  { id: 'u10', name: 'Sarah Kim', email: 'sarah@email.com', role: 'driver', status: 'active', joinedDate: '2026-08-20' },
  { id: 'u11', name: 'Mike Torres', email: 'mike@email.com', role: 'driver', status: 'active', joinedDate: '2026-09-01' },
  { id: 'u12', name: 'Jenny Liu', email: 'jenny@email.com', role: 'driver', status: 'active', joinedDate: '2026-09-10' },
  { id: 'u13', name: 'Carlos Reyes', email: 'carlos@email.com', role: 'driver', status: 'active', joinedDate: '2026-09-15' },
  { id: 'u15', name: 'Frank Abagnale', email: 'frank@email.com', role: 'driver', status: 'suspended', joinedDate: '2026-09-20' },
  { id: 'st2', name: 'Marcus Lee', email: 'marcus@email.com', role: 'staff', status: 'active', joinedDate: '2026-07-15' },
  { id: 'st3', name: 'Diana Ruiz', email: 'diana@email.com', role: 'staff', status: 'active', joinedDate: '2026-07-20' },
  { id: 'st4', name: 'Tom Park', email: 'tom@email.com', role: 'staff', status: 'pending', joinedDate: '2026-09-25' },
  { id: 'st5', name: 'Lisa Wong', email: 'lisa@email.com', role: 'staff', status: 'active', joinedDate: '2026-08-01' },
];

export const reports: Report[] = [
  { id: 'rep1', facilityId: 'f1', facilityName: 'Downtown Central Garage', date: '2026-09-28', revenue: 1840, reservations: 142, cancellations: 12, noShows: 5, occupancyRate: 0.72, utilizationRate: 0.85, violations: 2 },
  { id: 'rep2', facilityId: 'f3', facilityName: 'SoMa Premium Parking', date: '2026-09-28', revenue: 2240, reservations: 168, cancellations: 8, noShows: 3, occupancyRate: 0.89, utilizationRate: 0.93, violations: 1 },
  { id: 'rep3', facilityId: 'f2', facilityName: 'Mission Bay Lot', date: '2026-09-28', revenue: 960, reservations: 87, cancellations: 15, noShows: 8, occupancyRate: 0.61, utilizationRate: 0.72, violations: 1 },
  { id: 'rep4', facilityId: 'f5', facilityName: 'Bayview EV Hub', date: '2026-09-28', revenue: 720, reservations: 54, cancellations: 4, noShows: 2, occupancyRate: 0.55, utilizationRate: 0.68, violations: 1 },
  { id: 'rep5', facilityId: 'f6', facilityName: 'Embarcadero Garage', date: '2026-09-28', revenue: 1980, reservations: 156, cancellations: 10, noShows: 6, occupancyRate: 0.78, utilizationRate: 0.88, violations: 0 },
];

export const weeklyRevenue = [
  { day: 'Mon', revenue: 5420 },
  { day: 'Tue', revenue: 6180 },
  { day: 'Wed', revenue: 5960 },
  { day: 'Thu', revenue: 6740 },
  { day: 'Fri', revenue: 8320 },
  { day: 'Sat', revenue: 7180 },
  { day: 'Sun', revenue: 4520 },
];

export const hourlyOccupancy = [
  { hour: '6 AM', occupancy: 15 },
  { hour: '8 AM', occupancy: 45 },
  { hour: '10 AM', occupancy: 72 },
  { hour: '12 PM', occupancy: 88 },
  { hour: '2 PM', occupancy: 82 },
  { hour: '4 PM', occupancy: 90 },
  { hour: '6 PM', occupancy: 65 },
  { hour: '8 PM', occupancy: 38 },
  { hour: '10 PM', occupancy: 22 },
];
