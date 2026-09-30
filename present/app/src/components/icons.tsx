import Svg, { Path, Circle } from 'react-native-svg';
import palette from '../../palette';

// Hand-drawn inline icons (no icon pack). The leaf-shaped map pin is the
// domain object — it appears as the logo, markers, empty states and tab icon.
export function LeafPin({ size = 32, color = palette.accent, leaf = '#FFFFFF' }: { size?: number; color?: string; leaf?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d="M16 30.5S4.5 19.6 4.5 12.3A11.5 11.5 0 0 1 16 .8a11.5 11.5 0 0 1 11.5 11.5C27.5 19.6 16 30.5 16 30.5Z" fill={color} />
      <Path d="M10.4 17.6c0-7.2 5.1-10.4 10.9-10.4 0 6.2-3.3 10.4-10.9 10.4Z" fill={leaf} />
      <Path d="M11.6 16.4c2.4-2.9 5.1-5.3 8.3-7.4" stroke={color} strokeWidth={1.2} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

const P = {
  back: 'M15 5l-7 7 7 7',
  arrow: 'M5 12h13m-5-6 6 6-6 6',
  check: 'm6 12.5 4 4L18 8',
  sun: 'M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6',
  cloud: 'M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7 11a3.75 3.75 0 0 0 0 7.5Z',
  moon: 'M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z',
  leaf: 'M5 19c0-9 6-14 15-14 0 8-5 14-15 14ZM5 19 13 11',
  alert: 'M12 3.5 2.8 19.5h18.4L12 3.5ZM12 10v4.2',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15.5 8.5l-2 5-5 2 2-5 5-2Z',
  bag: 'M5 8h14l-1 12H6L5 8ZM9 8V6a3 3 0 0 1 6 0v2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  bookmark: 'M7 4h10v16l-5-4-5 4V4Z',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6.5 6.5 0 0 1 3.5 6',
  wave: 'M3 15c2 0 2-2 4.5-2S10 15 12 15s2.5-2 4.5-2 2.5 2 4.5 2M3 19c2 0 2-2 4.5-2S10 19 12 19s2.5-2 4.5-2 2.5 2 4.5 2M12 11V3l5 3-5 3',
};
export type IconName = keyof typeof P;

export function Icon({ name, size = 20, color = palette.text, width = 1.8 }: { name: IconName; size?: number; color?: string; width?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={P[name]} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {name === 'alert' && <Circle cx={12} cy={16.8} r={1.05} fill={color} />}
    </Svg>
  );
}
