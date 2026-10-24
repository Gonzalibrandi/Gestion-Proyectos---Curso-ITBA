import { useMutation, useQueryClient } from '@tanstack/react-query';
import { columnService } from '../../api/columnService';
import { toast } from 'sonner';

export const useCreateColumn = (boardId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => columnService.createColumn(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Columna creada');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear la columna');
    },
  });
};

export const useDeleteColumn = (boardId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => columnService.deleteColumn(boardId, data.columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Columna eliminada');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar la columna');
    },
  });
};
