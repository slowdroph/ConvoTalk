import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import { useToast } from "../contexts/ToastContext";
import { createDirectRoom } from "../services/rooms";
import { getErrorMessage } from "../utils/errors";
import DiscoverActiveFilters from "../features/discover/components/DiscoverActiveFilters";
import DiscoverFilters from "../features/discover/components/DiscoverFilters";
import DiscoverResults from "../features/discover/components/DiscoverResults";
import DiscoverSearchBar from "../features/discover/components/DiscoverSearchBar";
import { useDiscover } from "../features/discover/hooks/useDiscover";
import { useDiscoverParams } from "../features/discover/hooks/useDiscoverParams";
import { countActiveDiscoverFilters } from "../features/discover/utils";
import type { DiscoverUser } from "../types";

export default function DiscoverPage() {
    const { t } = useTranslation("discover");
    const navigate = useNavigate();
    const { onlineUsers } = useSocket();
    const { showToast } = useToast();
    const { filters, updateFilters, clearFilters, hasFilters } =
        useDiscoverParams();
    const {
        users,
        mode,
        loading,
        loadingMore,
        error,
        hasMore,
        loadMore,
        retry,
        retryLoadMore,
    } = useDiscover(filters);

    const [busyId, setBusyId] = useState<string | null>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const activeFilterCount = countActiveDiscoverFilters(filters);

    const onlineIds = useMemo(
        () => new Set(onlineUsers.map((user) => user.userId)),
        [onlineUsers],
    );

    const handleViewProfile = (user: DiscoverUser) => {
        navigate(`/profile/${user._id}`);
    };

    const handleStartConversation = async (user: DiscoverUser) => {
        if (busyId) return;
        setBusyId(user._id);

        try {
            const room = await createDirectRoom(user._id);
            navigate(`/chat/${room._id}`);
        } catch (err) {
            showToast({
                type: "error",
                message: getErrorMessage(err, t("errors.startChat")),
            });
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="flex h-full min-h-0 flex-col bg-noir-base">
            <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-7xl px-4 py-6 pb-8 sm:px-6">
                    <header className="mb-5">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-noir-text-bright">
                            {t("title")}
                        </h1>
                        <p className="mt-0.5 text-sm text-slate-500 dark:text-noir-text-muted">
                            {t("subtitle")}
                        </p>
                    </header>

                    <div className="mb-5 flex flex-col gap-3">
                        <DiscoverSearchBar
                            value={filters.q}
                            onSearch={(q) => updateFilters({ q })}
                        />
                        <DiscoverActiveFilters
                            filters={filters}
                            onChange={updateFilters}
                        />
                        <button
                            type="button"
                            onClick={() => setFiltersOpen((open) => !open)}
                            aria-expanded={filtersOpen}
                            className="self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 dark:border-noir-border dark:text-noir-text-bright lg:hidden"
                        >
                            {t("filters.open", { count: activeFilterCount })}
                        </button>
                        {filtersOpen && (
                            <div className="lg:hidden">
                                <DiscoverFilters
                                    value={filters}
                                    hasFilters={hasFilters}
                                    onChange={updateFilters}
                                    onClear={clearFilters}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-12 items-start gap-6">
                        <aside className="sticky top-6 hidden self-start lg:col-span-3 lg:block">
                            <DiscoverFilters
                                value={filters}
                                hasFilters={hasFilters}
                                onChange={updateFilters}
                                onClear={clearFilters}
                            />
                        </aside>

                        <div className="col-span-12 lg:col-span-9">
                            <DiscoverResults
                                users={users}
                                mode={mode}
                                loading={loading}
                                loadingMore={loadingMore}
                                error={error}
                                hasMore={hasMore}
                                hasFilters={hasFilters}
                                onlineIds={onlineIds}
                                busyId={busyId}
                                onStartConversation={(user) =>
                                    void handleStartConversation(user)
                                }
                                onViewProfile={handleViewProfile}
                                onLoadMore={() => void loadMore()}
                                onRetry={retry}
                                onRetryMore={retryLoadMore}
                                onClearFilters={clearFilters}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
