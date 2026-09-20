let sequence = 0;
// Session-scoped: survives chat navigation, but never shares drafts between accounts.
export function createOutbox(userId, send, onSent = () => {}) {
  let snapshot = [];
  const listeners = new Set();
  const publish = (next) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };
  const attempt = async (post) => {
    const id = post.clientMessageId;
    try {
      const result = await send(post.message, post.recipient || '', id);
      if (!result?._id) throw new Error('Сервер не подтвердил отправку.');
      // A socket acknowledgement or deleting the chat may already have removed this entry.
      if (!snapshot.some((item) => item.clientMessageId === id)) return;
      publish(
        snapshot.map((item) =>
          item.clientMessageId === id
            ? { ...result, clientMessageId: id }
            : item
        )
      );
      onSent(result);
    } catch (error) {
      publish(
        snapshot.map((item) =>
          item.clientMessageId === id
            ? {
                ...item,
                deliveryStatus: 'failed',
                deliveryError:
                  error instanceof Error ? error.message : 'Ошибка отправки',
              }
            : item
        )
      );
    }
  };
  return {
    snapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    send(message, peer = '') {
      if (!message.trim()) return;
      const clientMessageId = `${Date.now().toString(36)}-${(++sequence).toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      const post = {
        _id: `local:${clientMessageId}`,
        clientMessageId,
        message: message.trim(),
        created_at: Date.now(),
        recipient: peer || null,
        user: { _id: userId, first_name: 'Вы' },
        deliveryStatus: 'sending',
      };
      publish([...snapshot, post]);
      void attempt(post);
    },
    retry(id) {
      const post = snapshot.find((item) => item._id === id);
      if (post?.deliveryStatus !== 'failed') return;
      const next = {
        ...post,
        deliveryStatus: 'sending',
        deliveryError: undefined,
      };
      publish(snapshot.map((item) => (item === post ? next : item)));
      void attempt(next);
    },
    reconcile(posts) {
      const next = snapshot.filter(
        (item) =>
          !posts.some(
            (post) =>
              post._id === item._id ||
              (post.clientMessageId &&
                post.clientMessageId === item.clientMessageId &&
                String(post.user._id) === userId)
          )
      );
      if (next.length !== snapshot.length) publish(next);
    },
    remove(id) {
      publish(snapshot.filter((item) => item._id !== id));
    },
    clearPeer(peer) {
      publish(snapshot.filter((item) => (item.recipient || '') !== peer));
    },
  };
}
export function mergeOutgoing(posts, outgoing, peer) {
  return [
    ...posts,
    ...outgoing.filter(
      (item) =>
        (item.recipient || '') === peer &&
        !posts.some(
          (post) =>
            post._id === item._id ||
            (post.clientMessageId &&
              post.clientMessageId === item.clientMessageId &&
              String(post.user._id) === String(item.user._id))
        )
    ),
  ];
}
