import { useState, type FormEvent } from 'react'
import { ErrorBanner, Modal, Spinner, VehicleImage } from '../../components/ui'
import { api, ApiError } from '../../lib/api'
import { label } from '../../lib/format'
import { FUEL_TYPES, TRANSMISSIONS, VEHICLE_TYPES, type Vehicle, type VehicleInput } from '../../lib/types'

const EMPTY: VehicleInput = {
  brand: '',
  model: '',
  vehicleType: 'SUV',
  transmission: 'MANUAL',
  fuelType: 'PETROL',
  seats: 5,
  pricePerDay: 2000,
  hubCity: '',
  imageUrl: '',
}

export default function VehicleFormModal({
  vehicle,
  cities,
  onClose,
  onSaved,
}: {
  vehicle: Vehicle | null
  cities: string[]
  onClose: () => void
  onSaved: (v: Vehicle) => void
}) {
  const [form, setForm] = useState<VehicleInput>(
    vehicle
      ? {
          brand: vehicle.brand,
          model: vehicle.model,
          vehicleType: vehicle.vehicleType,
          transmission: vehicle.transmission,
          fuelType: vehicle.fuelType,
          seats: vehicle.seats,
          pricePerDay: vehicle.pricePerDay,
          hubCity: vehicle.hubCity,
          imageUrl: vehicle.imageUrl ?? '',
        }
      : EMPTY,
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = <K extends keyof VehicleInput>(k: K, v: VehicleInput[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setErrors({})
    try {
      const saved = vehicle
        ? await api<Vehicle>(`/admin/vehicles/${vehicle.id}`, 'PUT', form)
        : await api<Vehicle>('/admin/vehicles', 'POST', form)
      onSaved(saved)
    } catch (err) {
      setError((err as Error).message)
      if (err instanceof ApiError) setErrors(err.fieldErrors)
    } finally {
      setBusy(false)
    }
  }

  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k]}</p>

  return (
    <Modal
      title={vehicle ? `Edit ${vehicle.brand} ${vehicle.model}` : 'Add a new car'}
      subtitle={vehicle ? 'Update the details customers see.' : 'It goes live for customers as soon as you save.'}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="brand">Brand</label>
            <input id="brand" required className="input" placeholder="e.g. Mahindra" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
            {err('brand')}
          </div>
          <div>
            <label className="label" htmlFor="model">Model</label>
            <input id="model" required className="input" placeholder="e.g. Thar" value={form.model} onChange={(e) => set('model', e.target.value)} />
            {err('model')}
          </div>
          <div>
            <label className="label" htmlFor="type">Body type</label>
            <select id="type" className="input" value={form.vehicleType} onChange={(e) => set('vehicleType', e.target.value as VehicleInput['vehicleType'])}>
              {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="tx">Transmission</label>
            <select id="tx" className="input" value={form.transmission} onChange={(e) => set('transmission', e.target.value as VehicleInput['transmission'])}>
              {TRANSMISSIONS.map((t) => <option key={t} value={t}>{label(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="fuel">Fuel</label>
            <select id="fuel" className="input" value={form.fuelType} onChange={(e) => set('fuelType', e.target.value as VehicleInput['fuelType'])}>
              {FUEL_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="seats">Seats</label>
            <input id="seats" type="number" min={2} max={12} required className="input" value={form.seats} onChange={(e) => set('seats', Number(e.target.value))} />
            {err('seats')}
          </div>
          <div>
            <label className="label" htmlFor="price">Price per day (₹)</label>
            <input id="price" type="number" min={1} step="1" required className="input" value={form.pricePerDay} onChange={(e) => set('pricePerDay', Number(e.target.value))} />
            {err('pricePerDay')}
          </div>
          <div>
            <label className="label" htmlFor="city">Hub city</label>
            <input id="city" required list="cities" className="input" placeholder="e.g. Ahmedabad" value={form.hubCity} onChange={(e) => set('hubCity', e.target.value)} />
            <datalist id="cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
            {err('hubCity')}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="img">Image URL (optional)</label>
          <input id="img" type="url" className="input" placeholder="https://..." value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} />
          {err('imageUrl')}
          <VehicleImage src={form.imageUrl || null} alt="Preview" className="mt-3 h-40 w-full rounded-2xl" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy && <Spinner className="size-4" />} {vehicle ? 'Save changes' : 'Add to fleet'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
