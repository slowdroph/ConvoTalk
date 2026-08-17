export default function BackToTop({ visible }: { visible: boolean }) {
    if (!visible) return null;

    return (
        <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Voltar ao topo"
            className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-primary-container text-on-accent shadow-lg shadow-black/30 hover:bg-primary transition-colors flex items-center justify-center"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 15l7-7 7 7"
                />
            </svg>
        </button>
    );
}
