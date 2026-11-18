import { Camera, ExternalLink } from 'lucide-react'
import { PageHeader } from '../components/ui'

/** Attribution for the demo-fleet photos (Wikimedia Commons, CC BY / CC BY-SA). */
const CREDITS = [
  { car: 'Mahindra Thar', author: 'Ank Kumar', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Mahindra_Thar_SUV_in_%22Red_Rage%22_color_at_Ashiana_Brahmanda,_East_Singbhum_India_(Ank_Kumar,_Infosys_limited)_02_(cropped).jpg' },
  { car: 'Hyundai Creta', author: 'CARS WORLD Kannada', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:2024_Hyundai_Creta_1.5_MPi_SX(O)_(India)_front_view.png' },
  { car: 'Maruti Suzuki Swift', author: 'Alexander-93', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Suzuki_Swift_(2024)_hybrid_DSC_6076.jpg' },
  { car: 'Honda City', author: 'Dairokkan9', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:2022_Honda_City_ZX_i-VTEC_(India)_front_view.jpg' },
  { car: 'Tata Nexon EV', author: 'DriveSpark', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:2020_Tata_Nexon_EV_(India)_front_view.png' },
  { car: 'Toyota Innova Crysta', author: 'Premnath Kudva', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Toyota_Innova_Crysta_2.4_Z_front_right.jpg' },
  { car: 'Kia Seltos', author: 'Damian B Oh', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Kia_Seltos_SP2_PE_Snow_White_Pearl_(17)_(cropped).jpg' },
  { car: 'Mercedes-Benz C-Class', author: 'Alexander Migl', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Mercedes-Benz_W206_IMG_6380.jpg' },
  { car: 'Tata Tiago', author: 'Dairokkan9', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:2022_Tata_Tiago_XZA%2B_front_20230512.jpg' },
  { car: 'Toyota Urban Cruiser Hyryder', author: 'DriveSpark', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:2022_Toyota_Urban_Cruiser_Hyryder_V_Hybrid_(India)_front_view.jpg' },
  { car: 'Homepage & sign-in backgrounds', author: 'Unsplash contributors', license: 'Unsplash License', url: 'https://unsplash.com/license' },
]

export default function CreditsPage() {
  return (
    <div className="mx-auto max-w-4xl px-3 pb-12 pt-8 sm:px-6">
      <PageHeader eyebrow="Thank you" title="Photo credits">
        The fleet photos are real pictures of each model, shared by photographers on Wikimedia Commons under Creative Commons licenses.
      </PageHeader>
      <div className="card mt-8 divide-y divide-white/70 p-2">
        {CREDITS.map((c) => (
          <a key={c.car} href={c.url} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-2xl px-4 py-3 transition hover:bg-white/60">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-100 to-rose-100 text-orange-500">
              <Camera className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-ink">{c.car}</div>
              <div className="text-sm text-stone-500">Photo by {c.author} · {c.license}</div>
            </div>
            <ExternalLink className="size-4 shrink-0 text-stone-400" />
          </a>
        ))}
      </div>
    </div>
  )
}
