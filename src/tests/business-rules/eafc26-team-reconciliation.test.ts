import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCsv } from "@/services/eafc26-import";
import {
  buildTeamReconciliationReport,
  extractCsvClubs,
  type TeamReference
} from "@/services/eafc26-team-reconciliation";
import { normalizeName } from "@/utils/normalize-name";

describe("EAFC26 team reconciliation", () => {
  it("extracts unique clubs from the CSV", () => {
    const parsed = parseCsv("Name,Team\nA,Manchester Utd\nB,Manchester Utd\nC,Spurs\n");
    const result = extractCsvClubs(parsed);

    expect(result.clubs).toEqual([
      { csvTeam: "Manchester Utd", playerCount: 2 },
      { csvTeam: "Spurs", playerCount: 1 }
    ]);
  });

  it("counts players by club", () => {
    const parsed = parseCsv("Name,Team\nA,Inter\nB,Inter\nC,Inter\nD,Real Madrid\n");
    const result = extractCsvClubs(parsed);

    expect(result.clubs[0]).toEqual({ csvTeam: "Inter", playerCount: 3 });
  });

  it("finds exact matches against existing Supabase teams", () => {
    const report = reportFor("Name,Team\nA,Manchester United\n", [
      team("team-1", "Manchester United")
    ]);

    expect(report.exactMatches).toHaveLength(1);
    expect(report.exactMatches[0]).toMatchObject({
      csvTeam: "Manchester United",
      teamName: "Manchester United"
    });
  });

  it("finds manual alias matches against existing Supabase teams", () => {
    const report = reportFor(
      "Name,Team\nA,Manchester Utd\n",
      [team("team-1", "Manchester United")],
      { "Manchester Utd": "Manchester United" }
    );

    expect(report.aliasMatches).toHaveLength(1);
    expect(report.aliasMatches[0]).toMatchObject({
      csvTeam: "Manchester Utd",
      aliasTarget: "Manchester United"
    });
  });

  it("warns when an alias points to a missing Supabase team", () => {
    const report = reportFor("Name,Team\nA,Spurs\n", [], {
      Spurs: "Tottenham Hotspur"
    });

    expect(report.aliasWarnings).toHaveLength(1);
    expect(report.missingTeams[0]).toMatchObject({
      csvTeam: "Spurs",
      aliasTarget: "Tottenham Hotspur"
    });
  });

  it("uses normalization to suggest possible matches", () => {
    const report = reportFor("Name,Team\nA,Bayern München\n", [team("team-1", "Bayern Munchen")]);

    expect(normalizeName("Bayern München")).toBe("bayern munchen");
    expect(report.possibleMatches).toHaveLength(1);
    expect(report.possibleMatches[0].candidates[0]).toMatchObject({
      teamName: "Bayern Munchen"
    });
  });

  it("keeps missing teams in the report", () => {
    const report = reportFor("Name,Team\nA,ZZZ Academy\n", [team("team-1", "Known FC")]);

    expect(report.missingTeams).toEqual([{ csvTeam: "ZZZ Academy", playerCount: 1 }]);
  });

  it("handles empty club values safely", () => {
    const parsed = parseCsv("Name,Team\nA,\nB,Manchester United\n");
    const result = extractCsvClubs(parsed);

    expect(result.invalidClubRows).toBe(1);
    expect(result.clubs).toEqual([{ csvTeam: "Manchester United", playerCount: 1 }]);
  });

  it("does not create teams automatically", () => {
    const script = readFileSync(resolve(process.cwd(), "scripts/analyze-eafc26-teams.ts"), "utf8");

    expect(script).not.toContain(".insert(");
    expect(script).not.toContain(".update(");
    expect(script).not.toContain(".delete(");
  });

  it("returns report sections for manual review", () => {
    const report = reportFor(
      "Name,Team\nA,Manchester United\nB,Inter\nC,Bayern München\nD,Unknown FC\n",
      [team("team-1", "Manchester United"), team("team-2", "Internazionale"), team("team-3", "Bayern Munchen")],
      { Inter: "Internazionale" }
    );

    expect(report).toHaveProperty("exactMatches");
    expect(report).toHaveProperty("aliasMatches");
    expect(report).toHaveProperty("possibleMatches");
    expect(report).toHaveProperty("missingTeams");
  });
});

function reportFor(csv: string, teams: TeamReference[], aliases = {}) {
  return buildTeamReconciliationReport({
    sourceFile: "imports/kaggle/eafc26/EAFC26-Men.csv",
    parsed: parseCsv(csv),
    teams,
    aliases
  });
}

function team(id: string, name: string): TeamReference {
  return {
    id,
    name,
    short_name: null,
    leagues: {
      name: "Premier League",
      countries: {
        name: "England"
      }
    }
  };
}
