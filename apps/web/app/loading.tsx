export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-950 animate-pulse">
      <div className="h-16 bg-white dark:bg-gray-900 border-b border-[#E5E7EB] dark:border-gray-800" />
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-[#E5E7EB] dark:border-gray-700">
              <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-800" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-xl mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
