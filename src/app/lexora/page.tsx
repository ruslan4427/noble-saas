import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lexora — Learn Vocabulary by Listening",
  description: "Download Lexora for Android. Create word playlists and learn languages hands-free through audio.",
};

export default function LexoraPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-[#006FFD] rounded-3xl mx-auto mb-6 flex items-center justify-center">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Lexora</h1>
          <p className="text-[#8A94A6] text-lg leading-relaxed">
            Learn vocabulary by listening. Create word playlists and listen hands-free.
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
              <div className="text-[#8A94A6] text-sm">Version 1.0.0</div>
            </div>
          </div>

          <a
            href="/downloads/lexora.apk"
            download="lexora.apk"
            className="flex items-center justify-center gap-3 w-full bg-[#006FFD] hover:bg-[#3D8DFF] text-white font-bold py-4 px-6 rounded-2xl transition-colors active:scale-[0.97] text-lg"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download APK
          </a>

          <p className="text-[#8A94A6] text-sm mt-4 leading-relaxed">
            59 MB · Requires Android 5.0+
          </p>
        </div>

        {/* Features */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left mb-6">
          <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">What&apos;s included</h2>
          <ul className="space-y-3">
            {[
              { icon: "🎧", text: "Audio playback of word pairs — listen while walking, driving, or working" },
              { icon: "📝", text: "Create playlists with word + translation pairs (Column A + Column B)" },
              { icon: "🤖", text: "Generate vocabulary lists with AI from any topic" },
              { icon: "📥", text: "Import from CSV, TSV, Anki decks, or Google Sheets URL" },
              { icon: "🌍", text: "12 languages including English, Ukrainian, Spanish, French, German, Italian, Polish, Portuguese, Japanese, Korean, Chinese" },
              { icon: "⚡", text: "Playback speed 0.5×–2.0×, repetitions 1–5, pause 1–5s between words" },
              { icon: "🔄", text: "Swap play order A→B or B→A to test recall" },
              { icon: "🔀", text: "Shuffle mode for randomized review" },
              { icon: "💾", text: "Audio cached locally — no re-download after first listen" },
              { icon: "🔐", text: "Sign in with email or Google — sync playlists across devices" },
            ].map(({ icon, text }, i) => (
              <li key={i} className="flex gap-3 text-[#8A94A6] text-sm">
                <span className="flex-shrink-0">{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Installation steps */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left mb-8">
          <h2 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Installation steps</h2>
          <ol className="space-y-2 text-[#8A94A6] text-sm">
            <li className="flex gap-2">
              <span className="text-[#006FFD] font-bold flex-shrink-0">1.</span>
              Download the APK file above
            </li>
            <li className="flex gap-2">
              <span className="text-[#006FFD] font-bold flex-shrink-0">2.</span>
              Open the downloaded file on your Android device
            </li>
            <li className="flex gap-2">
              <span className="text-[#006FFD] font-bold flex-shrink-0">3.</span>
              If prompted, allow installation from unknown sources in Settings
            </li>
            <li className="flex gap-2">
              <span className="text-[#006FFD] font-bold flex-shrink-0">4.</span>
              Tap Install and launch Lexora
            </li>
          </ol>
        </div>

        <div className="text-center">
          <p className="text-[#8A94A6] text-sm mb-1">iOS</p>
          <p className="text-[#6B7280] text-xs">
            Available via TestFlight for authorized testers.
            <br />Contact your administrator for access.
          </p>
        </div>
      </div>
    </div>
  );
}
