import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFeed } from "../../../features/feed/hooks/useFeed";
import {
    getFeed,
    likePost,
    unlikePost,
    type FeedPageResult,
    type LikeResult,
} from "../../../features/feed/services/feedApi";
import type { Post, PostLikedEvent } from "../../../types";

const { handlers, socketMock, socketState } = vi.hoisted(() => {
    const eventHandlers = new Map<
        string,
        Set<(payload: unknown) => void>
    >();
    return {
        handlers: eventHandlers,
        socketState: { connected: false },
        socketMock: {
            on: vi.fn((event: string, handler: (payload: unknown) => void) => {
                const set = eventHandlers.get(event) ?? new Set();
                set.add(handler);
                eventHandlers.set(event, set);
            }),
            off: vi.fn((event: string, handler: (payload: unknown) => void) => {
                eventHandlers.get(event)?.delete(handler);
            }),
        },
    };
});

vi.mock("../../../hooks/useAuth", () => ({
    useAuth: () => ({ user: { _id: "me", name: "Ana" } }),
}));

vi.mock("../../../hooks/useSocket", () => ({
    useSocket: () => ({
        socket: socketMock,
        connected: socketState.connected,
    }),
}));

vi.mock("../../../features/feed/services/feedApi", () => ({
    getFeed: vi.fn(),
    createPost: vi.fn(),
    deletePost: vi.fn(),
    likePost: vi.fn(),
    unlikePost: vi.fn(),
}));

const getFeedMock = vi.mocked(getFeed);
const likePostMock = vi.mocked(likePost);
const unlikePostMock = vi.mocked(unlikePost);

function makePost(overrides: Partial<Post> = {}): Post {
    return {
        _id: "post-1",
        author: {
            _id: "author-1",
            name: "Ana",
            publicId: "ANA1",
            avatar: "",
            status: "",
        },
        content: "Olá",
        image: null,
        likeCount: 0,
        likedByMe: false,
        edited: false,
        createdAt: "2026-01-01T10:00:00.000Z",
        ...overrides,
    };
}

function emit(event: string, payload: unknown) {
    const set = handlers.get(event);
    if (!set || set.size === 0) throw new Error(`handler ausente: ${event}`);
    act(() => {
        for (const handler of set) handler(payload);
    });
}

function handlerCount(event: string): number {
    return handlers.get(event)?.size ?? 0;
}

