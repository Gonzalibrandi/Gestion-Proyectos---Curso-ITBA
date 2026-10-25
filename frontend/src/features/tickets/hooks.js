import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketService } from '../../api/ticketService';
import { toast } from 'sonner';

export const useCreateTicket = (boardId, columnId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => ticketService.createTicket(boardId, columnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Ticket creado');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear el ticket');
    },
  });
};

export const useUpdateTicket = (boardId, columnId, ticketId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes) => ticketService.updateTicket(boardId, columnId, ticketId, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Ticket actualizado');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar el ticket');
    },
  });
};

export const useDeleteTicket = (boardId, columnId, ticketId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => ticketService.deleteTicket(boardId, columnId, ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Ticket eliminado');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar el ticket');
    },
  });
};
