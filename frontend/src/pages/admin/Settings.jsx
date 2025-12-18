
import { Save } from 'lucide-react'

export default function Settings() {
    return (
        <div className="animate-fade-in space-y-6">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-dark-400">
                Platform Settings
            </h1>

            <div className="solid-card p-8 text-center py-20">
                <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-dark-700">
                    <Save size={32} className="text-dark-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Detailed Configuration Coming Soon</h2>
                <p className="text-dark-400 max-w-md mx-auto">
                    Global platform settings like branding, maintenance mode, and API keys will be configurable here.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <button className="btn-secondary text-sm">Cancel</button>
                    <button className="btn-primary text-sm opacity-50 cursor-not-allowed">Save Changes</button>
                </div>
            </div>

            {/* Version Info */}
            <div className="text-center text-xs text-dark-600 font-mono">
                AdultEdu Admin v1.0.0 • Build 2024.12
            </div>
        </div>
    )
}
