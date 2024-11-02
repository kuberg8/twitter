const initialState = {
  alertText: '',
  alertShow: false,
  alertType: 'success',
};

const alertReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SHOW_ALERT':
      return {
        ...state,
        alertText: action.payload.text,
        alertShow: true,
        alertType: action.payload.type,
      };
    case 'HIDE_ALERT':
      return {
        ...state,
        alertShow: false,
      };
    default:
      return state;
  }
};

export const showAlert = (text, type) => {
  return {
    type: 'SHOW_ALERT',
    payload: { text, type },
  };
};

export const hideAlert = () => {
  return {
    type: 'HIDE_ALERT',
  };
};

export default alertReducer;
