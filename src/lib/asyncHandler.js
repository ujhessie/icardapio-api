// Envolve controllers async para que qualquer erro caia no tratador de erros.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}