describe("useFeed", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        handlers.clear();
        socketState.connected = false;
        getFeedMock.mockResolvedValue({ posts: [], nextCursor: null });
    });

    it("carrega a primeira página do feed", async () => {
        getFeedMock.mockResolvedValue({
            posts: [makePost()],
            nextCursor: null,
        });

        const { result } = renderHook(() => useFeed());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.posts).toHaveLength(1);
        expect(result.current.hasMore).toBe(false);
    });

    it("registra os listeners uma única vez", async () => {
        renderHook(() => useFeed());
        await waitFor(() =>
            expect(handlerCount("post:new")).toBeGreaterThan(0),
        );

        expect(handlerCount("post:new")).toBe(1);
        expect(handlerCount("post:liked")).toBe(1);
        expect(handlerCount("post:deleted")).toBe(1);
    });

    it("insere novos posts recebidos pelo socket", async () => {
        const { result } = renderHook(() => useFeed());
        await waitFor(() => expect(result.current.loading).toBe(false));

        emit("post:new", makePost({ _id: "post-2", content: "Novo" }));

        expect(result.current.posts.map((post) => post._id)).toEqual([
            "post-2",
        ]);
    });

    it("preserva posts recebidos durante o carregamento", async () => {
        let resolvePage!: (value: FeedPageResult) => void;
        getFeedMock.mockImplementationOnce(
            () =>
                new Promise<FeedPageResult>((resolve) => {
                    resolvePage = resolve;
                }),
        );

        const { result } = renderHook(() => useFeed());
        await waitFor(() =>
            expect(handlerCount("post:new")).toBeGreaterThan(0),
        );

        emit("post:new", makePost({ _id: "post-2", content: "Novo" }));

        await act(async () => {
            resolvePage({ posts: [makePost()], nextCursor: null });
        });

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.posts.map((post) => post._id)).toEqual([
            "post-2",
            "post-1",
        ]);
    });

    it("recarrega o feed quando o socket reconecta", async () => {
        getFeedMock.mockResolvedValue({
            posts: [makePost()],
            nextCursor: null,
        });

        const { rerender } = renderHook(() => useFeed());
        await waitFor(() => expect(getFeedMock).toHaveBeenCalledTimes(1));

        socketState.connected = true;
        rerender();
        socketState.connected = false;
        rerender();
        socketState.connected = true;
        rerender();

        await waitFor(() => expect(getFeedMock).toHaveBeenCalledTimes(2));
    });

    it("não recarrega na primeira conexão do socket", async () => {
        const { rerender } = renderHook(() => useFeed());
        await waitFor(() => expect(getFeedMock).toHaveBeenCalledTimes(1));

        socketState.connected = true;
        rerender();

        await waitFor(() => expect(handlerCount("post:new")).toBe(1));
        expect(getFeedMock).toHaveBeenCalledTimes(1);
    });

    it("aplica curtidas recebidas pelo socket", async () => {
        getFeedMock.mockResolvedValue({
            posts: [makePost({ likeCount: 1 })],
            nextCursor: null,
        });

        const { result } = renderHook(() => useFeed());
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        const event: PostLikedEvent = {
            postId: "post-1",
            likeCount: 2,
            userId: "me",
            liked: true,
        };
        emit("post:liked", event);

        expect(result.current.posts[0].likeCount).toBe(2);
        expect(result.current.posts[0].likedByMe).toBe(true);
    });

    it("remove posts excluídos pelo socket", async () => {
        getFeedMock.mockResolvedValue({
            posts: [makePost()],
            nextCursor: null,
        });

        const { result } = renderHook(() => useFeed());
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        emit("post:deleted", { postId: "post-1" });

        expect(result.current.posts).toHaveLength(0);
    });

    it("faz curtida otimista e confirma com a resposta da API", async () => {
        getFeedMock.mockResolvedValue({
            posts: [makePost({ likeCount: 0 })],
            nextCursor: null,
        });
        likePostMock.mockResolvedValue({ likeCount: 1, liked: true });

        const { result } = renderHook(() => useFeed());
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        await act(async () => {
            await result.current.toggleLike(result.current.posts[0]);
        });

        expect(likePostMock).toHaveBeenCalledWith("post-1");
        expect(result.current.posts[0]).toMatchObject({
            likeCount: 1,
            likedByMe: true,
        });
    });

    it("descurte quando o post já estava curtido", async () => {
        getFeedMock.mockResolvedValue({
            posts: [makePost({ likeCount: 3, likedByMe: true })],
            nextCursor: null,
        });
        unlikePostMock.mockResolvedValue({ likeCount: 2, liked: false });

        const { result } = renderHook(() => useFeed());
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        await act(async () => {
            await result.current.toggleLike(result.current.posts[0]);
        });

        expect(unlikePostMock).toHaveBeenCalledWith("post-1");
        expect(result.current.posts[0]).toMatchObject({
            likeCount: 2,
            likedByMe: false,
        });
    });

    it("não deixa a resposta HTTP sobrescrever um evento mais recente", async () => {
        getFeedMock.mockResolvedValue({
            posts: [makePost({ likeCount: 0 })],
            nextCursor: null,
        });

        let resolveLike!: (value: LikeResult) => void;
        likePostMock.mockImplementation(
            () =>
                new Promise<LikeResult>((resolve) => {
                    resolveLike = resolve;
                }),
        );

        const { result } = renderHook(() => useFeed());
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        let togglePromise!: Promise<void>;
        act(() => {
            togglePromise = result.current.toggleLike(result.current.posts[0]);
        });

        emit("post:liked", {
            postId: "post-1",
            likeCount: 2,
            userId: "other",
            liked: true,
        });

        await act(async () => {
            resolveLike({ likeCount: 1, liked: true });
            await togglePromise;
        });

        expect(result.current.posts[0].likeCount).toBe(2);
        expect(result.current.posts[0].likedByMe).toBe(true);
    });

    it("reverte a curtida quando a API falha", async () => {
        const post = makePost({ likeCount: 1 });
        getFeedMock.mockResolvedValue({ posts: [post], nextCursor: null });
        likePostMock.mockRejectedValue(new Error("fail"));

        const { result } = renderHook(() => useFeed());
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        await act(async () => {
            await expect(
                result.current.toggleLike(result.current.posts[0]),
            ).rejects.toThrow("fail");
        });

        expect(result.current.posts[0].likeCount).toBe(1);
        expect(result.current.posts[0].likedByMe).toBe(false);
    });

    it("carrega a próxima página com o cursor", async () => {
        getFeedMock
            .mockResolvedValueOnce({
                posts: [makePost({ _id: "post-2" })],
                nextCursor: {
                    before: "2026-01-01T10:00:00.000Z",
                    beforeId: "post-2",
                },
            })
            .mockResolvedValueOnce({
                posts: [makePost({ _id: "post-1" })],
                nextCursor: null,
            });

        const { result } = renderHook(() => useFeed());
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        await act(async () => {
            await result.current.loadMore();
        });

        expect(getFeedMock).toHaveBeenLastCalledWith({
            limit: 20,
            before: "2026-01-01T10:00:00.000Z",
            beforeId: "post-2",
        });
        expect(result.current.posts.map((post) => post._id)).toEqual([
            "post-2",
            "post-1",
        ]);
        expect(result.current.hasMore).toBe(false);
    });

    it("permite tentar novamente a paginação sem voltar ao topo", async () => {
        getFeedMock
            .mockResolvedValueOnce({
                posts: [makePost({ _id: "post-2" })],
                nextCursor: {
                    before: "2026-01-01T10:00:00.000Z",
                    beforeId: "post-2",
                },
            })
            .mockRejectedValueOnce(new Error("fail"))
            .mockResolvedValueOnce({
                posts: [makePost({ _id: "post-1" })],
                nextCursor: null,
            });

        const { result } = renderHook(() => useFeed());
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        await act(async () => {
            await result.current.loadMore();
        });
        expect(result.current.error).toBeTruthy();

        act(() => {
            result.current.retryLoadMore();
        });

        await waitFor(() => expect(result.current.posts).toHaveLength(2));
        expect(result.current.posts.map((post) => post._id)).toEqual([
            "post-2",
            "post-1",
        ]);
    });
});
