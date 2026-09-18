export const receiptKey = (peer) => `receipt:${peer}`;
export const messagePosition = (post) =>
  `${String(post.created_at).padStart(16, '0')}:${post._id}`;
export const mergeReceipt = (previous, next) => ({
  position:
    previous?.position && (!next?.position || previous.position > next.position)
      ? previous.position
      : next?.position || null,
});
