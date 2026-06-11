export default function BookLoading() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-950 animate-pulse">
      <div className="h-16 bg-white dark:bg-gray-900 border-b border-[#E5E7EB] dark:border-gray-800" />
      <div className="h-12 bg-white dark:bg-gray-900 border-b border-[#E5E7EB] dark:border-gray-800" />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="h-7 w-56 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[#E5E7EB] dark:border-gray-700 p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
