import type { PostPollPayload } from "../../../types";

interface PostPollProps {
    poll: PostPollPayload;
    voting?: boolean;
    onVote: (optionId: string | null) => void;
}

export default function PostPoll({
    poll,
    voting = false,
    onVote,
}: PostPollProps) {
    return (
        <div className="mt-3 space-y-2" aria-label="Enquete">
            {poll.options.map((option) => {
                const selected = poll.myVoteOptionId === option._id;
                const percent =
                    poll.totalVotes > 0
                        ? Math.round((option.voteCount / poll.totalVotes) * 100)
                        : 0;

                return (
                    <button
                        key={option._id}
                        type="button"
                        onClick={() => onVote(selected ? null : option._id)}
                        disabled={voting}
                        aria-pressed={selected}
                        aria-label={
                            selected
                                ? `Remover voto de ${option.text}`
                                : `Votar em ${option.text}`
                        }
                        className={`relative w-full overflow-hidden rounded-xl border text-left transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                            selected
                                ? "border-emerald-500/50 dark:border-emerald-500/50"
                                : "border-slate-200 hover:border-emerald-500/40 dark:border-noir-border dark:hover:border-emerald-800/50"
                        }`}
                    >
                        <span
                            aria-hidden="true"
                            className={`absolute inset-y-0 left-0 ${
                                selected
                                    ? "bg-emerald-500/20"
                                    : "bg-slate-200/60 dark:bg-noir-surface-alt"
                            }`}
                            style={{ width: `${percent}%` }}
                        />
                        <span className="relative flex items-center justify-between gap-2 px-3 py-2 text-sm">
                            <span className="flex min-w-0 items-center gap-1.5">
                                {selected && (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                )}
                                <span className="truncate text-slate-800 dark:text-noir-text-bright">
                                    {option.text}
                                </span>
                            </span>
                            <span className="shrink-0 text-xs font-semibold text-slate-600 dark:text-noir-text-muted">
                                {percent}%
                            </span>
                        </span>
                    </button>
                );
            })}

            <p className="text-[11px] text-slate-500 dark:text-noir-text-muted">
                {poll.totalVotes}{" "}
                {poll.totalVotes === 1 ? "voto" : "votos"}
                {poll.myVoteOptionId
                    ? " · Toque na opção para remover seu voto"
                    : " · Escolha uma opção para votar"}
            </p>
        </div>
    );
}
