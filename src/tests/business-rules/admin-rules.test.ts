import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertConfirmed,
  canDeleteCountryFromCounts,
  canDeleteLeagueFromCounts,
  canDeletePlayerFromCounts,
  canDeleteSeasonFromCounts,
  canDeleteTeamFromCounts,
  hasDuplicateLeagueInCountry,
  hasDuplicateSquadMembership,
  hasDuplicateTeamInLeague
} from "@/services/admin-rules";

describe("Phase 3 admin rules", () => {
  it("does not delete a country with linked leagues", () => {
    expect(canDeleteCountryFromCounts({ leagues: 1 })).toMatchObject({
      canDelete: false,
      reason: "Este pais nao pode ser excluido porque possui ligas vinculadas."
    });
  });

  it("does not delete a league with linked teams", () => {
    expect(canDeleteLeagueFromCounts({ teams: 1 })).toMatchObject({
      canDelete: false,
      reason: "Esta liga nao pode ser excluida porque possui times cadastrados."
    });
  });

  it("does not delete a team with squad memberships", () => {
    expect(
      canDeleteTeamFromCounts({ squadMemberships: 1, transfersFrom: 0, transfersTo: 0 })
    ).toMatchObject({
      canDelete: false,
      reason: "Este time nao pode ser excluido porque possui jogadores vinculados ao elenco."
    });
  });

  it("does not delete a team with linked transfers", () => {
    expect(
      canDeleteTeamFromCounts({ squadMemberships: 0, transfersFrom: 1, transfersTo: 0 })
    ).toMatchObject({
      canDelete: false,
      reason: "Este time nao pode ser excluido porque possui transferencias vinculadas."
    });

    expect(
      canDeleteTeamFromCounts({ squadMemberships: 0, transfersFrom: 0, transfersTo: 1 })
    ).toMatchObject({
      canDelete: false
    });
  });

  it("does not delete a player with transfers", () => {
    expect(canDeletePlayerFromCounts({ squadMemberships: 0, transfers: 1 })).toMatchObject({
      canDelete: false,
      reason: "Este jogador nao pode ser excluido porque possui historico de transferencias."
    });
  });

  it("does not delete a player with squad memberships", () => {
    expect(canDeletePlayerFromCounts({ squadMemberships: 1, transfers: 0 })).toMatchObject({
      canDelete: false,
      reason: "Este jogador nao pode ser excluido porque possui vinculos de elenco."
    });
  });

  it("does not delete a season used by squads or transfers", () => {
    expect(canDeleteSeasonFromCounts({ squadMemberships: 1, transfers: 0 })).toMatchObject({
      canDelete: false
    });
    expect(canDeleteSeasonFromCounts({ squadMemberships: 0, transfers: 1 })).toMatchObject({
      canDelete: false
    });
  });

  it("allows deleting a duplicated team when it has no history links", () => {
    expect(
      canDeleteTeamFromCounts({ squadMemberships: 0, transfersFrom: 0, transfersTo: 0 })
    ).toMatchObject({
      canDelete: true,
      reason: null
    });
  });

  it("detects duplicate teams in the same league", () => {
    expect(
      hasDuplicateTeamInLeague(
        [
          { id: "team-1", league_id: "league-1", name: "Gremio" },
          { id: "team-2", league_id: "league-2", name: "Gremio" }
        ],
        { id: "team-3", league_id: "league-1", name: "Grêmio" }
      )
    ).toBe(true);
  });

  it("detects duplicate leagues in the same country", () => {
    expect(
      hasDuplicateLeagueInCountry(
        [{ id: "league-1", country_id: "country-1", name: "Serie A" }],
        { id: "league-2", country_id: "country-1", name: "serie a" }
      )
    ).toBe(true);
  });

  it("detects duplicate squad membership for player, team and season", () => {
    expect(
      hasDuplicateSquadMembership(
        [{ id: "one", player_id: "player-1", team_id: "team-1", season_id: "season-1" }],
        { id: "two", player_id: "player-1", team_id: "team-1", season_id: "season-1" }
      )
    ).toBe(true);
  });

  it("allows deleting transfers only when confirmed", () => {
    expect(() => assertConfirmed(true, "transferencia")).not.toThrow();
    expect(() => assertConfirmed(false, "transferencia")).toThrow("Confirme a exclusao");
  });

  it("allows deleting squad memberships only when confirmed", () => {
    expect(() => assertConfirmed(true, "vinculo de elenco")).not.toThrow();
    expect(() => assertConfirmed(false, "vinculo de elenco")).toThrow("Confirme a exclusao");
  });

  it("keeps basic team edits away from history tables", () => {
    const teamsService = readFileSync(resolve(process.cwd(), "src/services/teams.ts"), "utf8");
    const updateTeamBlock = teamsService.match(/export async function updateTeam[\s\S]*?export async function canDeleteTeam/)?.[0] ?? "";

    expect(updateTeamBlock).not.toContain(".from(\"transfers\")");
    expect(updateTeamBlock).not.toContain(".from(\"squad_memberships\")");
  });

  it("keeps basic player edits away from transfers", () => {
    const playersService = readFileSync(resolve(process.cwd(), "src/services/players.ts"), "utf8");
    const updatePlayerBlock = playersService.match(/export async function updatePlayer[\s\S]*?export async function canDeletePlayer/)?.[0] ?? "";

    expect(updatePlayerBlock).not.toContain(".from(\"transfers\")");
    expect(updatePlayerBlock).not.toContain(".from(\"squad_memberships\")");
  });

  it("declares database constraints against obvious duplicates", () => {
    const schema = readFileSync(resolve(process.cwd(), "supabase/schema.sql"), "utf8");

    expect(schema).toContain("countries_code_unique_idx");
    expect(schema).toContain("leagues_country_id_name_unique_idx");
    expect(schema).toContain("teams_league_id_name_unique_idx");
    expect(schema).toContain("seasons_name_unique_idx");
    expect(schema).toContain("squad_memberships_player_team_season_unique_idx");
    expect(schema).toContain("players_name_birth_date_unique_idx");
  });
});
