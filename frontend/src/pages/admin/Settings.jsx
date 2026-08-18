
import { ShieldCheck, SlidersHorizontal } from 'lucide-react'

export default function Settings() {
    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <span className="section-eyebrow"><SlidersHorizontal className="h-3.5 w-3.5" /> Settings</span>
                <h1 className="mt-3 text-3xl font-bold text-dark-50">Platform settings</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-dark-400">Configuration will live here once global controls are connected.</p>
            </div>

            <div className="solid-card px-6 py-16 text-center sm:px-8">
                <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dark-700">
                    <SlidersHorizontal size={32} className="text-dark-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Detailed configuration coming soon</h2>
                <p className="text-dark-400 max-w-md mx-auto leading-7">
                    Global platform settings like branding, maintenance mode, and API keys will be configurable here.
                </p>
                <div className="mx-auto mt-6 max-w-md rounded-2xl border border-dark-800 bg-dark-900/60 p-4 text-left text-sm text-dark-300">
                    <div className="flex gap-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
                        <p>Until these controls are connected, production configuration should stay in environment variables and deployment settings.</p>
                    </div>
                </div>
            </div>

            {/* Version Info */}
            <div className="text-center text-xs text-dark-600 font-mono">
                AdultEdu Admin • Configuration remains deployment-managed
            </div>
        </div>
    )
}
