// src/components/community/SkeletonDetail.jsx
export default function SkeletonDetail() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 motion-safe:animate-pulse motion-reduce:animate-none">
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 bg-gray-200 rounded" />
        <div className="h-3 w-16 bg-gray-200 rounded" />
      </div>
      <div className="mt-3 h-6 w-3/4 bg-gray-200 rounded" />
      <div className="mt-3 h-4 w-full bg-gray-200 rounded" />
      <div className="mt-2 h-4 w-5/6 bg-gray-200 rounded" />
    </div>
  );
}
