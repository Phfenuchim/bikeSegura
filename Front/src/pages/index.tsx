import Layout from "./Layout.tsx";

import Mapa from "./Mapa";

import Perfil from "./Perfil";

import Ranking from "./Ranking";

import Configuracoes from "./Configuracoes";

import MinhasRotas from "./MinhasRotas";

import RotasComunitarias from "./RotasComunitarias";

import EventosDeRotas from "./EventosDeRotas";

import Desafios from "./Desafios";

import Loja from "./Loja";

import Feed from "./Feed";

import PerfilPublico from "./PerfilPublico";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Mapa: Mapa,
    
    Perfil: Perfil,
    
    Ranking: Ranking,
    
    Configuracoes: Configuracoes,
    
    MinhasRotas: MinhasRotas,
    
    RotasComunitarias: RotasComunitarias,
    
    EventosDeRotas: EventosDeRotas,
    
    Desafios: Desafios,
    
    Loja: Loja,
    
    Feed: Feed,
    
    PerfilPublico: PerfilPublico,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Mapa />} />
                
                
                <Route path="/Mapa" element={<Mapa />} />
                
                <Route path="/Perfil" element={<Perfil />} />
                
                <Route path="/Ranking" element={<Ranking />} />
                
                <Route path="/Configuracoes" element={<Configuracoes />} />
                
                <Route path="/MinhasRotas" element={<MinhasRotas />} />
                
                <Route path="/RotasComunitarias" element={<RotasComunitarias />} />
                
                <Route path="/EventosDeRotas" element={<EventosDeRotas />} />
                
                <Route path="/Desafios" element={<Desafios />} />
                
                <Route path="/Loja" element={<Loja />} />
                
                <Route path="/Feed" element={<Feed />} />
                
                <Route path="/PerfilPublico" element={<PerfilPublico />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
