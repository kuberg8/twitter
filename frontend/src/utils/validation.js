export const validation = (values = {}, requiredFields = []) => {
  const errors = {};
  const emailRegular = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  requiredFields.forEach((key) => {
    if (!String(values[key] || '').trim()) {
      errors[key] = 'Заполните поле';
    } else if (key === 'email' && !emailRegular.test(values[key])) {
      errors[key] = 'Введите корректный email';
    }
  });

  return errors;
};
