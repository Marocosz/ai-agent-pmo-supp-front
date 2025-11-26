# Dockerfile do Frontend (React/Vite)
FROM node:20-alpine

WORKDIR /app

# Copia dependências
COPY package*.json ./
RUN npm install

# Copia o código fonte
COPY . .

# Expõe a porta do Vite
EXPOSE 5173

# O "--host" é essencial para funcionar no Docker
CMD ["npm", "run", "dev", "--", "--host"]