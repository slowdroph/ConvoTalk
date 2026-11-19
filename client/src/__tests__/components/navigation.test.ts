import { describe, it, expect } from "vitest";
import { isNavItemActive } from "../../components/Navigation/navigation";

describe("navigation", () => {
    it("considera subrotas como parte do destino", () => {
        expect(isNavItemActive("/chat", "/chat")).toBe(true);
        expect(isNavItemActive("/chat/abc", "/chat")).toBe(true);
        expect(isNavItemActive("/profile/ana", "/profile")).toBe(true);
        expect(isNavItemActive("/profilex", "/profile")).toBe(false);
        expect(isNavItemActive("/feed", "/chat")).toBe(false);
    });
});
