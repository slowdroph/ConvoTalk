import { readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const flagsDir = join(
    clientRoot,
    "node_modules",
    "country-flag-icons",
    "react",
    "3x2",
);
const outFile = join(
    clientRoot,
    "src",
    "components",
    "ui",
    "flagLoaders.ts",
);

if (!existsSync(flagsDir)) {
    console.error(
        "country-flag-icons não encontrado. Execute npm install em client/.",
    );
    process.exit(1);
}

const codes = readdirSync(flagsDir, { withFileTypes: true })
    .filter(
        (entry) =>
            entry.isDirectory() &&
            /^[A-Z]{2}$/.test(entry.name) &&
            existsSync(join(flagsDir, entry.name, "package.json")),
    )
    .map((entry) => entry.name)
    .sort();

if (codes.length === 0) {
    console.error(`Nenhum código de bandeira encontrado em ${flagsDir}`);
    process.exit(1);
}

if (codes.length < 200) {
    console.error(
        `Apenas ${codes.length} códigos encontrados — inesperado, verifique o pacote.`,
    );
    process.exit(1);
}

const lines = codes.map((code) => `    ${code}: () => import("country-flag-icons/react/3x2/${code}"),`);

const content = `// Gerado por client/scripts/generate-flag-loaders.mjs — não editar manualmente.
// npm run generate:flags
import type { JSX } from "react";

export type FlagComponent = (props: {
    title?: string;
    className?: string;
    role?: string;
    "aria-label"?: string;
}) => JSX.Element;

export const FLAG_LOADERS: Readonly<
    Record<string, () => Promise<{ default: FlagComponent }>>
> = {
${lines.join("\n")}
};
`;

writeFileSync(outFile, content, "utf8");
console.log(`flagLoaders.ts gerado com ${codes.length} bandeiras.`);
