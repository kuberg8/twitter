export const validation = (values = {}, requiredFields = []) => {
  const errors = {};

  requiredFields.forEach((key) => {
    if (!values[key]) errors[key] = "Required";
    else if (
      key === "email" &&
      !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(values[key])
    ) {
      errors[key] = "Email is invalid";
    }
  });

  return errors;
};
