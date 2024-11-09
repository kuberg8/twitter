# Fullstack app

## Использование в режиме разработки

### Настройки `.env`

Пример настроек см. файл `.env.example`

Для ведения разработки создайте файл `.env` копированием из файла `.env.example` и отредактируйте его в соответствии с потребностями в папках frontend и backend.

### Запуск проигрывателя в режиме "горячей" перезагрузки изменений

```bash
docker compose up -d --build
```

```npm script
npm run dev:up
```

Приложения будут доступны по адресам

- frontend - `http://localhost:3001`
- backend - `http://localhost:3000`