import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Posts from './Posts';
import { getPosts, createPost, updatePost } from '../api/posts';

jest.mock('../api/posts', () => ({
  getPosts: jest.fn(),
  createPost: jest.fn(),
  updatePost: jest.fn(),
  deletePost: jest.fn(),
}));
jest.mock('react-redux', () => ({ useDispatch: () => jest.fn() }));
const message = {
  _id: 'p1',
  user: { _id: 'u1', first_name: 'Анна' },
  message: 'Привет',
  created_at: 1700000000000,
};
const NativeWebSocket = global.WebSocket;
beforeEach(() => {
  jest.clearAllMocks();
  global.WebSocket = class {
    close() {}
  };
  getPosts.mockResolvedValue({ data: [message] });
  Element.prototype.scrollIntoView = jest.fn();
});
afterAll(() => {
  global.WebSocket = NativeWebSocket;
});
test('shows edit controls only for the owner and saves edits through the API', async () => {
  updatePost.mockResolvedValue({});
  render(<Posts userId="u1" />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Редактировать сообщение' })
  );
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'Обновлено' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
  await waitFor(() =>
    expect(updatePost).toHaveBeenCalledWith('p1', 'Обновлено')
  );
  await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(''));
});
test('keeps a draft after a failed send', async () => {
  createPost.mockRejectedValue(new Error('offline'));
  render(<Posts userId="u2" />);
  await screen.findByText('Привет');
  expect(
    screen.queryByRole('button', { name: 'Редактировать сообщение' })
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'Мой черновик' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Текст сохранён');
  expect(screen.getByRole('textbox')).toHaveValue('Мой черновик');
});
test('does not send whitespace-only messages', async () => {
  render(<Posts userId="u1" />);
  await screen.findByText('Привет');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
  expect(screen.getByRole('button', { name: 'Отправить' })).toBeDisabled();
  expect(createPost).not.toHaveBeenCalled();
});
