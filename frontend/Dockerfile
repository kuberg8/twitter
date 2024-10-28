# Используем официальный образ Node.js
FROM node:14

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем все файлы
COPY . .

# Строим проект
RUN npm run build

# Устанавливаем сервер для обслуживания фронтенда
FROM nginx:alpine

# Копируем собранные файлы в директорию Nginx
COPY --from=0 /usr/src/app/build /usr/share/nginx/html

# Открываем порт
EXPOSE 3001

# Запускаем сервер
CMD ["nginx", "-g", "daemon off;"]