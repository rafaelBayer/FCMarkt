export type DeleteCheck = {
  canDelete: boolean;
  reason: string | null;
};

export type CountryDeleteCounts = {
  leagues: number;
};

export type LeagueDeleteCounts = {
  teams: number;
};

export type TeamDeleteCounts = {
  squadMemberships: number;
  transfersFrom: number;
  transfersTo: number;
};

export type PlayerDeleteCounts = {
  squadMemberships: number;
  transfers: number;
};

export type SeasonDeleteCounts = {
  squadMemberships: number;
  transfers: number;
};

export function canDeleteCountryFromCounts(counts: CountryDeleteCounts): DeleteCheck {
  if (counts.leagues > 0) {
    return {
      canDelete: false,
      reason: "Este pais nao pode ser excluido porque possui ligas vinculadas."
    };
  }

  return allowed();
}

export function canDeleteLeagueFromCounts(counts: LeagueDeleteCounts): DeleteCheck {
  if (counts.teams > 0) {
    return {
      canDelete: false,
      reason: "Esta liga nao pode ser excluida porque possui times cadastrados."
    };
  }

  return allowed();
}

export function canDeleteTeamFromCounts(counts: TeamDeleteCounts): DeleteCheck {
  if (counts.squadMemberships > 0) {
    return {
      canDelete: false,
      reason: "Este time nao pode ser excluido porque possui jogadores vinculados ao elenco."
    };
  }

  if (counts.transfersFrom > 0 || counts.transfersTo > 0) {
    return {
      canDelete: false,
      reason: "Este time nao pode ser excluido porque possui transferencias vinculadas."
    };
  }

  return allowed();
}

export function canDeletePlayerFromCounts(counts: PlayerDeleteCounts): DeleteCheck {
  if (counts.transfers > 0) {
    return {
      canDelete: false,
      reason: "Este jogador nao pode ser excluido porque possui historico de transferencias."
    };
  }

  if (counts.squadMemberships > 0) {
    return {
      canDelete: false,
      reason: "Este jogador nao pode ser excluido porque possui vinculos de elenco."
    };
  }

  return allowed();
}

export function canDeleteSeasonFromCounts(counts: SeasonDeleteCounts): DeleteCheck {
  if (counts.squadMemberships > 0 || counts.transfers > 0) {
    return {
      canDelete: false,
      reason: "Esta temporada nao pode ser excluida porque possui elencos ou transferencias vinculadas."
    };
  }

  return allowed();
}

export function assertConfirmed(confirmed: boolean, subject: string) {
  if (!confirmed) {
    throw new Error(`Confirme a exclusao de ${subject} antes de continuar.`);
  }
}

export function normalizeDuplicateKey(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function hasDuplicateTeamInLeague(
  teams: Array<{ id?: string; league_id: string; name: string }>,
  candidate: { id?: string; league_id: string; name: string }
) {
  const candidateName = normalizeDuplicateKey(candidate.name);

  return teams.some((team) => {
    return (
      team.id !== candidate.id &&
      team.league_id === candidate.league_id &&
      normalizeDuplicateKey(team.name) === candidateName
    );
  });
}

export function hasDuplicateLeagueInCountry(
  leagues: Array<{ id?: string; country_id: string; name: string }>,
  candidate: { id?: string; country_id: string; name: string }
) {
  const candidateName = normalizeDuplicateKey(candidate.name);

  return leagues.some((league) => {
    return (
      league.id !== candidate.id &&
      league.country_id === candidate.country_id &&
      normalizeDuplicateKey(league.name) === candidateName
    );
  });
}

export function hasDuplicateSquadMembership(
  memberships: Array<{ id?: string; player_id: string; team_id: string; season_id: string }>,
  candidate: { id?: string; player_id: string; team_id: string; season_id: string }
) {
  return memberships.some((membership) => {
    return (
      membership.id !== candidate.id &&
      membership.player_id === candidate.player_id &&
      membership.team_id === candidate.team_id &&
      membership.season_id === candidate.season_id
    );
  });
}

function allowed(): DeleteCheck {
  return {
    canDelete: true,
    reason: null
  };
}
