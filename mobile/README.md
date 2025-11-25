# BikeSegura Mobile (Expo)

App Expo + React Native (TypeScript) apontando para a API Flask.

## Rodar
```bash
cd mobile
npm install
npm start # expo start
```
- Ajuste `extra.API_URL` em `app.json` se for acessar a API em outro host (use o IP da máquina do backend).
- No emulador/dispositivo, abra o app Expo e use o QR code.

## Estrutura
- `app/` (expo-router): `_layout.tsx` com React Query, `index.tsx` com resumo do mapa.
- `src/api/httpClient.ts`: cliente fetch lendo `API_URL` das extras do Expo.

Próximos passos: adicionar telas para login/signup, mapa (React Native Maps), feed e alertas, reutilizando os endpoints do backend.
