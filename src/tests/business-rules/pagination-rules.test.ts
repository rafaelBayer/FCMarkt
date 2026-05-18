import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildPaginatedResult,
  emptyPaginatedResult,
  normalizePagination
} from "@/services/pagination";

describe("Phase 4.1 pagination rules", () => {
  it("does not let the players listing service query without a range limit", () => {
    const source = readService("players.ts");
    const paginatedBlock = getFunctionBlock(source, "getPaginatedPlayers");

    expect(paginatedBlock).toContain(".range(pagination.from, pagination.to)");
    expect(paginatedBlock).toContain("PLAYERS_PAGE_SIZE");
  });

  it("respects page and pageSize when calculating ranges", () => {
    expect(normalizePagination({ page: 3, pageSize: 50 })).toMatchObject({
      page: 3,
      pageSize: 50,
      from: 100,
      to: 149
    });
  });

  it("applies player search by name in the database query", () => {
    const source = readService("players.ts");
    const paginatedBlock = getFunctionBlock(source, "getPaginatedPlayers");

    expect(paginatedBlock).toContain("name.ilike");
    expect(paginatedBlock).toContain("known_name.ilike");
  });

  it("keeps teams listing paginated", () => {
    expect(getFunctionBlock(readService("teams.ts"), "getPaginatedTeams")).toContain(
      ".range(pagination.from, pagination.to)"
    );
  });

  it("keeps leagues listing paginated", () => {
    expect(getFunctionBlock(readService("leagues.ts"), "getPaginatedLeagues")).toContain(
      ".range(pagination.from, pagination.to)"
    );
  });

  it("keeps countries listing paginated", () => {
    expect(getFunctionBlock(readService("countries.ts"), "getPaginatedCountries")).toContain(
      ".range(pagination.from, pagination.to)"
    );
  });

  it("calculates totalPages safely", () => {
    expect(
      buildPaginatedResult({ data: [], count: 101, page: 1, pageSize: 50 }).totalPages
    ).toBe(3);
    expect(
      buildPaginatedResult({ data: [], count: 0, page: 1, pageSize: 50 }).totalPages
    ).toBe(1);
  });

  it("returns valid metadata for an empty search result", () => {
    expect(emptyPaginatedResult({ page: 2, search: "sem resultado" })).toMatchObject({
      data: [],
      count: 0,
      page: 1,
      totalPages: 1
    });
  });

  it("normalizes invalid pages safely", () => {
    expect(normalizePagination({ page: "-3", pageSize: "0" })).toMatchObject({
      page: 1,
      pageSize: 20,
      from: 0,
      to: 19
    });
  });

  it("keeps optional filters safe when omitted", () => {
    const playersBlock = getFunctionBlock(readService("players.ts"), "getPaginatedPlayers");
    const teamsBlock = getFunctionBlock(readService("teams.ts"), "getPaginatedTeams");

    expect(playersBlock).toContain("if (position)");
    expect(playersBlock).toContain("if (nationality)");
    expect(teamsBlock).toContain("if (league)");
    expect(teamsBlock).toContain("if (country)");
  });
});

function readService(fileName: string) {
  return readFileSync(resolve(process.cwd(), "src/services", fileName), "utf8");
}

function getFunctionBlock(source: string, name: string) {
  const start = source.indexOf(`export async function ${name}`);

  if (start === -1) {
    return "";
  }

  const nextFunction = source.indexOf("\nexport async function", start + 1);
  return source.slice(start, nextFunction === -1 ? undefined : nextFunction);
}
