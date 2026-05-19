export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: '#407E3C' }}
        >
          R
        </div>
        <span className="font-semibold text-[#1A1A1A] dark:text-gray-100 text-xl">RECI Transport</span>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
