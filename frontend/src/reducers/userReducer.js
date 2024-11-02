const initialState = {
  userId: localStorage.getItem('userId') || null,
  isAuth: !!localStorage.getItem('token'),
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        userId: action.payload.userId,
        isAuth: true,
      };
    case 'LOGOUT':
      return {
        ...state,
        userId: null,
        isAuth: false,
      };
    case 'SET_AUTH_STATE':
      return {
        ...state,
        isAuth: action.payload.isAuth,
        userId: action.payload.userId || null,
      };
    default:
      return state;
  }
};

export default userReducer;
