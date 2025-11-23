import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Award, Sparkles, Check } from "lucide-react";

export default function LojaPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState("avatar");

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: shopItems = [] } = useQuery({
    queryKey: ['shop-items'],
    queryFn: () => base44.entities.ShopItem.filter({ is_available: true }),
  });

  const { data: userPurchases = [] } = useQuery({
    queryKey: ['user-purchases', user?.email],
    queryFn: () => base44.entities.UserPurchase.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const purchaseItemMutation = useMutation({
    mutationFn: async ({ item }) => {
      if ((user.points || 0) < item.price) {
        throw new Error("Pontos insuficientes!");
      }

      await base44.entities.UserPurchase.create({
        user_email: user.email,
        shop_item_id: item.id,
        price_paid: item.price,
        is_equipped: item.type === 'avatar'
      });

      const newPoints = (user.points || 0) - item.price;
      const updateData = { points: newPoints };
      
      if (item.type === 'avatar') {
        updateData.avatar = item.item_data?.emoji || item.icon;
      }

      await base44.auth.updateMe(updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      alert("🎉 Item comprado com sucesso!");
    },
    onError: (error) => {
      alert(`❌ ${error.message}`);
    }
  });

  const rarityColors = {
    comum: "bg-gray-100 text-gray-700 border-gray-300",
    raro: "bg-blue-100 text-blue-700 border-blue-300",
    epico: "bg-purple-100 text-purple-700 border-purple-300",
    lendario: "bg-amber-100 text-amber-700 border-amber-300"
  };

  const isPurchased = (itemId) => {
    return userPurchases.some(p => p.shop_item_id === itemId);
  };

  const filteredItems = shopItems.filter(item => item.type === selectedType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Loja de Recompensas</h1>
              <p className="text-gray-600 text-sm sm:text-base">Troque seus pontos por itens exclusivos!</p>
            </div>
            <div className="bg-gradient-to-r from-amber-100 to-amber-200 rounded-2xl px-4 py-3 border-2 border-amber-300 shadow-lg">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="text-xs text-amber-700 font-semibold">Seus Pontos</p>
                  <p className="text-2xl font-bold text-amber-900">{user?.points || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={selectedType} onValueChange={setSelectedType} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="avatar">Avatares</TabsTrigger>
            <TabsTrigger value="theme">Temas</TabsTrigger>
            <TabsTrigger value="badge">Badges</TabsTrigger>
            <TabsTrigger value="feature">Features</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedType} className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const purchased = isPurchased(item.id);
                const canAfford = (user?.points || 0) >= item.price;

                return (
                  <Card 
                    key={item.id}
                    className={`border-2 shadow-lg transition-all ${
                      purchased 
                        ? 'border-green-300 bg-gradient-to-br from-green-50 to-white'
                        : canAfford
                        ? 'border-emerald-200 hover:border-emerald-400'
                        : 'border-gray-200 opacity-75'
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl flex items-center justify-center text-3xl shadow-md">
                          {item.icon}
                        </div>
                        <Badge className={`${rarityColors[item.rarity]} border text-xs`}>
                          {item.rarity}
                        </Badge>
                      </div>

                      <h3 className="font-bold text-gray-900 mb-2">{item.name}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span className="font-bold text-amber-600">{item.price} pts</span>
                        </div>

                        {purchased ? (
                          <Badge className="bg-green-500 text-white">
                            <Check className="w-3 h-3 mr-1" />
                            Comprado
                          </Badge>
                        ) : (
                          <Button
                            onClick={() => purchaseItemMutation.mutate({ item })}
                            disabled={!canAfford || purchaseItemMutation.isLoading}
                            size="sm"
                            className={`${
                              canAfford
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-gray-300 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingBag className="w-4 h-4 mr-1" />
                            Comprar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum item disponível nesta categoria</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}