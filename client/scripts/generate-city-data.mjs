import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import cities from "all-the-cities";

const TOP_PER_COUNTRY = 100;
const MAX_NAME_LENGTH = 80;
const MIN_COUNTRIES = 150;
const REQUIRED_CODES = ["BR", "US"];

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(clientRoot, "src", "data", "cities");

function normalizeName(name) {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

const byCountry = new Map();

for (const entry of cities) {
    const code = typeof entry.country === "string" ? entry.country : "";
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    if (!/^[A-Z]{2}$/.test(code) || !name || name.length > MAX_NAME_LENGTH) {
        continue;
    }

    const list = byCountry.get(code) ?? [];
    list.push({ name, population: Number(entry.population) || 0 });
    byCountry.set(code, list);
}

if (byCountry.size < MIN_COUNTRIES) {
    console.error(
        `Apenas ${byCountry.size} países encontrados (< ${MIN_COUNTRIES}) — dataset inesperado.`,
    );
    process.exit(1);
}

for (const required of REQUIRED_CODES) {
    if (!byCountry.has(required)) {
        console.error(`País obrigatório ausente: ${required}`);
        process.exit(1);
    }
}

mkdirSync(outDir, { recursive: true });

const seenFiles = new Set();
let totalCities = 0;

for (const [code, entries] of byCountry) {
    entries.sort((a, b) => b.population - a.population);

    const names = [];
    const seenNormalized = new Set();
    for (const { name } of entries) {
        const key = normalizeName(name);
        if (seenNormalized.has(key)) continue;
        seenNormalized.add(key);
        names.push(name);
        if (names.length === TOP_PER_COUNTRY) break;
    }

    if (names.length === 0) continue;

    writeFileSync(join(outDir, `${code}.json`), `${JSON.stringify(names, null, 2)}\n`, "utf8");
    seenFiles.add(`${code}.json`);
    totalCities += names.length;
}

for (const file of readdirSync(outDir)) {
    if (!seenFiles.has(file)) {
        rmSync(join(outDir, file));
    }
}

console.log(
    `cities: ${seenFiles.size} países, ${totalCities} cidades geradas em src/data/cities/.`,
);
