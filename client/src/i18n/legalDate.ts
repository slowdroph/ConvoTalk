import { getLocale } from "./formatters";

/**
 * Revision date of the Terms and Privacy Policy, resolved at build time from
 * the git history of the legal copy. It is deliberately not `new Date()`: a
 * trust document that always claims to be updated today is inaccurate.
 */
export function formatLegalLastUpdated(): string {
    return new Date(`${__LEGAL_LAST_UPDATED__}T00:00:00Z`).toLocaleDateString(
        getLocale(),
        {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
        },
    );
}
