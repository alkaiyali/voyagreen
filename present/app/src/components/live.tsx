// The live-signals card: estimated occupancy today + the open signals behind it.

import { StyleSheet, View } from 'react-native';
import { C, F, T, tone } from '@/components/ui';
import { Icon, type IconName } from './icons';
import { level } from '@/lib/trip';
import type { LiveSignals } from '@/lib/live';

const fmtViews = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`);

export function LiveCard({ data }: { data: LiveSignals }) {
  const lv = level(data.occupancy), t = tone(lv.tone);
  return (
    <View style={s.card}>
      <View style={s.head}>
        <View style={[s.dot, { backgroundColor: data.offline ? C.textFaint : C.success }]} />
        <T.Label>Live signals</T.Label>
        <View style={{ flex: 1 }} />
        <T.Muted style={{ fontSize: 11 }}>{data.offline ? 'offline model' : 'open data'}</T.Muted>
      </View>

      <View style={s.bigRow} accessible accessibilityLabel={`Estimated occupancy today ${data.occupancy} out of 100, ${lv.label.toLowerCase()}. ${data.reason}`}>
        <T.Num style={{ fontSize: 46, lineHeight: 50, color: t.fg }}>{data.occupancy}</T.Num>
        <View style={{ flex: 1, gap: 2 }}>
          <T.Body style={{ fontFamily: F.bold, fontSize: 14 }}>estimated occupancy today</T.Body>
          <T.Muted style={{ fontSize: 12, lineHeight: 16 }}>{data.reason}</T.Muted>
        </View>
      </View>

      {data.interest && <Spark series={data.interest.series} peakMonth={data.interest.peakMonth} />}

      <View style={s.rows}>
        {data.interest && (
          <Row icon="search" label="Search interest"
            value={`${fmtViews(data.interest.latest)} views · ${data.interest.deltaPct >= 0 ? '+' : ''}${data.interest.deltaPct}% vs usual`} />
        )}
        <Row icon="calendar" label="Next PH holiday"
          value={data.holiday
            ? `${data.holiday.name} · ${data.holiday.date} · ${data.holiday.daysAway === 0 ? 'today' : `${data.holiday.daysAway}d`}${data.holiday.longWeekend ? ' · long wknd' : ''}`
            : 'None in the next 8 weeks'} />
        {data.weather && (
          <Row icon="drop" label="Rain next 7 days"
            value={data.weather.rainyDays === 0 ? 'Dry week ahead' : `${data.weather.rainyDays} of ${data.weather.days} days wet · avg ${data.weather.avgRain}%`} />
        )}
        {data.air && (
          <Row icon="leaf" label="Air quality" value={`PM2.5 ${data.air.pm25} · ${data.air.label}`} />
        )}
      </View>

      <T.Muted style={s.foot}>
        Estimated from {data.sources.length ? data.sources.join(' · ') : 'a modelled baseline'} — a signal, not a measurement.
      </T.Muted>
    </View>
  );
}

function Spark({ series, peakMonth }: { series: number[]; peakMonth: string }) {
  const max = Math.max(...series, 1);
  const peak = series.indexOf(max);
  return (
    <View style={{ marginTop: 14, gap: 5 }} accessible accessibilityLabel={`Wikipedia interest over the last 12 months, peaking in ${peakMonth}`}>
      <View style={s.spark}>
        {series.map((v, i) => (
          <View key={i} style={[s.bar, { height: Math.max(4, Math.round((v / max) * 30)) }, i === peak && s.barPeak]} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <T.Muted style={{ fontSize: 11 }}>Wikipedia interest, last 12 months</T.Muted>
        <T.Muted style={{ fontSize: 11 }}>peak {peakMonth}</T.Muted>
      </View>
    </View>
  );
}

function Row({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={s.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <Icon name={icon} size={15} color={C.textMuted} />
      <T.Muted style={{ fontSize: 13, flex: 1 }}>{label}</T.Muted>
      <T.Body style={{ fontSize: 13, fontFamily: F.bold, textAlign: 'right', flexShrink: 1 }} numberOfLines={1}>{value}</T.Body>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderColor: C.border, borderRadius: 24, padding: 16, backgroundColor: C.surface },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 99 },
  bigRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14 },
  spark: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 30 },
  bar: { flex: 1, borderRadius: 3, backgroundColor: C.accent200 },
  barPeak: { backgroundColor: C.accent },
  rows: { marginTop: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foot: { fontSize: 11, lineHeight: 15, marginTop: 14 },
});
