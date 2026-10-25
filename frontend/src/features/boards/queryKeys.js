// Query keys de TanStack Query (requerimientos.md §9.1): un único lugar para no escribirlas a mano
export const boardKeys = {
  all: ['boards'],
  detail: (boardId) => ['board', boardId],
}
