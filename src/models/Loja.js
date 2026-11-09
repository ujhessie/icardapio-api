import mongoose from 'mongoose'
import {
  FLUXO_PADRAO,
  MODOS_BALCAO,
  ORDEM_STATUS,
  SITUACOES_LOJA,
  TEMPO_MAX,
  TEMPO_MIN,
  TEMPOS_PADRAO,
} from '../config/constantes.js'

const horarioSchema = new mongoose.Schema(
  {
    // 0 = domingo … 6 = sábado (mesmo número do Date.getDay()).
    dia: { type: Number, required: true, min: 0, max: 6 },
    aberto: { type: Boolean, default: true },
    // "HH:MM". Fechar depois da meia-noite é permitido (ex: 18:00 → 02:00).
    abre: { type: String, default: '18:00' },
    fecha: { type: String, default: '23:00' },
  },
  { _id: false },
)

const dataEspecialSchema = new mongoose.Schema(
  {
    // "AAAA-MM-DD": vale só naquele dia, não em todo o dia da semana.
    data: { type: String, required: true },
    motivo: { type: String, trim: true, default: '' },
    fechado: { type: Boolean, default: true },
    abre: { type: String, default: '' },
    fecha: { type: String, default: '' },
  },
  { _id: false },
)

const temposSchema = new mongoose.Schema(
  {
    // Minutos que o pedido pode ficar em cada etapa antes de virar alerta.
    aceitar: { type: Number, default: TEMPOS_PADRAO.aceitar, min: TEMPO_MIN, max: TEMPO_MAX },
    preparar: { type: Number, default: TEMPOS_PADRAO.preparar, min: TEMPO_MIN, max: TEMPO_MAX },
    pronto: { type: Number, default: TEMPOS_PADRAO.pronto, min: TEMPO_MIN, max: TEMPO_MAX },
    entregar: { type: Number, default: TEMPOS_PADRAO.entregar, min: TEMPO_MIN, max: TEMPO_MAX },
  },
  { _id: false },
)

/*
 * Fluxo de pedidos da loja.
 *
 * `etapas` é o que aparece no painel E na tela de acompanhamento do cliente:
 * loja que só trabalha com delivery pode esconder "Pronto", por exemplo. O
 * status interno não muda — só deixa de ser mostrado.
 */
const fluxoPedidosSchema = new mongoose.Schema(
  {
    etapas: {
      type: [String],
      enum: ORDEM_STATUS,
      default: () => [...FLUXO_PADRAO.etapas],
    },
    // Pedido que chega já entra como "aceito", sem o lojista precisar clicar.
    autoAceite: { type: Boolean, default: FLUXO_PADRAO.autoAceite },
    modoBalcao: {
      type: String,
      enum: Object.values(MODOS_BALCAO),
      default: FLUXO_PADRAO.modoBalcao,
    },
  },
  { _id: false },
)

const lojaSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'O nome da loja é obrigatório'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    telefone: { type: String, trim: true, default: '' },
    endereco: {
      rua: { type: String, default: '' },
      numero: { type: String, default: '' },
      complemento: { type: String, default: '' },
      cidade: { type: String, default: '' },
      estado: { type: String, default: '' },
    },
    logo: { type: String, default: '' },
    // Foto do topo do cardápio (URL). Vazia = topo com a cor da loja, sem
    // buraco na tela: loja antiga continua bonita sem ter foto.
    capa: { type: String, default: '' },
    corPrimaria: { type: String, default: '#e85d04' },
    aberta: { type: Boolean, default: true },
    // Grade da semana. Vazia = loja sem grade cadastrada: vale só o interruptor
    // `aberta` (protege as lojas que existiam antes dos horários).
    horarios: { type: [horarioSchema], default: [] },
    datasEspeciais: { type: [dataEspecialSchema], default: [] },
    // Tempo alvo de cada etapa (minutos) — o lojista edita em Configurações.
    tempos: { type: temposSchema, default: () => ({ ...TEMPOS_PADRAO }) },
    // Quais etapas a loja mostra, se aceita pedido sozinho e como é o balcão.
    fluxoPedidos: { type: fluxoPedidosSchema, default: () => ({}) },
    // pendente = aguardando aprovação | ativa = liberada | suspensa = bloqueada
    situacao: {
      type: String,
      enum: Object.values(SITUACOES_LOJA),
      default: SITUACOES_LOJA.PENDENTE,
    },
    proximoNumero: { type: Number, default: 1 },
  },
  { timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' } },
)

export const Loja = mongoose.model('Loja', lojaSchema)
