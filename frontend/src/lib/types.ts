export type Role = 'CUSTOMER' | 'ADMIN'
export type VehicleType = 'HATCHBACK' | 'SEDAN' | 'SUV' | 'MUV' | 'LUXURY'
export type Transmission = 'MANUAL' | 'AUTOMATIC'
export type FuelType = 'PETROL' | 'DIESEL' | 'CNG' | 'EV' | 'HYBRID'
export type VehicleStatus = 'AVAILABLE' | 'RENTED' | 'UNDER_REVIEW' | 'MAINTENANCE' | 'RETIRED'
export type BookingStatus = 'ACTIVE' | 'RETURNED' | 'COMPLETED'

export const VEHICLE_TYPES: VehicleType[] = ['HATCHBACK', 'SEDAN', 'SUV', 'MUV', 'LUXURY']
export const TRANSMISSIONS: Transmission[] = ['MANUAL', 'AUTOMATIC']
export const FUEL_TYPES: FuelType[] = ['PETROL', 'DIESEL', 'CNG', 'EV', 'HYBRID']

export interface User {
  id: number
  fullName: string
  email: string
  role: Role
}

export interface AuthResponse {
  token: string
  expiresAt: string
  user: User
}

export interface Vehicle {
  id: number
  brand: string
  model: string
  vehicleType: VehicleType
  transmission: Transmission
  fuelType: FuelType
  seats: number
  pricePerDay: number
  hubCity: string
  imageUrl: string | null
  status: VehicleStatus
}

export interface VehicleInput {
  brand: string
  model: string
  vehicleType: VehicleType
  transmission: Transmission
  fuelType: FuelType
  seats: number
  pricePerDay: number
  hubCity: string
  imageUrl: string
}

export interface Booking {
  id: number
  vehicle: {
    id: number
    brand: string
    model: string
    hubCity: string
    imageUrl: string | null
    pricePerDay: number
    status: VehicleStatus
  }
  customer: { id: number; fullName: string; email: string }
  startDate: string
  endDate: string
  days: number
  totalPrice: number
  status: BookingStatus
  damageReported: boolean
  inspectionNotes: string | null
  createdAt: string
  returnedAt: string | null
  completedAt: string | null
}

export interface Stats {
  totalVehicles: number
  vehiclesByStatus: Record<VehicleStatus, number>
  activeBookings: number
  pendingInspections: number
  completedBookings: number
  customers: number
  totalRevenue: number
}
