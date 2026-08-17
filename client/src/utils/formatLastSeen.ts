export function formatLastSeen(lastSeen: string | null): string {
    if (!lastSeen) return "Visto por último: desconhecido";

    const diffMs = Date.now() - new Date(lastSeen).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Visto agora";
    if (diffMin < 60) return `Visto há ${diffMin} min`;
    if (diffHour < 24) return `Visto há ${diffHour} h`;
    if (diffDay === 1) return "Visto ontem";

    return new Date(lastSeen).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}
