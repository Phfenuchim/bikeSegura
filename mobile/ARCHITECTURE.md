# BikeSegura Mobile - Estrutura Modular

## Arquitetura

Este projeto segue uma arquitetura modular para facilitar manutenção e debug.

### Estrutura de Pastas

```
src/
├── components/          # Componentes reutilizáveis
│   ├── IncidentModal.tsx
│   ├── SOSModal.tsx
│   └── SavedRoutesModal.tsx
├── modules/             # Módulos de funcionalidades
│   ├── map/
│   │   ├── useMapData.ts       # Hook para dados do mapa
│   │   └── useMapFilters.ts    # Hook para filtros de visualização
│   ├── planner/
│   │   ├── useRoutePlanning.ts # Hook para planejamento de rotas
│   │   └── usePlanningState.ts # Estado de planejamento (legado)
│   └── routes/
│       └── useSavedRoutes.ts   # Hook para rotas salvas
├── api/
│   ├── client.ts               # Definições de API
│   └── httpClient.ts           # Cliente HTTP
├── Map.tsx                     # Componente principal do mapa
├── App.tsx                     # Configuração de navegação
└── ...
```

## Princípios de Modularização

### 1. **Separação de Responsabilidades**
- **Hooks Customizados**: Lógica de estado e negócio
- **Componentes**: UI e apresentação
- **API Client**: Comunicação com backend

### 2. **Padrão por Módulo**

#### Backend
Cada módulo segue a estrutura MVC:
```
modules/
└── [feature]/
    ├── models.py       # Modelos de dados (SQLAlchemy)
    ├── repositories.py # Acesso a dados (CRUD)
    ├── services.py     # Lógica de negócio
    └── controllers.py  # Endpoints REST
```

#### Frontend
Cada funcionalidade possui:
```
modules/
└── [feature]/
    ├── use[Feature].ts # Hook customizado
    └── [Feature].tsx   # Componente (se necessário)
```

### 3. **Hooks Customizados**

#### `useMapData` 
Gerencia dados do mapa (incidentes, SOS, pontos de apoio)
```typescript
const { incidentsList, supportPoints, sosList, routes, refreshData } = useMapData();
```

#### `useMapFilters`
Gerencia visibilidade de elementos no mapa
```typescript
const { showIncidents, showSOS, showSupport, toggleIncidents, ... } = useMapFilters();
```

#### `useRoutePlanning`
Gerencia todo o fluxo de planejamento de rotas
```typescript
const { isPlanning, origin, destination, startPlanning, saveRoute, ... } = useRoutePlanning();
```

#### `useSavedRoutes`
Gerencia rotas salvas do usuário
```typescript
const { savedRoutes, toggleSave, shareRoute } = useSavedRoutes();
```

### 4. **Componentes Reutilizáveis**

#### Modais
- `IncidentModal`: Reportar incidentes com tipo
- `SOSModal`: Enviar pedido de socorro
- `SavedRoutesModal`: Listar e carregar rotas salvas

Todos seguem o padrão de props:
```typescript
type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (...args) => Promise<void>;
  // ... props específicas
}
```

## Benefícios

1. **Manutenibilidade**: Cada funcionalidade está isolada
2. **Testabilidade**: Hooks e componentes podem ser testados isoladamente
3. **Reutilização**: Componentes e hooks podem ser usados em outras telas
4. **Debug**: Mais fácil identificar onde está o problema
5. **Escalabilidade**: Fácil adicionar novos recursos

## Exemplo de Adição de Nova Funcionalidade

### 1. Backend
```bash
# Criar novo módulo
mkdir Back/app/modules/nova_feature
touch Back/app/modules/nova_feature/{__init__,models,repositories,services,controllers}.py
```

### 2. Frontend
```bash
# Criar hook customizado
touch mobile/src/modules/nova_feature/useNovaFeature.ts

# Criar componente (se necessário)
touch mobile/src/components/NovaFeatureModal.tsx
```

### 3. Integração
```typescript
// Em Map.tsx ou outra tela
import { useNovaFeature } from "./modules/nova_feature/useNovaFeature";

export default function Screen() {
  const { data, actions } = useNovaFeature();
  // usar data e actions
}
```

## Métricas de Código

### Antes da Refatoração
- `Map.tsx`: 550 linhas (monolítico)
- Difícil manutenção e debug

### Depois da Refatoração
- `Map.tsx`: 369 linhas (-33%)
- `useRoutePlanning.ts`: 118 linhas
- `useMapFilters.ts`: 18 linhas
- `IncidentModal.tsx`: 88 linhas
- `SOSModal.tsx`: 83 linhas
- `SavedRoutesModal.tsx`: 64 linhas

**Total**: Código mais organizado e testável
