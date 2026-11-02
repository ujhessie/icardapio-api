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

export const FORMAS_PAGAMENTO = ['dinheiro', 'pix', 'cartao']
