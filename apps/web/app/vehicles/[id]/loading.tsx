export default function VehicleDetailLoading() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-950">
      <div className="h-16 bg-white dark:bg-gray-900 border-b border-[#E5E7EB] dark:border-gray-800" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="aspect-[16/9] rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="h-8 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[1,2,3,4].map((i) => (
                <div key={i} className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              ))}
            </div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
