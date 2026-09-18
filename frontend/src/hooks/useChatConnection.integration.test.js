import { act, renderHook, waitFor } from '@testing-library/react';
import { EventEmitter } from 'events';
import useChatConnection from './useChatConnection';
import { createChatCache } from '../utils/chatCache';
import createSocketServer from '../../../backend/websocket/websocket';

jest.mock('../../../backend/node_modules/mongoose', () => ({ Types: {} }));

let mockServer;
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({ useDispatch: () => mockDispatch }));
jest.mock('../api/posts', () => ({ getPosts: async () => ({ data: [] }) }));
jest.mock('../api/chats', () => ({ getChats: async () => ({ data: [] }) }));
jest.mock('../../../backend/models/User', () => ({ exists: async () => true }));
jest.mock('../../../backend/node_modules/jsonwebtoken', () => ({
  verify: (token) => ({ id: token, exp: Math.floor(Date.now() / 1000) + 3600 }),
}));
jest.mock('../../../backend/node_modules/ws', () => {
  const { EventEmitter } = require('events');
  return {
    OPEN: 1,
    Server: class extends EventEmitter {
      constructor() {
        super();
        this.clients = new Set();
        mockServer = this;
      }
    },
  };
});

const alice = '507f1f77bcf86cd799439011';
const bob = '507f1f77bcf86cd799439012';
const nativeSocket = global.WebSocket;
afterEach(() => {
  mockServer.emit('close');
  global.WebSocket = nativeSocket;
});

test.each(['private', 'general'])(
  'typing travels through the actual server handler to the other account (%s)',
  async (room) => {
    createSocketServer({});
    global.WebSocket = class {
      constructor() {
        this.readyState = 1;
        this.serverSide = new EventEmitter();
        const peer = this.serverSide;
        peer.readyState = 1;
        peer.send = (data) => this.onmessage?.({ data });
        peer.close = (code) => this.close(code);
        mockServer.clients.add(peer);
        mockServer.emit('connection', peer);
        Promise.resolve().then(() => this.onopen?.());
      }
      send(data) {
        this.serverSide.emit('message', Buffer.from(data));
      }
      close(code = 1000) {
        this.readyState = 3;
        this.serverSide.readyState = 3;
        this.serverSide.emit('close');
        mockServer.clients.delete(this.serverSide);
        this.onclose?.({ code });
      }
    };
    const aliceCache = createChatCache();
    const bobCache = createChatCache();
    const alicePeer = room === 'private' ? bob : '';
    const bobPeer = room === 'private' ? alice : '';
    const sender = renderHook(() =>
      useChatConnection(aliceCache, alice, alicePeer)
    );
    const receiver = renderHook(() =>
      useChatConnection(bobCache, bob, bobPeer)
    );
    try {
      await waitFor(() =>
        expect(receiver.result.current.presence).toContain(alice)
      );
      act(() => sender.result.current.sendTyping(alicePeer, true));
      await waitFor(() => expect(receiver.result.current.typing).toBe(true));
      expect(sender.result.current.typing).toBe(false);
      act(() => sender.result.current.sendTyping(alicePeer, false));
      await waitFor(() => expect(receiver.result.current.typing).toBe(false));
    } finally {
      sender.unmount();
      receiver.unmount();
    }
  }
);
