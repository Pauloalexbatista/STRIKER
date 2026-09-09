# ⚽ STRIKER - Mobile-First Neon Football Prediction WebApp (PWA)

WebApp de palpites e previsões de futebol com estética néon, optimizada especificamente para smartphones (iOS e Android) com suporte a PWA ("Adicionar ao Ecrã Principal"), concebida para integração no portal néon do VPS (`testeweb.site`) ao lado de *Oficina Pinball* e *Mini F1 Racing*.

---

## 🌟 Principais Funcionalidades

1. **Mobile-First Nativo & PWA:**
   - Ecrã completo sem barras do browser (`standalone`).
   - Suporte a Safe Areas (Notch de iPhone, Home Indicator, status bar Android).
   - Sem atraso de toque (*zero-delay touch* com `touch-action: manipulation`).
   - Manifesto PWA configurado com cores dinâmicas.

2. **Cores Oficiais Dinâmicas por Clube:**
   - 🟢 **Sporting CP:** Verde néon `#00D166` e branco.
   - 🔴 **SL Benfica:** Vermelho néon `#FF2E4D` e branco.
   - 🔵 **FC Porto:** Azul néon `#007AFF` e branco.
   - 🟡 **Striker Gold:** Dourado néon `#FFD700`.
   - A interface adapta cartões, destaques e relatórios às cores do clube ativo.

3. **Economia Base 0.00 pts (Pontuação ao Cêntimo):**
   - Todos os jogadores começam a **0.00 pts**.
   - Ao apito inicial (fecho ao segundo): `-1.00 pt` de taxa de entrada por aposta.
   - Ao apito final: o pote de pontos do grupo divide-se equitativamente pelos vencedores (ex: 10 pts a dividir por 2 = `+5.00 pts` brutos, resultando em `+4.00 pts` líquidos de lucro!).
   - Precisão e exibição com 2 casas decimais.

4. **Gaveta Relatório de 3 Colunas Dinâmico (Casa | Empate | Fora):**
   - **Antes do Apito:** Apostas secretas para garantir jogo limpo (exibe apenas o total acumulado por coluna).
   - **Ao Apito Inicial:** Apostas reveladas com nomes de utilizadores e taxa `-1.00 pt`.
   - **Ao Apito Final:** Coluna vencedora iluminada a néon com os pontos líquidos ganhos (`+X.XX pts`).

5. **Rankings & Classificações:**
   - **Top da Jornada:** Selector de jornadas (1 a 34), pódio com medalhas ouro/prata/bronze.
   - **Top Striker Geral:** Saldo acumulado (+/-) e percentagem de eficácia.

6. **Painel de Simulação Integrado (⚡):**
   - Permite disparar apitos iniciais e finais, registar resultados e observar a actualização do pote e saldos em tempo real.

---

## 🚀 Como Executar Localmente

### 1. Instalar dependências
```bash
# Na raiz:
npm --prefix client install
npm --prefix server install
```

### 2. Modo Desenvolvimento
```bash
# Terminal 1 - Backend:
npm --prefix server run dev

# Terminal 2 - Frontend:
npm --prefix client run dev
```

### 3. Build & Produção
```bash
npm --prefix client run build
npm --prefix server start
# Aplicação acessível em http://localhost:3001
```

---

## 🌐 Instalação no VPS (`testeweb.site`)

### 1. Clonar o repositório no VPS
```bash
cd /var/www
git clone https://github.com/Pauloalexbatista/STRIKER.git striker
cd striker
npm --prefix client install
npm --prefix server install
npm --prefix client run build
```

### 2. Iniciar com PM2
```bash
pm2 start ecosystem.config.cjs
pm2 save
```

### 3. Configuração Nginx (Subcaminho `/striker` ou Subdomínio)
Exemplo para integrar no portal `testeweb.site`:
```nginx
location /striker/ {
    proxy_pass http://127.0.0.1:3001/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```
