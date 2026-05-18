import { describe, expect, it, vi } from "vitest";
import {
  buildImportPlan,
  ensureSquadLinkRequiresSeason,
  executeImportPlan,
  mapEafc26Row,
  parseCsv,
  type ExistingPlayerKey
} from "@/services/eafc26-import";

describe("EAFC26 CSV import rules", () => {
  it("parses a valid CSV", () => {
    const parsed = parseCsv('id,name,nationality,overall\n1,"Alex Hunter",England,75\n');

    expect(parsed.headers).toEqual(["id", "name", "nationality", "overall"]);
    expect(parsed.rows).toEqual([
      {
        id: "1",
        name: "Alex Hunter",
        nationality: "England",
        overall: "75"
      }
    ]);
  });

  it("handles missing optional columns", () => {
    const parsed = parseCsv("name\nAlex Hunter\n");
    const mapped = mapEafc26Row(parsed.rows[0], parsed.headers);

    expect(mapped.player).toMatchObject({
      name: "Alex Hunter",
      nationality: null,
      birth_date: null,
      main_position: null
    });
  });

  it("rejects rows without a player name", () => {
    const parsed = parseCsv("id,nationality\n1,England\n");
    const plan = buildImportPlan(parsed.rows, parsed.headers, "players.csv", true);

    expect(plan.invalidPlayers).toBe(1);
    expect(plan.errors[0].message).toContain("nome");
  });

  it("maps external data to the internal players format", () => {
    const mapped = mapEafc26Row(
      {
        sofifa_id: "123",
        long_name: "Alex Hunter",
        short_name: "A. Hunter",
        nationality: "England",
        dob: "1999-06-15",
        player_positions: "ST, LW",
        overall: "75",
        potential: "84",
        player_face_url: "https://example.com/player.png"
      },
      [
        "sofifa_id",
        "long_name",
        "short_name",
        "nationality",
        "dob",
        "player_positions",
        "overall",
        "potential",
        "player_face_url"
      ]
    );

    expect(mapped.player).toMatchObject({
      name: "Alex Hunter",
      known_name: "A. Hunter",
      nationality: "England",
      birth_date: "1999-06-15",
      main_position: "ST",
      overall: 75,
      potential: 84,
      external_source: "kaggle_eafc26",
      external_id: "123"
    });
  });

  it("does not insert players during dry run", async () => {
    const parsed = parseCsv("id,name\n1,Alex Hunter\n");
    const plan = buildImportPlan(parsed.rows, parsed.headers, "players.csv", true);
    const insertPlayers = vi.fn(async () => 1);
    const result = await executeImportPlan(plan, { insertPlayers });

    expect(insertPlayers).not.toHaveBeenCalled();
    expect(result.insertedPlayers).toBe(0);
    expect(result.wouldCreate).toBe(1);
  });

  it("does not duplicate a player with the same external source and external id", () => {
    const parsed = parseCsv("id,name\n1,Alex Hunter\n");
    const existingPlayers: ExistingPlayerKey[] = [
      {
        name: "Alex Hunter",
        external_source: "kaggle_eafc26",
        external_id: "1"
      }
    ];
    const plan = buildImportPlan(parsed.rows, parsed.headers, "players.csv", true, {
      existingPlayers
    });

    expect(plan.duplicates).toBe(1);
    expect(plan.wouldCreate).toBe(0);
  });

  it("allows importing a player without a team", () => {
    const parsed = parseCsv("id,name\n1,Alex Hunter\n");
    const plan = buildImportPlan(parsed.rows, parsed.headers, "players.csv", true);

    expect(plan.playersToCreate[0]).toMatchObject({
      name: "Alex Hunter"
    });
    expect(plan.squadMembershipsToCreate).toEqual([]);
  });

  it("does not create transfers automatically", () => {
    const parsed = parseCsv("id,name,club\n1,Alex Hunter,FCMarkt United\n");
    const plan = buildImportPlan(parsed.rows, parsed.headers, "players.csv", true);

    expect(plan.transfersToCreate).toEqual([]);
  });

  it("requires a season for any optional squad link", () => {
    expect(() => ensureSquadLinkRequiresSeason({ createSquadMembership: true })).toThrow(
      "temporada"
    );
  });

  it("reports unknown teams without breaking the import", () => {
    const parsed = parseCsv("id,name,club\n1,Alex Hunter,Unknown FC\n");
    const plan = buildImportPlan(parsed.rows, parsed.headers, "players.csv", true, {
      knownTeamNames: ["FCMarkt United"]
    });

    expect(plan.notFoundTeams).toEqual(["Unknown FC"]);
    expect(plan.wouldCreate).toBe(1);
  });
});
