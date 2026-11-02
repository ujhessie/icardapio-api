// Erro de negócio com status HTTP. O tratador de erros transforma em { erro }.
export class ApiError extends Error {
  constructor(status, mensagem) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
  }
}
