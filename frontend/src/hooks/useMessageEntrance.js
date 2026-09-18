import { useLayoutEffect, useMemo, useRef } from 'react';
const compare = (a, b) =>
  a.created_at - b.created_at || String(a._id).localeCompare(String(b._id));

// Animate only arrivals after the loaded history, never old pages or edits.
export default function useMessageEntrance(posts, loaded) {
  const previous = useRef({ loaded: false, latest: null });
  const arriving = useMemo(
    () =>
      new Set(
        previous.current.loaded
          ? posts
              .filter(
                (post) =>
                  !previous.current.latest ||
                  compare(post, previous.current.latest) > 0
              )
              .map((post) => post._id)
          : []
      ),
    [posts]
  );
  useLayoutEffect(() => {
    if (!loaded) return;
    const latest = posts[posts.length - 1];
    if (
      latest &&
      (!previous.current.latest || compare(latest, previous.current.latest) > 0)
    )
      previous.current.latest = latest;
    previous.current.loaded = true;
  }, [posts, loaded]);
  return arriving;
}
