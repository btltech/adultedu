/**
 * Skeleton components for loading states
 */

export function TrackSkeleton() {
    return (
        <div className="skeleton-card p-5 sm:p-6 flex flex-col gap-4 h-56">
            <div className="flex justify-between">
                <div className="skeleton w-10 h-10 rounded-lg" />
                <div className="skeleton w-12 h-5 rounded-md" />
            </div>
            <div className="space-y-2 flex-grow">
                <div className="skeleton-title" />
                <div className="skeleton-text w-full" />
                <div className="skeleton-text w-2/3" />
            </div>
            <div className="skeleton w-20 h-4 rounded-md" />
        </div>
    )
}

export function LessonSkeleton() {
    return (
        <div className="skeleton-card p-4 sm:p-5 flex flex-col gap-3 h-40">
            <div className="flex items-center gap-3">
                <div className="skeleton w-8 h-8 rounded-lg" />
                <div className="skeleton-title flex-1" />
            </div>
            <div className="space-y-2 flex-grow">
                <div className="skeleton-text w-full" />
                <div className="skeleton-text w-3/4" />
            </div>
        </div>
    )
}

export function TopicSkeleton() {
    return (
        <div className="skeleton-card p-4 flex items-center gap-4 h-16">
            <div className="skeleton w-10 h-10 rounded-lg" />
            <div className="flex-1 space-y-2">
                <div className="skeleton-title w-1/2" />
                <div className="skeleton-text w-1/3" />
            </div>
        </div>
    )
}

export function CardGridSkeleton({ count = 3 }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: count }).map((_, i) => (
                <TrackSkeleton key={i} />
            ))}
        </div>
    )
}

export default {
    TrackSkeleton,
    LessonSkeleton,
    TopicSkeleton,
    CardGridSkeleton,
}
