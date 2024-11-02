import { combineReducers } from 'redux';
import userReducer from './userReducer';
import alertReducer from './alertReducer';

const rootReducer = combineReducers({
  user: userReducer,
  alert: alertReducer,
});

export default rootReducer;
