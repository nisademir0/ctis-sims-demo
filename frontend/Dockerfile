FROM node:20-alpine

WORKDIR /app

# Package.json dosyalarını kopyala (önce cache için)
COPY package*.json ./

# Sadece package.json varsa install yapar, yoksa hata vermemesi için || true
RUN npm install || true

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]