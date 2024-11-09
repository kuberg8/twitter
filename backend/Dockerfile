FROM node:16

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем все остальные файлы
COPY . .

# Указываем переменную среды для порта
ENV PORT=3000

# Открываем порт
EXPOSE 3000

# Запускаем сервер
CMD ["npm", "run", "dev"]