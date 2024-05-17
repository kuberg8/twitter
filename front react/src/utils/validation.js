export const validation = (values = {}, requiredFields = []) => {
  const errors = {};
  const emailRegular = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;

  requiredFields.forEach((key) => {
    if (!values[key]) {
      errors[key] = "Required";
    } else if (key === "email" && !emailRegular.test(values[key])) {
      errors[key] = "Email is invalid";
    }
  });

  return errors;
};
