

import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Bike, Map, User, Award, Route, Share2, Calendar, Target, ShoppingBag, Settings, Menu, X, Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import NotificationBell from "./components/notifications/NotificationBell";
import NotificationSystem from "./components/notifications/NotificationSystem";
import AchievementChecker from "./components/gamification/AchievementChecker";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });

  const NavLink = ({ to, icon: Icon, label, showOnMobile = true }) => {
    const isActive = location.pathname === createPageUrl(to);
    return (
      <Link
        to={createPageUrl(to)}
        onClick={() => setMenuOpen(false)}
        className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors touch-manipulation ${
          showOnMobile ? '' : 'hidden sm:flex'
        } ${
          isActive
            ? "bg-emerald-100 text-emerald-700"
            : "text-gray-600 active:bg-gray-100"
        }`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <Icon className="w-5 h-5" />
      </Link>
    );
  };

  const MobileMenuLink = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === createPageUrl(to);
    return (
      <Link
        to={createPageUrl(to)}
        onClick={() => setMenuOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          isActive ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 safe-top safe-bottom">
      <style>{`
        :root {
          --primary-green: #10b981;
          --primary-blue: #3b82f6;
          --danger-red: #ef4444;
          --dark-text: #1f2937;
        }
      `}</style>

      <NotificationSystem />
      <AchievementChecker />
      
      {/* Header Mobile-Optimized */}
      <header className="bg-white border-b border-emerald-200 sticky top-0 z-50 shadow-md safe-top">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between h-16">
            <Link 
              to={createPageUrl("Mapa")} 
              className="flex items-center gap-2 group shrink-0 touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <Bike className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-emerald-700">BikeSegura</h1>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="Mapa" icon={Map} label="Mapa" />
              <NavLink to="MinhasRotas" icon={Route} label="Rotas" />
              <NavLink to="RotasComunitarias" icon={Share2} label="Comunidade" />
              <NavLink to="Feed" icon={Activity} label="Feed" />
              <NavLink to="EventosDeRotas" icon={Calendar} label="Eventos" />
              <NavLink to="Ranking" icon={Award} label="Ranking" />
              <NavLink to="Desafios" icon={Target} label="Desafios" />
              <NavLink to="Loja" icon={ShoppingBag} label="Loja" />

              <div className="w-[1px] h-6 bg-gray-300 mx-1" />

              <NotificationBell />
              <NavLink to="Perfil" icon={User} label="Perfil" />
              <NavLink to="Configuracoes" icon={Settings} label="Config" />

              {user && (
                <div className="ml-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-amber-200 rounded-full border border-amber-300 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-900">
                    {user.points || 0}
                  </span>
                </div>
              )}
            </nav>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center gap-1">
              <NavLink to="Mapa" icon={Map} label="Mapa" showOnMobile={true} />
              <NavLink to="Feed" icon={Activity} label="Feed" showOnMobile={true} />
              <NavLink to="MinhasRotas" icon={Route} label="Rotas" showOnMobile={true} />
              
              <NotificationBell />

              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-w-[44px] min-h-[44px]"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Bike className="w-5 h-5 text-emerald-600" />
                      Menu
                    </SheetTitle>
                  </SheetHeader>
                  
                  {user && (
                    <div className="mt-4 mb-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-3xl">{user.avatar || '🚴'}</div>
                        <div>
                          <p className="font-bold text-gray-900">{user.full_name}</p>
                          <p className="text-xs text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-sm text-gray-600">Pontos</span>
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-amber-600" />
                          <span className="font-bold text-amber-900">{user.points || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <MobileMenuLink to="RotasComunitarias" icon={Share2} label="Comunidade" />
                    <MobileMenuLink to="EventosDeRotas" icon={Calendar} label="Eventos" />
                    <MobileMenuLink to="Ranking" icon={Award} label="Ranking" />
                    <MobileMenuLink to="Desafios" icon={Target} label="Desafios" />
                    <MobileMenuLink to="Loja" icon={ShoppingBag} label="Loja" />
                    
                    <div className="my-3 border-t" />
                    
                    <MobileMenuLink to="Perfil" icon={User} label="Meu Perfil" />
                    <MobileMenuLink to="Configuracoes" icon={Settings} label="Configurações" />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with safe-area padding */}
      <main className="relative safe-bottom">
        {children}
      </main>
    </div>
  );
}

