export type Role = 'driver' | 'staff' | 'operator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Fallback initials, shown when there is no `photoUrl`. */
  avatar: string;
  phone?: string;
  /** Server-hosted compressed avatar. Absent or null means "use initials". */
  photoUrl?: string | null;
  /**
   * Facilities this account may act on. Empty for drivers and admins (who see
   * every facility); staff and operators read this to know what is theirs.
   */
  facilityIds?: string[];
}

/** DOC section 18 vehicle body styles. Stored lowercase on the wire. */
export type VehicleType = 'sedan' | 'suv' | 'hatchback' | 'motorcycle' | 'truck' | 'van' | 'other';

/** DOC section 18 fuel/energy. `isEV` on the server is derived from this. */
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng' | 'other';

export interface Vehicle {
  id: string;
  userId: string;
  /** Uppercase letters and digits only: separators are stripped server-side. */
  registrationNumber: string;
  type: VehicleType;
  /** Free text carrying make and model, e.g. "Honda Civic". */
  model: string;
  fuelType: FuelType;
  /** Derived from `fuelType` by the server; never sent by a client. */
  isEV: boolean;
  isDefault: boolean;
  createdAt?: string | null;
}

/** Body of `POST /vehicles`. There is no `isEV` or `isDefault` field. */
export interface VehicleCreateInput {
  registrationNumber: string;
  type: VehicleType;
  model: string;
  fuelType: FuelType;
}

/** Body of `PATCH /vehicles/{id}`: send only what changed. */
export type VehicleUpdateInput = Partial<VehicleCreateInput>;

/** DOC section 17 facility states, uppercase on the wire. */
export type FacilityStatus = 'ACTIVE' | 'INACTIVE' | 'TEMPORARILY_CLOSED' | 'MAINTENANCE';

/** DOC amenity values, lowercase on the wire. */
export type Amenity =
  | 'ev_charging'
  | 'covered'
  | 'security'
  | 'cameras'
  | 'restrooms'
  | 'accessible'
  | 'valet'
  | 'elevator';

