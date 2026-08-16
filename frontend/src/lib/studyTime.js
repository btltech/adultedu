export function formatLessonTime(totalMinutes) {
    const minutes = Number(totalMinutes)

    if (!Number.isFinite(minutes) || minutes <= 0) {
        return 'Not yet set'
    }

    const wholeMinutes = Math.round(minutes)
    const hours = Math.floor(wholeMinutes / 60)
    const remainderMinutes = wholeMinutes % 60

    if (hours === 0) {
        return `${remainderMinutes} min`
    }

    if (remainderMinutes === 0) {
        return `${hours}h`
    }

    return `${hours}h ${remainderMinutes}m`
}

export function averagePublishedLessonMinutes(items, selector = (item) => item?.estimatedMinutes) {
    const values = items
        .map(selector)
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0)

    if (!values.length) {
        return 0
    }

    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}