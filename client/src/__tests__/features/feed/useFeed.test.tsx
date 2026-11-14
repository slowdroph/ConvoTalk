import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFeed } from "../../../features/feed/hooks/useFeed";
import {
    getFeed,
    getSavedPosts,
    likePost,
    savePost,
    unlikePost,
    unsavePost,
    type FeedFilter,
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

vi.mock("../../../features/feed/services/feedApi", async (importOriginal) => {
    const actual =
        await importOriginal<
            typeof import("../../../features/feed/services/feedApi")
        >();
    return {
        ...actual,
        getFeed: vi.fn(),
        getSavedPosts: vi.fn(),
        createPost: vi.fn(),
        deletePost: vi.fn(),
        likePost: vi.fn(),
        unlikePost: vi.fn(),
        savePost: vi.fn(),
        unsavePost: vi.fn(),
    };
});

const getFeedMock = vi.mocked(getFeed);
const getSavedPostsMock = vi.mocked(getSavedPosts);
const likePostMock = vi.mocked(likePost);
const unlikePostMock = vi.mocked(unlikePost);
const savePostMock = vi.mocked(savePost);
const unsavePostMock = vi.mocked(unsavePost);

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
        commentCount: 0,
        likedByMe: false,
        savedByMe: false,
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
        getSavedPostsMock.mockResolvedValue({ posts: [], nextCursor: null });
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
            filter: "all",
            sort: "recent",
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

    it("recarrega com o filtro ativo e reseta a paginação", async () => {
        getFeedMock
            .mockResolvedValueOnce({
                posts: [makePost({ _id: "post-2" })],
                nextCursor: {
                    before: "2026-01-01T10:00:00.000Z",
                    beforeId: "post-2",
                },
            })
            .mockResolvedValue({
                posts: [makePost({ _id: "media-1" })],
                nextCursor: null,
            });

        const { result, rerender } = renderHook(
            ({ filter }: { filter: FeedFilter }) => useFeed(filter),
            { initialProps: { filter: "all" as FeedFilter } },
        );
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        rerender({ filter: "media" });

        await waitFor(() =>
            expect(getFeedMock).toHaveBeenLastCalledWith({
                limit: 20,
                filter: "media",
                sort: "recent",
            }),
        );
        await waitFor(() =>
            expect(result.current.posts.map((post) => post._id)).toEqual([
                "media-1",
            ]),
        );
        expect(result.current.hasMore).toBe(false);
    });

    it("ignora respostas de um filtro anterior já obsoleto", async () => {
        let resolveFirst!: (value: FeedPageResult) => void;
        let resolveSecond!: (value: FeedPageResult) => void;

        getFeedMock
            .mockImplementationOnce(
                () =>
                    new Promise<FeedPageResult>((resolve) => {
                        resolveFirst = resolve;
                    }),
            )
            .mockImplementationOnce(
                () =>
                    new Promise<FeedPageResult>((resolve) => {
                        resolveSecond = resolve;
                    }),
            );

        const { result, rerender } = renderHook(
            ({ filter }: { filter: FeedFilter }) => useFeed(filter),
            { initialProps: { filter: "all" as FeedFilter } },
        );
        await waitFor(() => expect(getFeedMock).toHaveBeenCalledTimes(1));

        rerender({ filter: "popular" });
        await waitFor(() => expect(getFeedMock).toHaveBeenCalledTimes(2));

        await act(async () => {
            resolveSecond({
                posts: [makePost({ _id: "popular-1" })],
                nextCursor: null,
            });
        });
        await waitFor(() =>
            expect(result.current.posts.map((post) => post._id)).toEqual([
                "popular-1",
            ]),
        );

        await act(async () => {
            resolveFirst({
                posts: [makePost({ _id: "antigo" })],
                nextCursor: null,
            });
        });

        expect(result.current.posts.map((post) => post._id)).toEqual([
            "popular-1",
        ]);
    });

    it("reordena por curtidas no filtro Populares", async () => {
        getFeedMock.mockResolvedValue({
            posts: [
                makePost({ _id: "a", content: "A", likeCount: 1 }),
                makePost({ _id: "b", content: "B", likeCount: 0 }),
            ],
            nextCursor: null,
        });

        const { result } = renderHook(() => useFeed("popular"));
        await waitFor(() => expect(result.current.posts).toHaveLength(2));

        emit("post:liked", {
            postId: "b",
            likeCount: 5,
            userId: "other",
            liked: true,
        });

        expect(result.current.posts.map((post) => post._id)).toEqual([
            "b",
            "a",
        ]);
    });

    it("não insere posts de texto no filtro de mídia", async () => {
        getFeedMock.mockResolvedValue({
            posts: [
                makePost({
                    _id: "media-1",
                    image: {
                        url: "https://example.com/a.png",
                        filename: "a.png",
                        mimetype: "image/png",
                        size: 100,
                    },
                }),
            ],
            nextCursor: null,
        });

        const { result } = renderHook(() => useFeed("media"));
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        emit("post:new", makePost({ _id: "texto-1", content: "Texto" }));
        expect(result.current.posts.map((post) => post._id)).toEqual([
            "media-1",
        ]);

        emit(
            "post:new",
            makePost({
                _id: "media-2",
                image: {
                    url: "https://example.com/b.png",
                    filename: "b.png",
                    mimetype: "image/png",
                    size: 100,
                },
            }),
        );
        expect(result.current.posts.map((post) => post._id)).toEqual([
            "media-2",
            "media-1",
        ]);
    });

    it("ignora posts de outros autores no filtro Meus Posts", async () => {
        getFeedMock.mockResolvedValue({
            posts: [makePost({ _id: "meu-1", author: { ...makePost().author!, _id: "me" } })],
            nextCursor: null,
        });

        const { result } = renderHook(() => useFeed("mine"));
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        emit("post:new", makePost({ _id: "outro-1" }));
        expect(result.current.posts.map((post) => post._id)).toEqual([
            "meu-1",
        ]);

        emit(
            "post:new",
            makePost({
                _id: "meu-2",
                author: { ...makePost().author!, _id: "me" },
            }),
        );
        expect(result.current.posts.map((post) => post._id)).toEqual([
            "meu-2",
            "meu-1",
        ]);
    });

    it("carrega o feed de salvos pela rota dedicada", async () => {
        getSavedPostsMock.mockResolvedValue({
            posts: [makePost({ _id: "salvo-1", savedByMe: true })],
            nextCursor: null,
        });

        const { result } = renderHook(() => useFeed("saved"));
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        expect(getSavedPostsMock).toHaveBeenCalledWith({ limit: 20 });
        expect(getFeedMock).not.toHaveBeenCalled();
        expect(result.current.posts[0].savedByMe).toBe(true);
    });

    it("pagina o feed de salvos preservando a ordem por data de salvamento", async () => {
        getSavedPostsMock
            .mockResolvedValueOnce({
                posts: [makePost({ _id: "salvo-1", savedByMe: true })],
                nextCursor: {
                    before: "2026-01-01T10:00:00.000Z",
                    beforeId: "saved-1",
                },
            })
            .mockResolvedValueOnce({
                posts: [makePost({ _id: "salvo-2", savedByMe: true })],
                nextCursor: null,
            });

        const { result } = renderHook(() => useFeed("saved"));
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        await act(async () => {
            await result.current.loadMore();
        });

        expect(getSavedPostsMock).toHaveBeenLastCalledWith({
            limit: 20,
            before: "2026-01-01T10:00:00.000Z",
            beforeId: "saved-1",
        });
        expect(result.current.posts.map((post) => post._id)).toEqual([
            "salvo-1",
            "salvo-2",
        ]);
    });

    it("salva de forma otimista e confirma com a resposta da API", async () => {
        getFeedMock.mockResolvedValue({
            posts: [makePost()],
            nextCursor: null,
        });
        savePostMock.mockResolvedValue({ saved: true, postId: "post-1" });

        const { result } = renderHook(() => useFeed());
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        await act(async () => {
            await result.current.toggleSave(result.current.posts[0]);
        });

        expect(savePostMock).toHaveBeenCalledWith("post-1");
        expect(result.current.posts[0].savedByMe).toBe(true);
    });

    it("remove o post da lista de salvos ao desmarcar", async () => {
        getSavedPostsMock.mockResolvedValue({
            posts: [makePost({ _id: "salvo-1", savedByMe: true })],
            nextCursor: null,
        });
        unsavePostMock.mockResolvedValue({
            saved: false,
            postId: "salvo-1",
        });

        const { result } = renderHook(() => useFeed("saved"));
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        await act(async () => {
            await result.current.toggleSave(result.current.posts[0]);
        });

        expect(unsavePostMock).toHaveBeenCalledWith("salvo-1");
        expect(result.current.posts).toHaveLength(0);
    });

    it("reverte o salvamento quando a API falha", async () => {
        getFeedMock.mockResolvedValue({
            posts: [makePost()],
            nextCursor: null,
        });
        savePostMock.mockRejectedValue(new Error("fail"));

        const { result } = renderHook(() => useFeed());
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        await act(async () => {
            await expect(
                result.current.toggleSave(result.current.posts[0]),
            ).rejects.toThrow("fail");
        });

        expect(result.current.posts[0].savedByMe).toBe(false);
    });

    it("aplica eventos de salvamento do próprio usuário", async () => {
        getFeedMock.mockResolvedValue({
            posts: [makePost()],
            nextCursor: null,
        });

        const { result } = renderHook(() => useFeed());
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        emit("post:saved", {
            postId: "post-1",
            userId: "me",
            saved: true,
        });
        expect(result.current.posts[0].savedByMe).toBe(true);

        emit("post:unsaved", {
            postId: "post-1",
            userId: "me",
            saved: false,
        });
        expect(result.current.posts[0].savedByMe).toBe(false);
    });

    it("ignora eventos de salvamento de outro usuário", async () => {
        getFeedMock.mockResolvedValue({
            posts: [makePost()],
            nextCursor: null,
        });

        const { result } = renderHook(() => useFeed());
        await waitFor(() => expect(result.current.posts).toHaveLength(1));

        emit("post:saved", {
            postId: "post-1",
            userId: "other",
            saved: true,
        });

        expect(result.current.posts[0].savedByMe).toBe(false);
    });
});
