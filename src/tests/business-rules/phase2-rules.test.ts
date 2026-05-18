import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type {
  Season,
  SquadMembershipWithRelations,
  Team,
  TransferWithRelations
} from "@/types/database";
import {
  deriveCurrentTeamFromHistory,
  filterSquadMembershipsBySeason,
  normalizePlayerInput,
  normalizeSeasonInput,
  normalizeSquadMembershipInput,
  normalizeTransferInput,
  sortTransfersByDateDesc
} from "@/services/phase2-rules";

describe("Phase 2 business rules", () => {
  it("allows a player to be created without a current team", () => {
    expect(
      normalizePlayerInput({
        name: "Alex Hunter",
        knownName: "Hunter"
      })
    ).toMatchObject({
      name: "Alex Hunter",
      known_name: "Hunter"
    });
  });

  it("requires a season name, start year and end year", () => {
    expect(() => normalizeSeasonInput({ name: "", startYear: 2029, endYear: 2030 })).toThrow(
      "Nome da temporada"
    );
    expect(() => normalizeSeasonInput({ name: "2029/30", startYear: "", endYear: 2030 })).toThrow(
      "Ano inicial"
    );
    expect(() => normalizeSeasonInput({ name: "2029/30", startYear: 2030, endYear: 2029 })).toThrow(
      "Ano final"
    );
  });

  it("requires player, destination team, season and manual date for transfers", () => {
    expect(() =>
      normalizeTransferInput({
        playerId: "",
        toTeamId: "team-2",
        seasonId: "season-1",
        transferDate: "2030-07-01",
        transferType: "permanent"
      })
    ).toThrow("Jogador");

    expect(() =>
      normalizeTransferInput({
        playerId: "player-1",
        toTeamId: "",
        seasonId: "season-1",
        transferDate: "2030-07-01",
        transferType: "permanent"
      })
    ).toThrow("Time de destino");

    expect(() =>
      normalizeTransferInput({
        playerId: "player-1",
        toTeamId: "team-2",
        seasonId: "",
        transferDate: "2030-07-01",
        transferType: "permanent"
      })
    ).toThrow("Temporada");

    expect(() =>
      normalizeTransferInput({
        playerId: "player-1",
        toTeamId: "team-2",
        seasonId: "season-1",
        transferDate: "",
        transferType: "permanent"
      })
    ).toThrow("Data da transferencia");
  });

  it("allows transfers with null origin team and null fee", () => {
    expect(
      normalizeTransferInput({
        playerId: "player-1",
        fromTeamId: "",
        toTeamId: "team-2",
        seasonId: "season-1",
        transferDate: "2030-07-01",
        transferType: "free",
        fee: ""
      })
    ).toMatchObject({
      from_team_id: null,
      fee: null
    });
  });

  it("requires player, team and season for squad memberships", () => {
    expect(() =>
      normalizeSquadMembershipInput({
        playerId: "",
        teamId: "team-1",
        seasonId: "season-1"
      })
    ).toThrow("Jogador");

    expect(() =>
      normalizeSquadMembershipInput({
        playerId: "player-1",
        teamId: "",
        seasonId: "season-1"
      })
    ).toThrow("Time");

    expect(() =>
      normalizeSquadMembershipInput({
        playerId: "player-1",
        teamId: "team-1",
        seasonId: ""
      })
    ).toThrow("Temporada");
  });

  it("filters a team squad by season", () => {
    const memberships = [
      { id: "one", season_id: "season-1" },
      { id: "two", season_id: "season-2" }
    ];

    expect(filterSquadMembershipsBySeason(memberships, "season-2")).toEqual([
      { id: "two", season_id: "season-2" }
    ]);
  });

  it("sorts player transfers by manual career-mode date descending", () => {
    const sorted = sortTransfersByDateDesc([
      transfer({ id: "old", transfer_date: "2029-01-01" }),
      transfer({ id: "new", transfer_date: "2031-08-15" }),
      transfer({ id: "mid", transfer_date: "2030-07-01" })
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["new", "mid", "old"]);
  });

  it("derives current team from the most recent squad membership or transfer", () => {
    const currentByTransfer = deriveCurrentTeamFromHistory({
      squadMemberships: [
        membership({
          team_id: "team-1",
          joined_at: "2029-07-01",
          teams: team("team-1", "Gremio")
        })
      ],
      transfers: [
        transfer({
          to_team_id: "team-2",
          transfer_date: "2030-08-10",
          to_team: team("team-2", "Porto")
        })
      ]
    });

    expect(currentByTransfer).toMatchObject({
      id: "team-2",
      name: "Porto",
      source: "transfer"
    });

    const currentByMembership = deriveCurrentTeamFromHistory({
      squadMemberships: [
        membership({
          team_id: "team-3",
          joined_at: "2031-01-05",
          teams: team("team-3", "Ajax")
        })
      ],
      transfers: [
        transfer({
          to_team_id: "team-2",
          transfer_date: "2030-08-10",
          to_team: team("team-2", "Porto")
        })
      ]
    });

    expect(currentByMembership).toMatchObject({
      id: "team-3",
      name: "Ajax",
      source: "squad_membership"
    });
  });

  it("does not allow players to receive a fixed team_id", () => {
    expect(() =>
      normalizePlayerInput({
        name: "Alex Hunter",
        team_id: "team-1"
      })
    ).toThrow("players");

    const schema = readFileSync(resolve(process.cwd(), "supabase/schema.sql"), "utf8");
    const playersTable = schema.match(/create table if not exists players \(([\s\S]*?)\);/)?.[1] ?? "";

    expect(playersTable).not.toContain("team_id");
  });

  it("keeps this phase free from scraping, external APIs and automatic player imports", () => {
    const files = [
      "src/services/players.ts",
      "src/services/squad-memberships.ts",
      "src/services/transfers.ts",
      "src/services/seasons.ts"
    ].map((file) => readFileSync(resolve(process.cwd(), file), "utf8"));

    expect(files.join("\n")).not.toMatch(/scrap|api-football|sportmonks|reddit|csv|fetch\(/i);
  });
});

function team(id: string, name: string): Team {
  return {
    id,
    name,
    short_name: null,
    league_id: "league-1",
    city: null,
    stadium: null,
    founded_year: null,
    logo_url: null,
    description: null,
    created_at: "2029-01-01",
    updated_at: "2029-01-01"
  };
}

function season(id: string): Season {
  return {
    id,
    name: "2029/30",
    start_year: 2029,
    end_year: 2030,
    created_at: "2029-01-01",
    updated_at: "2029-01-01"
  };
}

function membership(
  overrides: Partial<SquadMembershipWithRelations>
): SquadMembershipWithRelations {
  return {
    id: "membership-1",
    player_id: "player-1",
    team_id: "team-1",
    season_id: "season-1",
    shirt_number: null,
    joined_at: null,
    left_at: null,
    created_at: "2029-01-01",
    updated_at: "2029-01-01",
    players: null,
    teams: team("team-1", "Gremio"),
    seasons: season("season-1"),
    ...overrides
  };
}

function transfer(overrides: Partial<TransferWithRelations>): TransferWithRelations {
  return {
    id: "transfer-1",
    player_id: "player-1",
    from_team_id: null,
    to_team_id: "team-2",
    season_id: "season-1",
    transfer_date: "2030-07-01",
    fee: null,
    transfer_type: "permanent",
    notes: null,
    created_at: "2030-07-01",
    updated_at: "2030-07-01",
    players: null,
    seasons: season("season-1"),
    from_team: null,
    to_team: team("team-2", "Porto"),
    ...overrides
  };
}
