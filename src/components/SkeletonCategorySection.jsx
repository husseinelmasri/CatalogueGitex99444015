import SkeletonGrid from './SkeletonGrid';

export default function SkeletonCategorySection() {
  return (
    <section>
      {/* Category header skeleton */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gray-200" />
        <div className="skeleton-shimmer h-5 w-40 rounded" />
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Cards skeleton */}
      <SkeletonGrid count={6} />

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
    </section>
  );
}
