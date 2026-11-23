import api from "../../../services/api";
import type { DiscoverPage } from "../../../types";
import type { DiscoverRequestQuery } from "../utils";

export async function getDiscoverUsers(
    params: DiscoverRequestQuery,
    signal?: AbortSignal,
): Promise<DiscoverPage> {
    const { data } = await api.get<DiscoverPage>("/users/discover", {
        params,
        signal,
    });
    return data;
}
