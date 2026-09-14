export function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString("pt-BR");
}

export function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function formatSidebarTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (date >= startOfToday) {
        return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
    if (date >= startOfYesterday) {
        return "Ontem";
    }

    const diffMs = startOfToday.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays < 7) {
        return DAY_NAMES[date.getDay()];
    }

    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
