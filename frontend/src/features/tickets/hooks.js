import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketService } from '../../api/ticketService';
import { toast } from 'sonner';

// Los IDs de columna y ticket llegan en las variables de mutate(), no al crear el hook
export const useCreateTicket = (boardId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, ...data }) => ticketService.createTicket(boardId, columnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Ticket creado');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear el ticket');
    },
  });
};

export const useUpdateTicket = (boardId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, ticketId, changes }) => ticketService.updateTicket(boardId, columnId, ticketId, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Ticket actualizado');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar el ticket');
    },
  });
};

export const useDeleteTicket = (boardId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, ticketId }) => ticketService.deleteTicket(boardId, columnId, ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Ticket eliminado');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar el ticket');
    },
  });
};
