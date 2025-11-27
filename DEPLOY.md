# Guia de Deploy

Este documento contém instruções para fazer deploy do projeto em ambientes gratuitos.

## Opções de Deploy Gratuito

### 1. Railway (Recomendado)

Railway oferece um plano gratuito generoso e é fácil de configurar.

#### Backend

1. Acesse [Railway](https://railway.app)
2. Crie uma nova conta ou faça login
3. Clique em "New Project" > "Deploy from GitHub repo"
4. Selecione este repositório
5. Configure as variáveis de ambiente:
   - `MONGO_URI`: URI do MongoDB (use MongoDB Atlas gratuito ou Railway MongoDB)
   - `JWT_SECRET`: Uma string aleatória para assinar tokens JWT
   - `PORT`: Railway define automaticamente, mas você pode usar 3000
6. Railway detectará automaticamente o `package.json` na pasta `backend/`
7. O deploy será feito automaticamente

#### Frontend

1. Crie um novo serviço no mesmo projeto Railway
2. Configure o diretório raiz como `frontend/`
3. Configure as variáveis de ambiente:
   - `VITE_API_URL`: URL do backend (ex: `https://seu-backend.up.railway.app`)
4. Railway fará o build e deploy automaticamente

#### MongoDB

Railway oferece MongoDB como addon:
1. No projeto Railway, clique em "New" > "Database" > "MongoDB"
2. Railway criará automaticamente e fornecerá a `MONGO_URI`

### 2. Render

Render também oferece um plano gratuito, mas com algumas limitações (spins down após inatividade).

#### Backend

1. Acesse [Render](https://render.com)
2. Crie uma conta ou faça login
3. Clique em "New" > "Web Service"
4. Conecte seu repositório GitHub
5. Configure:
   - **Name**: `gdash-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm run start:prod`
   - **Root Directory**: `backend`
6. Adicione variáveis de ambiente:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `PORT=3000`
7. Clique em "Create Web Service"

#### Frontend

1. No Render, clique em "New" > "Static Site"
2. Configure:
   - **Name**: `gdash-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
3. Adicione variável de ambiente:
   - `VITE_API_URL`: URL do backend (ex: `https://gdash-backend.onrender.com`)
4. Clique em "Create Static Site"

#### MongoDB

1. No Render, clique em "New" > "MongoDB"
2. Configure o nome e região
3. Render fornecerá a `MONGO_URI` automaticamente

### 3. MongoDB Atlas (Gratuito)

Se preferir usar MongoDB Atlas separadamente:

1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta gratuita
3. Crie um novo cluster (plano gratuito M0)
4. Configure acesso de rede (adicione `0.0.0.0/0` para permitir de qualquer lugar)
5. Crie um usuário de banco de dados
6. Copie a connection string e use como `MONGO_URI`

## Variáveis de Ambiente Necessárias

### Backend

```env
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/gdash?retryWrites=true&w=majority
JWT_SECRET=seu-jwt-secret-aqui
NODE_ENV=production
PORT=3000
```

### Frontend

```env
VITE_API_URL=https://seu-backend-url.com
```

## Checklist de Deploy

- [ ] Backend deployado e acessível
- [ ] Frontend deployado e acessível
- [ ] MongoDB configurado e conectado
- [ ] Variáveis de ambiente configuradas
- [ ] Health check funcionando (`/health`)
- [ ] Swagger acessível (`/api`)
- [ ] Testes passando no CI/CD

## Troubleshooting

### Backend não inicia
- Verifique se todas as variáveis de ambiente estão configuradas
- Verifique os logs no painel do serviço
- Certifique-se de que o MongoDB está acessível

### Frontend não conecta ao backend
- Verifique se `VITE_API_URL` está correto
- Verifique se o backend permite CORS
- Verifique se o backend está rodando

### Erro de conexão MongoDB
- Verifique se o IP está na whitelist do MongoDB Atlas
- Verifique se a connection string está correta
- Verifique se o usuário tem permissões adequadas

## URLs de Exemplo

Após o deploy, você terá URLs como:
- Backend: `https://gdash-backend.railway.app` ou `https://gdash-backend.onrender.com`
- Frontend: `https://gdash-frontend.railway.app` ou `https://gdash-frontend.onrender.com`
- Swagger: `https://gdash-backend.railway.app/api`

