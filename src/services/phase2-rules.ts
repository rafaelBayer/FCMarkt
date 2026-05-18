import type {
  CurrentTeam,
  SquadMembershipWithRelations,
  Team,
  TransferWithRelations
} from "@/types/database";

export const TRANSFER_TYPES = ["permanent", "loan", "free", "youth", "release"] as const;

export type TransferType = (typeof TRANSFER_TYPES)[number];

export type SeasonInput = {
  name: string;
  startYear: string | number;
  endYear: string | number;
};

export type PlayerInput = {
  name: string;
  knownName?: string | null;
  nationality?: string | null;
  birthDate?: string | null;
  mainPosition?: string | null;
  overall?: string | number | null;
  potential?: string | number | null;
  photoUrl?: string | null;
};

export type SquadMembershipInput = {
  playerId: string;
  teamId: string;
  seasonId: string;
  shirtNumber?: string | number | null;
  joinedAt?: string | null;
  leftAt?: string | null;
};

export type TransferInput = {
  playerId: string;
  fromTeamId?: string | null;
  toTeamId: string;
  seasonId: string;
  transferDate: string;
  fee?: string | number | null;
  transferType: string;
  notes?: string | null;
};

export function normalizeSeasonInput(input: SeasonInput) {
  const name = input.name.trim();
  const start_year = parseRequiredInteger(input.startYear, "Ano inicial");
  const end_year = parseRequiredInteger(input.endYear, "Ano final");

  if (!name) {
    throw new Error("Nome da temporada e obrigatorio.");
  }

  if (end_year < start_year) {
    throw new Error("Ano final da temporada deve ser maior ou igual ao ano inicial.");
  }

  return { name, start_year, end_year };
}

export function normalizePlayerInput(input: PlayerInput & Record<string, unknown>) {
  assertPlayerInputHasNoTeam(input);

  const name = input.name.trim();

  if (!name) {
    throw new Error("Nome do jogador e obrigatorio.");
  }

  return {
    name,
    known_name: optionalText(input.knownName),
    nationality: optionalText(input.nationality),
    birth_date: optionalDate(input.birthDate, "Data de nascimento"),
    main_position: optionalText(input.mainPosition),
    overall: optionalRating(input.overall, "Overall"),
    potential: optionalRating(input.potential, "Potencial"),
    photo_url: optionalText(input.photoUrl)
  };
}

export function normalizeSquadMembershipInput(input: SquadMembershipInput) {
  const player_id = requiredText(input.playerId, "Jogador");
  const team_id = requiredText(input.teamId, "Time");
  const season_id = requiredText(input.seasonId, "Temporada");
  const joined_at = optionalDate(input.joinedAt, "Data de entrada");
  const left_at = optionalDate(input.leftAt, "Data de saida");

  if (joined_at && left_at && left_at < joined_at) {
    throw new Error("Data de saida do elenco nao pode ser anterior a data de entrada.");
  }

  return {
    player_id,
    team_id,
    season_id,
    shirt_number: optionalInteger(input.shirtNumber, "Numero da camisa", 1, 99),
    joined_at,
    left_at
  };
}

export function normalizeTransferInput(input: TransferInput) {
  const player_id = requiredText(input.playerId, "Jogador");
  const to_team_id = requiredText(input.toTeamId, "Time de destino");
  const season_id = requiredText(input.seasonId, "Temporada");
  const transfer_date = requiredDate(input.transferDate, "Data da transferencia");
  const transfer_type = normalizeTransferType(input.transferType);

  return {
    player_id,
    from_team_id: optionalText(input.fromTeamId),
    to_team_id,
    season_id,
    transfer_date,
    fee: optionalMoney(input.fee, "Valor"),
    transfer_type,
    notes: optionalText(input.notes)
  };
}

export function sortTransfersByDateDesc<T extends { transfer_date: string; created_at?: string }>(
  transfers: T[]
) {
  return [...transfers].sort((a, b) => compareDatesDesc(getTransferDate(a), getTransferDate(b)));
}

