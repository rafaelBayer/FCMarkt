export function getErrorMessage(error: unknown, fallback = "Nao foi possivel concluir a acao.") {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
