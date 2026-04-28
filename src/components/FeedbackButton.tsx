'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  category: z.string().min(1, 'Choose a category'),
  message:  z.string().min(5, 'At least 5 characters'),
  rating:   z.number().min(1).max(5),
})
type FormData = z.infer<typeof schema>

const CATEGORIES = ['Bug report', 'Feature request', 'UI/UX feedback', 'Performance', 'Other']

export default function FeedbackButton() {
  const [open, setOpen]         = useState(false)
  const [success, setSuccess]   = useState(false)
  const [hoverStar, setHoverStar] = useState(0)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 0 },
  })

  const rating = watch('rating')

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/feedback', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    if (!res.ok) {
      const { error } = await res.json()
      alert(error ?? 'Something went wrong')
      return
    }
    setSuccess(true)
    reset()
    setTimeout(() => { setOpen(false); setSuccess(false) }, 2500)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white text-sm px-4 py-2 rounded-full transition backdrop-blur"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Feedback
      </button>

      {/* Modal backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-4 sm:p-6 bg-black/50 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-sm bg-[#1a1208] border border-white/10 rounded-2xl shadow-2xl p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-base">Send feedback</h2>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition text-xl leading-none">×</button>
            </div>

            {success ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-3">✓</div>
                <p className="text-white font-medium">Thank you!</p>
                <p className="text-white/50 text-sm mt-1">Your feedback was saved.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Category */}
                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Category</label>
                  <select
                    {...register('category')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A84C] transition"
                  >
                    <option value="" className="bg-[#1a1208]">Select…</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c} className="bg-[#1a1208]">{c}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category.message}</p>}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Message</label>
                  <textarea
                    {...register('message')}
                    rows={4}
                    placeholder="Describe your feedback…"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C] transition resize-none"
                  />
                  {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message.message}</p>}
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Rating</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setValue('rating', star, { shouldValidate: true })}
                        onMouseEnter={() => setHoverStar(star)}
                        onMouseLeave={() => setHoverStar(0)}
                        className="text-2xl transition-transform hover:scale-110"
                      >
                        <span className={(hoverStar || rating) >= star ? 'text-[#C9A84C]' : 'text-white/20'}>★</span>
                      </button>
                    ))}
                  </div>
                  {errors.rating && <p className="text-red-400 text-xs mt-1">Please select a rating</p>}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#C9A84C] text-black font-bold py-2.5 rounded-xl hover:bg-[#e8d08a] transition text-sm disabled:opacity-50 active:scale-[0.97]"
                >
                  {isSubmitting ? 'Sending…' : 'Send feedback'}
                </button>

              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
