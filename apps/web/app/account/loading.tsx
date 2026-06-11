export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-950 animate-pulse">
      <div className="h-16 bg-white dark:bg-gray-900 border-b border-[#E5E7EB] dark:border-gray-800" />
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <div className="h-7 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-[#E5E7EB] dark:border-gray-700 p-6 space-y-3">
            <div className="h-5 w-1/3 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
