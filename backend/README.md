# Начало работы с Express Node.js

Этот проект представляет собой бэкенд-сервис для работы с постами пользователей, разработанный на Node.js с использованием Express.

## Установка

### `npm install`
# или
### `yarn install`

## Настройка окружения

Создайте файл .env на основе образца. Скопируйте файл env.example и переименуйте его

### `cp env.example .env`

Затем откройте файл .env и настройте переменные окружения, такие как параметры подключения к базе данных и ключи аутентификации.

## Запуск MongoDB

Перед запуском проекта убедитесь, что MongoDB установлен и работает. Если MongoDB не установлен, следуйте инструкциям ниже для установки.

## Установка MongoDB

## На Ubuntu:
### `sudo apt update`
### `sudo apt install -y mongodb`

## На macOS с использованием Homebrew:
### `brew tap mongodb/brew`
### `brew install mongodb-community`

## Запустите сервер MongoDB:
# На Ubuntu
### `sudo service mongodb start`

# На macOS
### `brew services start mongodb/brew/mongodb-community`

## Запуск проекта
### `npm start`
# или
### `yarn start`