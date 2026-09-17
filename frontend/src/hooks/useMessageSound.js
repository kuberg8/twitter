import { useCallback, useEffect, useRef, useState } from 'react';
import smsAudio from '../assets/sms.mp3';

export function createMessageTracker(userId) {
  let initialized = false;
  const seen = new Set();
  return (posts) => {
    const incoming =
      initialized &&
      posts.some(
        (post) =>
          !seen.has(String(post._id)) &&
          String(post.user?._id || post.user) !== String(userId)
      );
    posts.forEach((post) => seen.add(String(post._id)));
    initialized = true;
    return incoming;
  };
}

export default function useMessageSound(userId, conversationId) {
  const [enabled, setEnabled] = useState(false);
  const audioRef = useRef(null);
  const enabledRef = useRef(false);
  const trackerRef = useRef(createMessageTracker(userId));
  useEffect(() => {
    trackerRef.current = createMessageTracker(userId);
    return () => {
      audioRef.current?.pause();
    };
  }, [userId, conversationId]);

  const disable = useCallback(() => {
    enabledRef.current = false;
    setEnabled(false);
  }, []);

  const toggleSound = useCallback(async () => {
    if (enabledRef.current) {
      audioRef.current?.pause();
      disable();
      return;
    }
    // Start playback directly from the click so mobile browsers can allow audio.
    const audio = audioRef.current || new Audio(smsAudio);
    audioRef.current = audio;
    audio.currentTime = 0;
    try {
      await audio.play();
      enabledRef.current = true;
      setEnabled(true);
    } catch {
      disable();
    }
  }, [disable]);

  const notify = useCallback(
    (posts) => {
      const incoming = trackerRef.current(posts);
      if (!incoming || !enabledRef.current || !audioRef.current) return;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(disable);
    },
    [disable]
  );

  return { enabled, toggleSound, notify };
}
