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

// Ordem do kanban: define o caminho normal do atendimento (o status pode
// voltar, mas esse é o sentido em que ele "avança").
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
  // Pedido lançado pelo próprio painel, para consumo no salão.
  MESA: 'mesa',
}

// Tipos que o cliente pode escolher sozinho no cardápio. Mesa é coisa do
// balcão: quem lança é o atendente, não o cliente.
export const TIPOS_DO_CLIENTE = [TIPOS_PEDIDO.DELIVERY, TIPOS_PEDIDO.BALCAO]

// Como o balcão aparece para o cliente no cardápio.
export const MODOS_BALCAO = {
  CLIENTE: 'cliente', // pode pedir e retirar no balcão
  LINK: 'link', // só por link exclusivo do balcão
  DESLIGADO: 'off', // sem balcão
}

// Fluxo de etapas da loja. Loja antiga (sem o campo gravado) usa exatamente
// isto — por isso o padrão mora aqui e não só no schema do Mongoose, que não
// alcança documento já existente.
export const FLUXO_PADRAO = {
  etapas: [...ORDEM_STATUS],
  autoAceite: false,
  modoBalcao: MODOS_BALCAO.CLIENTE,
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
