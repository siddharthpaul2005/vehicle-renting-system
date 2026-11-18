import { ArrowRight, Fuel, MapPin, Settings2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatINR, label } from '../lib/format'
import { TYPE_BLURB } from '../lib/human'
import type { Vehicle } from '../lib/types'
import { StatusBadge, VehicleImage } from './ui'

export default function VehicleCard({ vehicle: v, index = 0 }: { vehicle: Vehicle; index?: number }) {
  const available = v.status === 'AVAILABLE'
  return (
    <Link
      to={`/vehicles/${v.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
      className="card animate-rise group flex flex-col p-2 transition duration-300 hover:-translate-y-1 hover:bg-white/70 hover:shadow-[0_20px_50px_-15px_rgba(120,90,60,0.35)] focus-visible:outline-2 focus-visible:outline-amber-500"
    >
      <div className="relative overflow-hidden rounded-[1.25rem]">
        <VehicleImage
          src={v.imageUrl}
          alt={`${v.brand} ${v.model}`}
          className={`h-48 w-full transition duration-500 group-hover:scale-105 ${available ? '' : 'grayscale-[50%]'}`}
        />
        <div className="absolute left-3 top-3">
          <StatusBadge status={v.status} />
        </div>
        <div className="glass absolute bottom-3 right-3 rounded-full px-3 py-1 text-sm font-bold text-ink">
          {formatINR(v.pricePerDay)}
          <span className="font-medium text-stone-500">/day</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-stone-500">
          <span className="uppercase tracking-wider">{v.brand}</span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5 text-rose-400" /> {v.hubCity}
          </span>
        </div>
        <h3 className="mt-0.5 text-xl font-bold text-ink">{v.model}</h3>
        <p className="mt-1 text-sm text-stone-500">{TYPE_BLURB[v.vehicleType]}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="chip"><Settings2 className="size-3.5" /> {label(v.transmission)}</span>
          <span className="chip"><Fuel className="size-3.5" /> {label(v.fuelType)}</span>
          <span className="chip"><Users className="size-3.5" /> {v.seats} seats</span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="text-xs font-medium text-stone-400">{label(v.vehicleType)}</span>
          <span
            className={`flex items-center gap-1 text-sm font-semibold transition ${
              available ? 'text-orange-600 group-hover:gap-2' : 'text-stone-400'
            }`}
          >
            {available ? 'Book this one' : 'See details'} <ArrowRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}
