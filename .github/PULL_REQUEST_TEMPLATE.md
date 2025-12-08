## 🚀 Desafio GDASH 2025/02 - Sistema de Coleta e Visualização de Dados Climáticos

### 👤 Candidato

<!-- Seu nome completo -->

**Nome:** [Seu Nome Completo]

### 📹 Vídeo Explicativo (Obrigatório)

#### Versão Compacta (≤ 5 minutos - Requisito do Desafio)

**🎬 [Link do Vídeo Compacto no YouTube](https://youtu.be/Ws1th0XdNow)**

Esta versão atende ao requisito do desafio de **máximo 5 minutos** e cobre:

- ✅ Arquitetura geral da aplicação
- ✅ Pipeline de dados (Python → RabbitMQ → Go → NestJS → Frontend)
- ✅ Insights de IA e funcionalidades principais
- ✅ Demonstração da aplicação rodando via Docker Compose

#### Versão Completa (Opcional - Detalhada)

**🎬 [Link do Vídeo Completo no YouTube](https://youtu.be/mO5NCcF9wMs)**

Versão estendida com demonstração aprofundada de todas as funcionalidades.

---

## 📋 Visão Geral do Sistema

Sistema completo de coleta, processamento e visualização de dados climáticos utilizando microserviços orquestrados com Docker Compose.

### 🏗️ Arquitetura Implementada

```
┌─────────────┐
│  Collector  │ (Python - Coleta dados climáticos)
│   Python    │
└──────┬──────┘
       │
       ├─── Modo Direct ──→ Backend
       │
       └─── Modo Rabbit ──→ ┌──────────────┐
                            │  RabbitMQ    │
                            │ Message      │
                            │   Broker     │
                            └──────┬───────┘
                                   │
                            ┌──────▼───────┐
                            │   Worker     │ (Go - Consome fila)
                            │     Go       │
                            └──────┬───────┘
                                   │
                            ┌──────▼───────┐
                            │   Backend    │ (NestJS)
                            │   NestJS     │
                            └──────┬───────┘
                                   │
                            ┌──────▼───────┐
                            │   MongoDB    │
                            └──────────────┘
                                   ▲
                                   │
                            ┌──────┴───────┐
                            │   Frontend   │ (React + Vite)
                            │ React + Vite │
                            └──────────────┘
```

---

## ✅ Checklist de Requisitos do Desafio

### 🔧 Backend (NestJS + TypeScript)

- [x] **Autenticação JWT**

  - Sistema completo de registro/login
  - Guards para proteção de rotas
  - Refresh tokens
  - Rate limiting configurado

- [x] **CRUD de Usuários**

  - Listar, criar, editar, remover usuários
  - Controle de acesso (admin/usuário comum)
  - Validação com class-validator
  - Alteração de senha

- [x] **Logs de Clima (MongoDB)**

  - Armazenamento de dados climáticos
  - Schema: timestamp, temperatura, umidade, cidade
  - Endpoints de listagem com paginação
  - Filtros por cidade

- [x] **Insights de IA**

  - Endpoint `/weather/insights` com análises inteligentes
  - Cálculo de médias, tendências e alertas
  - Detecção de condições extremas
  - Recomendações contextuais

- [x] **Exportação de Dados**

  - Endpoint para exportar CSV
  - Endpoint para exportar XLSX
  - Dados formatados e prontos para análise

- [x] **Integração com API Pública Paginada (OPCIONAL)**

  - PokéAPI (listagem e detalhes de Pokémon)
  - Star Wars API - SWAPI (personagens e filmes)
  - Games API - RAWG (listagem de jogos)
  - Paginação completa implementada

- [x] **Swagger/OpenAPI**
  - Documentação completa da API em `/api`
  - Todos os endpoints documentados com exemplos
  - Interface interativa para testes

### 🐍 Collector (Python)

- [x] **Coleta de Dados Climáticos**

  - Integração com Open-Meteo API
  - Coleta periódica configurável (`COLLECT_INTERVAL`)
  - Dados da localização/cidade configurável

- [x] **Envio para Message Broker**
  - Modo `direct`: POST direto para o backend
  - Modo `rabbit`: Publicação no RabbitMQ
  - Retry automático em caso de falha
  - Logs detalhados com prefixo `[collector]`

### 🐹 Worker (Go)

- [x] **Consumo da Fila RabbitMQ**

  - Conexão com RabbitMQ via AMQP
  - Consumo da fila `weather`
  - Processamento de mensagens JSON

- [x] **Envio para Backend**
  - POST para `/weather/logs`
  - Retry com backoff exponencial (3 tentativas)
  - Ack/Nack adequado de mensagens
  - Graceful shutdown (SIGINT/SIGTERM)

### ⚛️ Frontend (React + Vite + TypeScript + Tailwind)

- [x] **Dashboard de Clima**

  - Exibição de dados climáticos reais
  - Cards de temperatura, umidade e condições
  - Gráficos interativos (Chart.js)
  - Tabela de registros históricos
  - Botões de exportação (CSV/XLSX)
  - Paginação e filtros por cidade

- [x] **Insights de IA no Frontend**

  - Cards com insights gerados pelo backend
  - Alertas visuais (calor extremo, chuva, etc.)
  - Recomendações contextuais
  - Visualizações adicionais

- [x] **Sistema de Autenticação**

  - Tela de login e registro
  - Rotas protegidas (Dashboard acessível apenas autenticado)
  - Persistência de token JWT
  - Logout

- [x] **CRUD de Usuários**

  - Interface completa com shadcn/ui
  - Listagem, criação, edição, remoção
  - Validação de formulários
  - Feedback visual (loading, erro, sucesso)

- [x] **Componentes shadcn/ui**

  - Button, Input, Table, Dialog, Toast
  - Card, Badge, Select, Label
  - Alert, Skeleton para loading states

- [x] **Página Opcional - API Pública**

  - Página `/explorar` com navegação entre APIs
  - PokéAPI com paginação e detalhes
  - Star Wars API com personagens e filmes
  - Games API com listagem paginada

- [x] **Sistema de Tema Claro/Escuro**
  - Toggle acessível com animações suaves
  - Persistência local (localStorage) e backend (MongoDB)
  - Script anti-FOUC (Flash of Unstyled Content)
  - Detecção automática da preferência do sistema

### 🐳 Docker & Infraestrutura

- [x] **Docker Compose**

  - Orquestração completa de todos os serviços
  - MongoDB, RabbitMQ, Backend, Frontend, Worker, Collector
  - Volumes persistentes para dados
  - Healthchecks configurados
  - Rede interna para comunicação entre serviços

- [x] **Variáveis de Ambiente**

  - Arquivo `.env.example` completo e documentado
  - Todas as variáveis necessárias listadas
  - Instruções de segurança para produção
  - Comandos para gerar chaves seguras

- [x] **Dockerfiles Otimizados**
  - Multi-stage builds onde aplicável
  - Hot reload em desenvolvimento
  - Build otimizado para produção

---

## 🎯 Bônus Implementados

- [x] **Testes Automatizados**

  - Testes unitários no backend (Jest)
  - Testes unitários no frontend (Vitest)
  - Cobertura mínima de 70%
  - Testes de componentes React

- [x] **CI/CD (GitHub Actions)**

  - Pipeline automatizado
  - Execução de testes em cada push
  - Build de imagens Docker
  - Upload de cobertura para Codecov
  - Linting automático

- [x] **Deploy em Ambiente Gratuito**

  - Guias completos para Railway e Render
  - Configurações de produção documentadas
  - Instruções passo a passo

- [x] **Logs Detalhados**

  - Logs com prefixo `[service]` em cada componente
  - Rastreamento de fluxo de dados
  - Tratamento de erros detalhado

- [x] **Dashboard Avançado**

  - Múltiplos tipos de gráfico
  - Filtros e paginação
  - Exportação de dados
  - Interface responsiva e moderna

- [x] **Documentação Completa**
  - README extenso com todas as instruções
  - Guias de troubleshooting
  - Documentação de APIs
  - Exemplos de uso

---

## 🚀 Como Executar

### Pré-requisitos

- Docker e Docker Compose instalados
- Porta 3000 (backend), 5173 (frontend), 27017 (MongoDB), 5672 e 15672 (RabbitMQ) disponíveis

### Passo a Passo

1. **Clone o repositório** (se ainda não tiver):

```bash
git clone <url-do-repositorio>
cd desafio-gdash
```

2. **Configure o arquivo `.env`**:

```bash
cp .env.example .env
```

3. **⚠️ IMPORTANTE: Edite o arquivo `.env`** e preencha as variáveis obrigatórias (veja instruções no `.env.example`)

4. **Inicie todos os serviços**:

```bash
docker compose up --build
```

5. **Aguarde a inicialização** (30-60 segundos)

6. **Acesse os serviços**:
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3000
   - **Swagger/OpenAPI**: http://localhost:3000/api
   - **RabbitMQ Management**: http://localhost:15672 (guest/guest)

### Testando o Sistema

#### 1. Verificar Health do Backend

```bash
curl http://localhost:3000/health
# Resposta esperada: {"status":"ok"}
```

#### 2. Verificar Coleta de Dados

```bash
# Ver logs do collector
docker compose logs -f collector

# Ver logs do worker
docker compose logs -f worker

# Ver dados no backend
curl http://localhost:3000/weather/logs
```

#### 3. Acessar Dashboard

- Abra http://localhost:5173
- Faça login (ou registre um usuário)
- Veja os dados climáticos e insights

---

## 🌐 URLs Principais

| Serviço             | URL                             | Descrição                                |
| ------------------- | ------------------------------- | ---------------------------------------- |
| **Frontend**        | http://localhost:5173           | Interface web principal                  |
| **Backend API**     | http://localhost:3000           | API REST                                 |
| **Health Check**    | http://localhost:3000/health    | Status do backend                        |
| **Swagger/OpenAPI** | http://localhost:3000/api       | Documentação interativa da API           |
| **RabbitMQ UI**     | http://localhost:15672          | Interface de gerenciamento (guest/guest) |
| **MongoDB**         | mongodb://localhost:27017/gdash | Banco de dados                           |

---

## 👤 Usuário Padrão

Para testar o sistema, você pode:

1. **Registrar um novo usuário** via frontend em http://localhost:5173
2. **Ou usar a API** para criar usuário via Swagger em http://localhost:3000/api

**Endpoint de registro:**

```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "teste@gdash.com",
  "password": "senha123",
  "name": "Usuário Teste"
}
```

---

## 🔧 Modos de Operação do Collector

O collector suporta dois modos:

### Modo Direct (Padrão para Testes Rápidos)

```env
COLLECTOR_MODE=direct
```

Envia dados diretamente para o backend via HTTP POST.

### Modo Rabbit (Demonstra Pipeline Completo)

```env
COLLECTOR_MODE=rabbit
```

Publica mensagens no RabbitMQ → Worker Go consome → Envia para backend.

**Para alternar:**

1. Edite `.env` e mude `COLLECTOR_MODE`
2. Execute: `docker compose restart collector`

---

## 🧠 Insights de IA Implementados

O sistema analisa os dados climáticos e gera insights automáticos:

- **Análise de Tendências**: Detecta se temperatura está subindo/descendo
- **Alertas Inteligentes**: Identifica condições extremas (calor intenso, frio, chuva)
- **Classificação do Clima**: Categoriza como "agradável", "quente", "frio", etc.
- **Recomendações**: Sugestões baseadas nas condições atuais
- **Estatísticas**: Médias, máximas, mínimas de temperatura e umidade
- **Score de Conforto**: Pontuação de 0-100 baseada em múltiplos fatores

**Endpoint:** `GET /weather/insights`

---

## 📊 Estrutura do Projeto

```
desafio-gdash/
├── backend/              # API NestJS + TypeScript
│   ├── src/
│   │   ├── auth/        # Autenticação JWT
│   │   ├── users/       # CRUD usuários
│   │   ├── weather/     # Logs climáticos + insights
│   │   ├── pokemon/     # API pública (opcional)
│   │   ├── starwars/    # API pública (opcional)
│   │   └── games/       # API pública (opcional)
│   ├── Dockerfile
│   └── package.json
├── frontend/            # React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── pages/       # Dashboard, Login, Explorar
│   │   ├── components/  # Componentes shadcn/ui
│   │   ├── services/    # API client
│   │   └── theme/       # Sistema de tema
│   ├── Dockerfile
│   └── package.json
├── collector-python/    # Serviço de coleta Python
│   ├── collector.py
│   ├── Dockerfile
│   └── requirements.txt
├── worker-go/           # Worker Go para RabbitMQ
│   ├── main.go
│   ├── Dockerfile
│   └── go.mod
├── docker-compose.yml   # Orquestração completa
├── .env.example         # Variáveis de ambiente documentadas
└── README.md           # Documentação completa (1200+ linhas)
```

---

## 📈 Diferenciais Implementados

### 🎨 UX/UI Moderna

- Design responsivo e acessível
- Tema claro/escuro com persistência
- Animações suaves e feedback visual
- Componentes shadcn/ui de alta qualidade

### 🔐 Segurança

- Autenticação JWT robusta
- Rate limiting configurado
- Validação de dados em todas as camadas
- Variáveis de ambiente para credenciais
- CORS configurado adequadamente
- Documentação de segurança detalhada

### 📊 Observabilidade

- Logs estruturados com prefixos `[service]`
- Healthchecks em todos os serviços
- Rastreamento de fluxo de dados
- RabbitMQ Management UI para monitoramento

### 🧪 Qualidade de Código

- TypeScript em 100% do código (backend e frontend)
- Testes automatizados com boa cobertura
- ESLint e Prettier configurados
- CI/CD funcionando
- Código limpo e bem documentado

### 📚 Documentação Excepcional

- README com 1200+ linhas
- Guias de troubleshooting
- Instruções de deploy
- Exemplos de uso de todas as APIs
- Vídeos explicativos (compacto e completo)

---

## 🎥 Vídeos Explicativos

### Versão Compacta (≤ 5 minutos) - REQUISITO DO DESAFIO

**Link:** https://youtu.be/Ws1th0XdNow

Cobre todos os requisitos do desafio em até 5 minutos.

### Versão Completa (Detalhada) - OPCIONAL

**Link:** https://youtu.be/mO5NCcF9wMs

Demonstração aprofundada de todas as funcionalidades.

---

## 🔍 Detalhes Técnicos

### Tecnologias Utilizadas

**Backend:**

- NestJS (Node.js + TypeScript)
- MongoDB (Mongoose)
- JWT (Passport)
- Swagger/OpenAPI
- class-validator/class-transformer
- ExcelJS (exportação XLSX)

**Frontend:**

- React 18
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Chart.js (gráficos)
- React Router

**Collector:**

- Python 3.11
- Requests (HTTP)
- Pika (RabbitMQ)
- Open-Meteo API

**Worker:**

- Go 1.20
- AMQP (RabbitMQ)
- net/http

**Infraestrutura:**

- Docker & Docker Compose
- MongoDB
- RabbitMQ
- GitHub Actions (CI/CD)

---

## 📝 Notas Finais

Este projeto foi desenvolvido com foco em:

- ✅ Atender **todos** os requisitos obrigatórios do desafio
- ✅ Implementar **todos** os bônus sugeridos
- ✅ Demonstrar **boas práticas** de engenharia de software
- ✅ Criar uma **experiência de uso** excelente
- ✅ Fornecer **documentação clara** e completa
- ✅ Garantir que o sistema seja **facilmente executável** via Docker Compose

O sistema está **100% funcional**, **bem documentado** e **pronto para avaliação**.

---

## 🙏 Agradecimentos

Agradeço à equipe GDASH pela oportunidade de participar deste desafio técnico. Foi uma experiência enriquecedora que me permitiu demonstrar minhas habilidades em:

- Integração de múltiplas linguagens (TypeScript, Python, Go)
- Arquitetura de microserviços
- Message brokers e comunicação assíncrona
- Desenvolvimento full-stack moderno
- Aplicação prática de IA em análise de dados

Estou à disposição para esclarecimentos! 🚀

---

**Desenvolvido com ❤️ para o Desafio GDASH 2025/02**
