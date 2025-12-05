import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { api } from "../../api/client";

export function useSavedRoutes() {
  const queryClient = useQueryClient();
  const { data: savedRoutes = [], isFetching, refetch } = useQuery({ queryKey: ["saved-routes"], queryFn: () => api.savedRoutes() });

  const toggleSave = async (routeId: number, save: boolean) => {
    try {
      await api.saveRoute(routeId, save);
      queryClient.invalidateQueries({ queryKey: ["saved-routes"] });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Falha ao salvar/descadastrar rota");
    }
  };

  const shareRoute = async (routeId: number, note?: string) => {
    try {
      await api.shareRoute(routeId, note || "Compartilhado da tela de rotas salvas");
      Alert.alert("Ok", "Rota compartilhada na comunidade");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Falha ao compartilhar rota");
    }
  };

  return { savedRoutes, isFetchingSaved: isFetching, refetchSavedRoutes: refetch, toggleSave, shareRoute };
}