export interface Facility {
  id: string;
  operatorId: string;
  /** Display name of the owning operator; resolved server-side. */
  operatorName?: string | null;
  name: string;
  description?: string | null;
  address: string;
  city?: string | null;
  /** Derived from the GeoJSON `location` at the API boundary. */
  lat: number | null;
  lng: number | null;
  /** Derived from the count of the facility's spaces; never writable. */
  capacity: number;
  /** Per-status tally of the facility's spaces, computed at the API boundary. */
  spaceCounts: SpaceCounts;
  open24h: boolean;
  /** "HH:MM", required when `open24h` is false. */
  openingTime?: string | null;
  closingTime?: string | null;
  amenities: Amenity[];
  hasEV: boolean;
  hasCovered: boolean;
  hasAccessible: boolean;
  /** Computed from hours at the API boundary; never stored. */
  isOpenNow: boolean;
  hourlyRate?: number | null;
  dailyMax?: number | null;
  /**
   * Standing on the five-point scale, or null when the facility has not been
   * rated yet. Written by an operator until the reviews group exists.
   */
  rating?: number | null;
  /** How many ratings the average above is drawn from. */
  reviewCount?: number | null;
  status: FacilityStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Body of `POST /facilities`. Status is server-set; capacity is derived. */
export interface FacilityCreateInput {
  name: string;
  address: string;
  city?: string;
  lat: number;
  lng: number;
  open24h: boolean;
  openingTime?: string;
  closingTime?: string;
  amenities: Amenity[];
  description?: string;
  hourlyRate?: number;
  dailyMax?: number;
  /** 0-5; leave it out and the server stores no rating. */
  rating?: number;
  reviewCount?: number;
}

/** Body of `PATCH /facilities/{id}`: send only what changed; null clears. */
export interface FacilityUpdateInput {
  name?: string;
  description?: string | null;
  address?: string;
  city?: string | null;
  lat?: number;
  lng?: number;
  open24h?: boolean;
  openingTime?: string | null;
  closingTime?: string | null;
  amenities?: Amenity[];
  hourlyRate?: number | null;
  dailyMax?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
}

/** Body of `PATCH /facilities/{id}/status`. `status` is not part of PATCH. */
export interface FacilityStatusInput {
  status: FacilityStatus;
  reason?: string;
}

/**
 * DOC section 18 space statuses, uppercase on the wire.
 *
 * The server stores and returns the uppercase spelling (`app/models/enums.py`),
 * so the client uses it verbatim rather than mapping between the two.
 * `OCCUPIED` and `RESERVED` belong to the reservation engine.
 */
export type SpaceStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE' | 'BLOCKED';

/** DOC section 18 space types, lowercase on the wire. */
export type SpaceType = 'standard' | 'compact' | 'large' | 'ev' | 'accessible';

/** DOC section 17 zone states, uppercase on the wire. */
export type ZoneStatus = 'ACTIVE' | 'INACTIVE';

/** Per-status space tally, derived at the API boundary. */
export interface SpaceCounts {
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  maintenance: number;
  blocked: number;
}

/** `GET /facilities/{id}/floors` - a floor plus the zones nested under it. */
export interface Floor {
  id: string;
  facilityId: string;
  name: string;
  level: number;
  zones: Zone[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Zone {
  id: string;
  facilityId: string;
  floorId: string;
  name: string;
  status: ZoneStatus;
  closeReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Space {
  id: string;
  facilityId: string;
  floorId: string;
  /** Denormalized snapshot of the floor's name at the last rename. */
  floorName?: string | null;
  zoneId: string;
  /** Denormalized snapshot of the zone's name at the last rename. */
  zoneName?: string | null;
  spaceNumber: string;
  type: SpaceType;
  status: SpaceStatus;
  reservable: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface FloorInput {
  name: string;
  level?: number;
}

export type FloorUpdateInput = Partial<FloorInput>;

export interface ZoneInput {
  name: string;
}

export interface ZoneStatusInput {
  status: ZoneStatus;
  reason?: string;
}

export interface SpaceInput {
  spaceNumber: string;
  type?: SpaceType;
  reservable?: boolean;
}

export type SpaceUpdateInput = Partial<SpaceInput>;

export interface SpaceStatusInput {
  status: SpaceStatus;
  reason?: string;
}

/** Body of `POST /zones/{id}/spaces/bulk` - a run such as `A-01`..`A-50`. */
export interface BulkSpacesInput {
  prefix?: string;
  start?: number;
  count: number;
  type?: SpaceType;
  reservable?: boolean;
  /** Fixed width; omitted, the server pads to two digits (or wider). */
  pad?: number;
}

/**
 * DOC section 22: how a nearby search may be ordered. The server falls back to
 * `distance` for anything it does not recognise.
 */
export type ParkingSortBy = 'distance' | 'price' | 'availability' | 'rating';

/**
 * Query for `GET /parking/nearby`.
 *
 * The centre is always a point: "near me", a typed address and a dropped map
 * pin are all resolved to `lat`/`lng` in the browser before the request goes
 * out, so the server never has to guess which city a free-text query meant.
 */
export interface ParkingSearchParams {
  lat: number;
  lng: number;
  /** How far to look, in kilometres. */
  radiusKm?: number;
  /** Only facilities with at least this many free spaces. */
  minAvailable?: number;
  /** Maximum hourly rate. Facilities with no published rate are excluded. */
  maxPrice?: number;
  ev?: boolean;
  covered?: boolean;
  accessible?: boolean;
  openNow?: boolean;
  /** Only facilities with an *available* space of this type. */
  spaceType?: SpaceType;
  sort?: ParkingSortBy;
  page?: number;
  limit?: number;
}

/** One facility in a nearby-search result. */
export interface ParkingSearchResult extends Facility {
  /** Measured server-side by the `2dsphere` index; null if it cannot be. */
  distanceMeters: number | null;
  /** When the availability numbers were read. */
  availabilityAsOf?: string | null;
  /** The kinds of space this facility holds. */
  spaceTypes: SpaceType[];
}

/** `GET /parking/{id}/availability` - the per-status space tally. */
export interface ParkingAvailability {
  facilityId: string;
  spaceCounts: SpaceCounts;
  availabilityAsOf?: string | null;
}

/** `GET /parking/{id}/spaces` - the facility's spaces, for the layout grid. */
export interface ParkingSpaces {
  facilityId: string;
  spaces: Space[];
  availabilityAsOf?: string | null;
}

/** The envelope every paged list route answers with. */
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
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
