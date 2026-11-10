/**
 * Formato do pedido para quem não é da loja (tela de acompanhamento).
 *
 * Fica num lugar só porque duas rotas diferentes devolvem esse pedido: a API
 * pública e o aviso de mudança de status pelo Socket.io. Se os dois divergirem,
 * a tela do cliente quebra só quando o status muda — o pior tipo de bug.
 */
export function pedidoPublico(pedido) {
  return {
    _id: pedido._id,
    numero: pedido.numero,
    status: pedido.status,
    tipo: pedido.tipo,
    cliente: pedido.cliente,
    endereco: pedido.endereco,
    bairroNome: pedido.bairroNome,
    taxaEntrega: pedido.taxaEntrega,
    itens: pedido.itens,
    subtotal: pedido.subtotal,
    total: pedido.total,
    pagamento: pedido.pagamento,
    trocoPara: pedido.trocoPara,
    observacao: pedido.observacao,
    // Só para a tela do cliente explicar: "a loja aceitou automaticamente".
    aceitoAutomaticamente: Boolean(pedido.aceitoAutomaticamente),
    criadoEm: pedido.criadoEm,
  }
}
