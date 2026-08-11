import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fieldmark — Field Installation Tracking App",
  description: "Download Fieldmark for Android. Track field installations, annotate floor plans, and collaborate with your team.",
};

export default function FieldmarkPage() {
  return (
    <div className="min-h-screen bg-[#0F0A00] flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-[#C9A84C] rounded-3xl mx-auto mb-6 flex items-center justify-center">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0F0A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Fieldmark</h1>
          <p className="text-[#9c8b7a] text-lg leading-relaxed">
            Field installation tracking with collaborative floor plan annotations.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#3DDC84]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#3DDC84">
                <path d="M17.523 2H6.477C5.11 2 4 3.11 4 4.477v15.046C4 20.89 5.11 22 6.477 22h11.046C18.89 22 20 20.89 20 19.523V4.477C20 3.11 18.89 2 17.523 2zm-5.523 16c-.828 0-1.5-.672-1.5-1.5S11.172 15 12 15s1.5.672 1.5 1.5S12.828 18 12 18zm4-5H8v-1.5l4-4 4 4V13z"/>
              </svg>
            </div>
            <div className="text-left">
              <div className="text-white font-semibold">Android</div>
              <div className="text-[#9c8b7a] text-sm">Version 1.0.0</div>
            </div>
          </div>

          <a
            href="/downloads/fieldmark.apk"
            download="fieldmark.apk"
            className="flex items-center justify-center gap-3 w-full bg-[#C9A84C] hover:bg-[#e8d08a] text-[#0F0A00] font-bold py-4 px-6 rounded-2xl transition-colors active:scale-[0.97] text-lg"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download APK
          </a>

          <p className="text-[#9c8b7a] text-sm mt-4 leading-relaxed">
            56 MB · Requires Android 5.0+
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left mb-8">
          <h2 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Installation steps</h2>
          <ol className="space-y-2 text-[#9c8b7a] text-sm">
            <li className="flex gap-2">
              <span className="text-[#C9A84C] font-bold flex-shrink-0">1.</span>
              Download the APK file above
            </li>
            <li className="flex gap-2">
              <span className="text-[#C9A84C] font-bold flex-shrink-0">2.</span>
              Open the downloaded file on your Android device
            </li>
            <li className="flex gap-2">
              <span className="text-[#C9A84C] font-bold flex-shrink-0">3.</span>
              If prompted, allow installation from unknown sources in Settings
            </li>
            <li className="flex gap-2">
              <span className="text-[#C9A84C] font-bold flex-shrink-0">4.</span>
              Tap Install and launch Fieldmark
            </li>
          </ol>
        </div>

        <div className="text-center">
          <p className="text-[#9c8b7a] text-sm mb-1">iOS</p>
          <p className="text-[#6b5744] text-xs">
            Available via TestFlight for authorized testers.
            <br />Contact your administrator for access.
          </p>
        </div>
      </div>
    </div>
  );
}
