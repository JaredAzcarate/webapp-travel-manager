"use client";

import type { FeedbackTicketWithId } from "@/features/feedback/models/feedbackTickets.model";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useFeedbackTicketsList(enabled = true) {
  return useQuery({
    queryKey: ["feedbackTickets"],
    queryFn: async (): Promise<FeedbackTicketWithId[]> => {
      const res = await fetch("/api/feedback-tickets");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Erro ao carregar");
      }
      const data = await res.json();
      return data.tickets as FeedbackTicketWithId[];
    },
    enabled,
  });
}

export function useSubmitPublicFeedback() {
  return useMutation({
    mutationFn: async (payload: {
      type: "ERROR" | "SUGGESTION";
      message: string;
      pageUrl?: string;
    }) => {
      const res = await fetch("/api/feedback-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Erro ao enviar");
      }
      return data;
    },
  });
}

export function useUpdateFeedbackTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      status?: "OPEN" | "ARCHIVED";
      notes?: string;
    }) => {
      const res = await fetch(`/api/feedback-tickets/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: payload.status,
          notes: payload.notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Erro ao atualizar");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbackTickets"] });
    },
  });
}

export function useDeleteFeedbackTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/feedback-tickets/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Erro ao eliminar");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbackTickets"] });
    },
  });
}
