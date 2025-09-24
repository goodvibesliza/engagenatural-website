// src/components/community/SkeletonPostCard.jsx
export default function SkeletonPostCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 bg-gray-200 rounded" />
        <div className="h-3 w-16 bg-gray-200 rounded" />
      </div>
      <div className="mt-3 h-5 w-3/4 bg-gray-200 rounded" />
      <div className="mt-2 h-4 w-full bg-gray-200 rounded" />
      <div className="mt-2 h-4 w-5/6 bg-gray-200 rounded" />
      <div className="mt-4 h-10 w-2/3 bg-gray-200 rounded" />
    </div>
  );
}
