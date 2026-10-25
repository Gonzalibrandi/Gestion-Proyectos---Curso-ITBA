import { useMutation, useQueryClient } from '@tanstack/react-query';
import { boardService } from '../../api/boardService';
import { toast } from 'sonner';

export const useCreateBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: boardService.createBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Tablero creado con éxito');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear el tablero');
    },
  });
};

export const useDeleteBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: boardService.deleteBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Tablero eliminado');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar el tablero');
    },
  });
};
