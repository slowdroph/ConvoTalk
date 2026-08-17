import { describe, it, expect, beforeEach } from "vitest";
import {
    getSoundEnabled,
    setSoundEnabled,
    getBrowserNotificationsEnabled,
    setBrowserNotificationsEnabled,
    getTitleBadgeEnabled,
    setTitleBadgeEnabled,
} from "../../utils/notificationPrefs";

describe("notificationPrefs", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("usa valor padrão true quando nada foi salvo", () => {
        expect(getSoundEnabled()).toBe(true);
        expect(getBrowserNotificationsEnabled()).toBe(true);
        expect(getTitleBadgeEnabled()).toBe(true);
    });

    it("salva e lê preferência de som", () => {
        setSoundEnabled(false);
        expect(getSoundEnabled()).toBe(false);
        expect(localStorage.getItem("notifications:sound")).toBe("false");
    });

    it("salva e lê preferência de notificação do navegador", () => {
        setBrowserNotificationsEnabled(false);
        expect(getBrowserNotificationsEnabled()).toBe(false);
    });

    it("salva e lê preferência de badge no título", () => {
        setTitleBadgeEnabled(false);
        expect(getTitleBadgeEnabled()).toBe(false);
    });

    it("alterna valores ida e volta", () => {
        setSoundEnabled(false);
        setSoundEnabled(true);
        expect(getSoundEnabled()).toBe(true);
    });
});