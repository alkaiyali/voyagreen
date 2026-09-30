// Destination photos with a procedural fallback.
//
// While the photo resolves (or if it never does) the card shows the same
// gradient + leaf-pin art the app used before, so lists never flash empty.
// The gradient always stays *behind* the image: remounting a card (typing in
// search swaps the list) must not make an already-loaded photo disappear.

import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { openBrowserAsync } from 'expo-web-browser';
import { C, T } from '@/components/ui';
import { LeafPin } from './icons';
import { resolvePhoto, type Photo, type PhotoSize } from '@/lib/photos';
import { DESTINATIONS } from '@/data/destinations';

const COVERS: [string, string][] = [
  [C.accent700, C.accent400], [C.accent800, C.accent500], [C.accent600, C.accent300],
  [C.accent900, C.accent600], [C.accent700, C.accent300],
];

export function coverColors(id: string): [string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return COVERS[h % COVERS.length];
}

// URLs already painted once this session: a remount renders them straight
// away, without replaying the fade-in.
const LOADED = new Set<string>();

function usePhoto(id: string, size: PhotoSize): Photo | null | undefined {
  const key = `${id}:${size}`;
  const [state, setState] = useState<{ key: string; photo: Photo | null } | null>(null);
  useEffect(() => {
    let alive = true;
    resolvePhoto(id, size).then((p) => { if (alive) setState({ key, photo: p }); });
    return () => { alive = false; };
  }, [id, size, key]);
  // Derive rather than reset: a different key is "loading" until it lands.
  return state?.key === key ? state.photo : undefined;
}

export const DestPhoto = memo(function DestPhoto({ id, style, pinSize = 24, size = 'thumb' }: {
  id: string; style?: StyleProp<ViewStyle>; pinSize?: number; size?: PhotoSize;
}) {
  const photo = usePhoto(id, size);
  const [failed, setFailed] = useState(false);
  const [a, b] = coverColors(id);
  const name = DESTINATIONS[id]?.name ?? 'Destination';
  const uri = photo?.url;

  return (
    <View style={[s.wrap, style]}>
      <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, s.center]}>
        <LeafPin size={pinSize} color={C.surface} leaf={a} />
      </LinearGradient>
      {uri && !failed && (
        <Image
          source={uri}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={LOADED.has(uri) ? 0 : 220}
          cachePolicy="memory-disk"
          onLoad={() => LOADED.add(uri)}
          onError={() => setFailed(true)}
          accessibilityLabel={`Photo of ${name}`}
        />
      )}
    </View>
  );
});

// Tiny CC attribution — required by the Commons licences, and honest.
export const PhotoCredit = memo(function PhotoCredit({ id, style, size = 'thumb' }: {
  id: string; style?: StyleProp<ViewStyle>; size?: PhotoSize;
}) {
  const photo = usePhoto(id, size);
  if (!photo) return null;
  return (
    <Pressable style={style} disabled={!photo.page} accessibilityRole="link"
      accessibilityLabel={`Photo by ${photo.artist}, ${photo.license}. Opens the Wikimedia Commons page`}
      onPress={() => { if (photo.page) openBrowserAsync(photo.page); }}>
      <T.Muted style={{ fontSize: 11, lineHeight: 15 }} numberOfLines={1}>
        Photo: {photo.artist} · {photo.license} · Wikimedia Commons
      </T.Muted>
    </Pressable>
  );
});

const s = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: C.accent700 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
