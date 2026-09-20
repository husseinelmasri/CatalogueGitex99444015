export default function SkeletonGrid({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-lg border bg-white p-2 shadow-sm">
          {/* Image placeholder with shimmer */}
          <div className="skeleton-shimmer aspect-square w-full rounded-md" />

          {/* Name placeholders */}
          <div className="skeleton-shimmer mt-2 h-3 w-4/5 rounded" />
          <div className="skeleton-shimmer mt-1 h-3 w-3/5 rounded" />

          {/* Price placeholder */}
          <div className="skeleton-shimmer mt-2 h-4 w-1/2 rounded" />
        </div>
      ))}

      <style>{`
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            #e5e7eb 0%,
            #e5e7eb 40%,
            #f3f4f6 50%,
            #e5e7eb 60%,
            #e5e7eb 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}
