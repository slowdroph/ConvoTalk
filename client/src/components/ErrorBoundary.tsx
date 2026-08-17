import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

export default class ErrorBoundary extends Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        console.error("Erro não tratado:", error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-dvh-fallback bg-zinc-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
                    <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6 text-green-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-white">
                        Algo deu errado
                    </h1>
                    <p className="text-zinc-500 text-sm max-w-md">
                        Ocorreu um erro inesperado. Recarregue a página para
                        continuar.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-on-accent font-medium rounded-lg transition-colors"
                    >
                        Recarregar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
