import { MemoryRouter } from 'react-router-dom';
import {
  getChats,
  getUsers,
  getChatUser,
  deleteChat,
  loadUnread,
  loadReadReceipt,
} from '../api/chats';
import React, { act } from 'react';
import {
  render as renderUI,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import Posts from './Posts';
import { getPosts, createPost, updatePost } from '../api/posts';

jest.mock('../api/posts', () => ({
  getPosts: jest.fn(),
  createPost: jest.fn(),
  updatePost: jest.fn(),
  deletePost: jest.fn(),
}));
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({ useDispatch: () => mockDispatch }));
jest.mock('../api/chats', () => ({
  loadReadReceipt: jest.fn().mockResolvedValue({ position: null }),
  loadUnread: jest.fn().mockResolvedValue({}),
  markChatRead: jest.fn().mockResolvedValue({}),
  deleteChat: jest.fn().mockResolvedValue({}),
  getChats: jest.fn(),
  getUsers: jest.fn(),
  getChatUser: jest.fn(),
}));
const render = (ui) => renderUI(<MemoryRouter>{ui}</MemoryRouter>);
const message = {
  _id: 'p1',
  user: { _id: 'u1', first_name: 'Анна' },
  message: 'Привет',
  created_at: 1700000000000,
};
const NativeWebSocket = global.WebSocket;
beforeEach(() => {
  jest.clearAllMocks();
  loadUnread.mockResolvedValue({});
  loadReadReceipt.mockResolvedValue({ position: null });
  getChats.mockResolvedValue({ data: [] });
  getUsers.mockResolvedValue({ data: [{ _id: 'peer', first_name: 'Борис' }] });
  getChatUser.mockResolvedValue({ data: { _id: 'peer', first_name: 'Борис' } });
  global.WebSocket = jest
    .fn()
    .mockImplementation(() => ({ close: jest.fn(), send: jest.fn() }));
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
    await screen.findByRole('button', { name: 'Действия с сообщением' })
  );
  fireEvent.click(
    screen.getByRole('menuitem', { name: 'Редактировать сообщение' })
  );
  fireEvent.change(screen.getByRole('textbox', { name: 'Сообщение' }), {
    target: { value: 'Обновлено' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
  await waitFor(() =>
    expect(updatePost).toHaveBeenCalledWith('p1', 'Обновлено')
  );
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toHaveValue('')
  );
});
test('keeps a draft after a failed send', async () => {
  createPost.mockRejectedValue(new Error('offline'));
  render(<Posts userId="u2" />);
  await screen.findByText('Привет');
  expect(
    screen.queryByRole('button', { name: 'Редактировать сообщение' })
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Сообщение' }), {
    target: { value: 'Мой черновик' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Текст сохранён');
  expect(screen.getByRole('textbox', { name: 'Сообщение' })).toHaveValue(
    'Мой черновик'
  );
});
test('does not send whitespace-only messages', async () => {
  render(<Posts userId="u1" />);
  await screen.findByText('Привет');
  fireEvent.change(screen.getByRole('textbox', { name: 'Сообщение' }), {
    target: { value: '   ' },
  });
  expect(screen.getByRole('button', { name: 'Отправить' })).toBeDisabled();
  expect(createPost).not.toHaveBeenCalled();
});

test('opens a private chat, sends to its recipient and preserves the general-chat draft', async () => {
  createPost.mockResolvedValue({});
  getPosts.mockImplementation((peer) =>
    Promise.resolve({ data: peer ? [] : [message] })
  );
  render(<Posts userId="u1" token="token" />);
  await screen.findByText('Привет');
  fireEvent.change(screen.getByRole('textbox', { name: 'Сообщение' }), {
    target: { value: 'Черновик общего чата' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Новый чат' }));
  fireEvent.click(await screen.findByRole('button', { name: /Борис/ }));
  await screen.findByRole('heading', { level: 1, name: /Борис/ });
  await waitFor(() => expect(getPosts).toHaveBeenCalledWith('peer'));
  expect(screen.queryByText('Привет')).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Сообщение' }), {
    target: { value: 'Только для Бориса' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));
  await waitFor(() =>
    expect(createPost).toHaveBeenCalledWith('Только для Бориса', 'peer')
  );
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toHaveValue('')
  );
  fireEvent.click(screen.getByRole('button', { name: 'Общий чат' }));
  await screen.findByText('Привет');
  expect(screen.getByRole('textbox', { name: 'Сообщение' })).toHaveValue(
    'Черновик общего чата'
  );
  expect(global.WebSocket).toHaveBeenCalledTimes(1);
  expect(getPosts.mock.calls.filter(([peer]) => peer === '').length).toBe(1);
});

test('deletes a private chat only after confirming in its menu', async () => {
  render(<Posts userId="u1" token="token" />);
  await screen.findByText('Привет');
  fireEvent.click(screen.getByRole('button', { name: 'Новый чат' }));
  fireEvent.click(await screen.findByRole('button', { name: /Борис/ }));
  await screen.findByRole('heading', { level: 1, name: /Борис/ });
  fireEvent.click(screen.getByRole('button', { name: 'Действия с чатом' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Удалить чат' }));
  expect(deleteChat).not.toHaveBeenCalled();
  expect(
    screen.getByText(/У собеседника сообщения останутся/)
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Удалить у меня' }));
  await waitFor(() => expect(deleteChat).toHaveBeenCalledWith('peer', 'self'));
  await screen.findByRole('heading', { level: 1, name: 'Общий чат' });
});

test('shows peer presence and typing events, sends typing and clears status on disconnect', async () => {
  render(<Posts userId="u1" token="token" />);
  await screen.findByText('Привет');
  fireEvent.click(screen.getByRole('button', { name: 'Новый чат' }));
  fireEvent.click(await screen.findByRole('button', { name: /Борис/ }));
  await screen.findByRole('heading', { level: 1, name: /Борис/ });
  const socket = WebSocket.mock.results[0].value;
  socket.readyState = 1;
  await act(async () =>
    socket.onmessage({
      data: JSON.stringify({ type: 'ready', users: ['peer'] }),
    })
  );
  expect(screen.getByText('В сети')).toBeInTheDocument();
  act(() =>
    socket.onmessage({
      data: JSON.stringify({
        type: 'typing',
        peerId: 'peer',
        userId: 'peer',
        active: true,
      }),
    })
  );
  expect(screen.getByText('Печатает…')).toBeInTheDocument();
  act(() =>
    socket.onmessage({
      data: JSON.stringify({
        type: 'typing',
        peerId: 'peer',
        userId: 'peer',
        active: false,
      }),
    })
  );
  expect(screen.queryByText('Печатает…')).not.toBeInTheDocument();
  const input = screen.getByRole('textbox', { name: 'Сообщение' });
  fireEvent.change(input, { target: { value: 'Текст' } });
  expect(socket.send).toHaveBeenCalledWith(
    JSON.stringify({ type: 'typing', peerId: 'peer', active: true })
  );
  fireEvent.blur(input);
  expect(socket.send).toHaveBeenLastCalledWith(
    JSON.stringify({ type: 'typing', peerId: 'peer', active: false })
  );
  act(() => socket.onclose({ code: 1006 }));
  expect(screen.getByText('Статус недоступен')).toBeInTheDocument();
});

test('explicitly selects deletion for both participants', async () => {
  render(<Posts userId="u1" token="token" />);
  await screen.findByText('Привет');
  fireEvent.click(screen.getByRole('button', { name: 'Новый чат' }));
  fireEvent.click(await screen.findByRole('button', { name: /Борис/ }));
  await screen.findByRole('heading', { level: 1, name: /Борис/ });
  fireEvent.click(screen.getByRole('button', { name: 'Действия с чатом' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Удалить чат' }));
  expect(screen.getByRole('radio', { name: 'Только у меня' })).toBeChecked();
  fireEvent.click(screen.getByRole('radio', { name: 'У обоих' }));
  expect(screen.getByText(/Восстановить её не получится/)).toBeInTheDocument();
  expect(deleteChat).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Удалить у обоих' }));
  await waitFor(() => expect(deleteChat).toHaveBeenCalledWith('peer', 'both'));
  await screen.findByRole('heading', { level: 1, name: 'Общий чат' });
});

test('shows typing in the chat list without opening the private conversation', async () => {
  getChats.mockResolvedValue({
    data: [
      {
        peer: { _id: 'peer', first_name: 'Борис' },
        message: 'Последнее сообщение',
        created_at: 1700000000000,
      },
    ],
  });
  render(<Posts userId="u1" token="token" />);
  await screen.findByText('Последнее сообщение');
  const socket = WebSocket.mock.results[0].value;
  act(() =>
    socket.onmessage({
      data: JSON.stringify({
        type: 'typing',
        peerId: 'peer',
        userId: 'peer',
        active: true,
      }),
    })
  );
  expect(screen.getByRole('button', { name: /Борис/ })).toHaveTextContent(
    'Печатает…'
  );
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Общий чат'
  );
  act(() =>
    socket.onmessage({
      data: JSON.stringify({
        type: 'typing',
        peerId: 'peer',
        userId: 'peer',
        active: false,
      }),
    })
  );
  expect(screen.getByRole('button', { name: /Борис/ })).toHaveTextContent(
    'Последнее сообщение'
  );
});

test('displays unread counts for private and general chats', async () => {
  loadUnread.mockResolvedValue({ peer: 4, general: 120 });
  getChats.mockResolvedValue({
    data: [
      {
        peer: { _id: 'peer', first_name: 'Борис' },
        message: 'Сообщение',
        created_at: 1700000000000,
      },
    ],
  });
  render(<Posts userId="u1" token="token" />);
  expect(
    await screen.findByLabelText('Непрочитанных сообщений: 4')
  ).toHaveTextContent('4');
  expect(
    await screen.findByLabelText('Непрочитанных сообщений: 120')
  ).toHaveTextContent('99+');
});

test('outgoing private messages receive live read receipts and keep newer positions', async () => {
  renderUI(
    <MemoryRouter initialEntries={['/?chat=peer']}>
      <Posts userId="u1" token="token" />
    </MemoryRouter>
  );
  await screen.findByText('Привет');
  expect(screen.getByRole('img', { name: 'Отправлено' })).toBeInTheDocument();
  const socket = WebSocket.mock.results[0].value;
  act(() =>
    socket.onmessage({
      data: JSON.stringify({
        type: 'chat:read',
        peerId: 'peer',
        position: '0001700000000000:p1',
      }),
    })
  );
  expect(screen.getByRole('img', { name: 'Прочитано' })).toBeInTheDocument();
  act(() =>
    socket.onmessage({
      data: JSON.stringify({
        type: 'chat:read',
        peerId: 'peer',
        position: '0001600000000000:p1',
      }),
    })
  );
  expect(screen.getByRole('img', { name: 'Прочитано' })).toBeInTheDocument();
});

test('restores read receipts from the server when opening a private chat', async () => {
  loadReadReceipt.mockResolvedValue({ position: '0001700000000000:p1' });
  renderUI(
    <MemoryRouter initialEntries={['/?chat=peer']}>
      <Posts userId="u1" token="token" />
    </MemoryRouter>
  );
  expect(
    await screen.findByRole('img', { name: 'Прочитано' })
  ).toBeInTheDocument();
});
