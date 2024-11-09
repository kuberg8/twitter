const fs = require('fs');
const path = require('path');

// Путь к скомпилированному файлу index.html
const indexPath = path.join(__dirname, 'build', 'index.html');

// Путь к создаваемому файлу 404.html
const notFoundPagePath = path.join(__dirname, 'build', '404.html');

// Функция для создания 404.html
const create404Page = () => {
  // Проверяем, существует ли файл index.html
  if (fs.existsSync(indexPath)) {
    // Считываем содержимое index.html
    fs.readFile(indexPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Ошибка при чтении файла index.html:', err);
        return;
      }
      // Сохраняем его как 404.html
      fs.writeFile(notFoundPagePath, data, (err) => {
        if (err) {
          console.error('Ошибка при создании файла 404.html:', err);
        } else {
          console.log('404.html успешно создан!');
        }
      });
    });
  } else {
    console.error('Файл index.html не найден!');
  }
};

create404Page();
