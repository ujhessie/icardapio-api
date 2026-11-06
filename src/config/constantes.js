// Valores fixos usados no sistema inteiro.

export const PAPEIS = {
  SUPERADMIN: 'superadmin',
  DONO: 'dono',
  ATENDENTE: 'atendente',
}

export const STATUS_PEDIDO = {
  NOVO: 'novo',
  ACEITO: 'aceito',
  PREPARANDO: 'preparando',
  PRONTO: 'pronto',
  SAIU_ENTREGA: 'saiu_entrega',
  ENTREGUE: 'entregue',
  CANCELADO: 'cancelado',
}

// Ordem do kanban. Serve para impedir que o status volte para trás.
export const ORDEM_STATUS = [
  STATUS_PEDIDO.NOVO,
  STATUS_PEDIDO.ACEITO,
  STATUS_PEDIDO.PREPARANDO,
  STATUS_PEDIDO.PRONTO,
  STATUS_PEDIDO.SAIU_ENTREGA,
  STATUS_PEDIDO.ENTREGUE,
]

export const TIPOS_PEDIDO = {
  DELIVERY: 'delivery',
  BALCAO: 'balcao',
}

// Situação da loja, controlada pelo superadmin.
export const SITUACOES_LOJA = {
  PENDENTE: 'pendente',
  ATIVA: 'ativa',
  SUSPENSA: 'suspensa',
}

export const FORMAS_PAGAMENTO = ['dinheiro', 'pix', 'cartao']

// Tempo alvo de cada etapa do atendimento, em minutos. É só o padrão: cada
// loja ajusta o seu em Configurações.
export const TEMPOS_PADRAO = {
  aceitar: 5,
  preparar: 5,
  pronto: 30,
  entregar: 10,
}

export const TEMPO_MIN = 1
export const TEMPO_MAX = 240

// Pedido em aberto continua sendo "de agora", mesmo que tenha ficado de ontem:
// é o que faz o contador da fila bater com o quadro.
export const STATUS_EM_ABERTO = [
  STATUS_PEDIDO.NOVO,
  STATUS_PEDIDO.ACEITO,
  STATUS_PEDIDO.PREPARANDO,
  STATUS_PEDIDO.PRONTO,
  STATUS_PEDIDO.SAIU_ENTREGA,
]