export function filterSquadMembershipsBySeason<T extends { season_id: string }>(
  memberships: T[],
  seasonId?: string | null
) {
  const normalizedSeasonId = optionalText(seasonId);
  return normalizedSeasonId
    ? memberships.filter((membership) => membership.season_id === normalizedSeasonId)
    : memberships;
}

export function deriveCurrentTeamFromHistory({
  squadMemberships,
  transfers
}: {
  squadMemberships: SquadMembershipWithRelations[];
  transfers: TransferWithRelations[];
}): CurrentTeam | null {
  const membershipEvents = squadMemberships
    .filter((membership) => membership.teams)
    .map((membership) => ({
      id: membership.teams?.id ?? membership.team_id,
      name: getTeamDisplayName(membership.teams),
      source: "squad_membership" as const,
      date: getMembershipDate(membership)
    }));

  const transferEvents = transfers
    .filter((transfer) => transfer.to_team)
    .map((transfer) => ({
      id: transfer.to_team?.id ?? transfer.to_team_id,
      name: getTeamDisplayName(transfer.to_team),
      source: "transfer" as const,
      date: getTransferDate(transfer)
    }));

  const [latest] = [...membershipEvents, ...transferEvents].sort((a, b) =>
    compareDatesDesc(a.date, b.date)
  );

  return latest ?? null;
}

export function assertPlayerInputHasNoTeam(input: Record<string, unknown>) {
  if ("team_id" in input || "teamId" in input) {
    throw new Error("O time atual do jogador nao deve ser salvo na tabela players.");
  }
}

function normalizeTransferType(value: string): TransferType {
  const transferType = value.trim().toLowerCase();

  if (!TRANSFER_TYPES.includes(transferType as TransferType)) {
    throw new Error("Tipo de transferencia invalido.");
  }

  return transferType as TransferType;
}

function requiredText(value: string | null | undefined, label: string) {
  const text = optionalText(value);

  if (!text) {
    throw new Error(`${label} e obrigatorio.`);
  }

  return text;
}

function optionalText(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  return text || null;
}

function requiredDate(value: string | null | undefined, label: string) {
  const date = optionalDate(value, label);

  if (!date) {
    throw new Error(`${label} e obrigatoria.`);
  }

  return date;
}

function optionalDate(value: string | null | undefined, label: string) {
  const date = optionalText(value);

  if (!date) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    throw new Error(`${label} invalida.`);
  }

  return date;
}

function parseRequiredInteger(value: string | number, label: string) {
  if (typeof value === "string" && !value.trim()) {
    throw new Error(`${label} deve ser um numero inteiro.`);
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw new Error(`${label} deve ser um numero inteiro.`);
  }

  return parsed;
}

function optionalInteger(
  value: string | number | null | undefined,
  label: string,
  min?: number,
  max?: number
) {
  const text = optionalText(value == null ? null : String(value));

  if (!text) {
    return null;
  }

  const parsed = parseRequiredInteger(text, label);

  if ((min != null && parsed < min) || (max != null && parsed > max)) {
    throw new Error(`${label} deve estar entre ${min} e ${max}.`);
  }

  return parsed;
}

function optionalRating(value: string | number | null | undefined, label: string) {
  return optionalInteger(value, label, 1, 99);
}

function optionalMoney(value: string | number | null | undefined, label: string) {
  const text = optionalText(value == null ? null : String(value));

  if (!text) {
    return null;
  }

  const parsed = Number(text.replace(",", "."));

  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`${label} deve ser um numero positivo.`);
  }

  return parsed;
}

function getTeamDisplayName(team?: Team | null) {
  if (!team) {
    return "Time nao informado";
  }

  return team.short_name || team.name;
}

function getMembershipDate(membership: SquadMembershipWithRelations) {
  if (membership.joined_at) {
    return membership.joined_at;
  }

  if (membership.seasons) {
    return `${membership.seasons.start_year}-07-01`;
  }

  return membership.created_at;
}

function getTransferDate(transfer: { transfer_date: string; created_at?: string }) {
  return transfer.transfer_date || transfer.created_at || "";
}

function compareDatesDesc(a: string, b: string) {
  return new Date(b).getTime() - new Date(a).getTime();
}
