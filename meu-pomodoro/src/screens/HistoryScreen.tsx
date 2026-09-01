import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdSlot } from '../components/AdSlot/AdSlot';
import { SessionItem } from '../components/SessionItem/SessionItem';
import { StatCard } from '../components/StatCard/StatCard';
import { colors } from '../constants/theme';
import {
  focusStatsBetween,
  listSessionsBetween,
  SessionRecord,
} from '../services/database/db';
import { usePomodoroStore } from '../store/pomodoroStore';
import { formatDurationMinutes, startOfToday, startOfWeek } from '../utils/time';

type Period = 'today' | 'week';

/**
 * Fase 5 — histórico e estatísticas (requisitos 13 e 14), lidos do SQLite.
 */
export function HistoryScreen(): React.JSX.Element {
  const [period, setPeriod] = useState<Period>('today');
  // Recarrega quando novas sessões são registradas ou o histórico é limpo.
  const historyVersion = usePomodoroStore((state) => state.historyVersion);

  const from = period === 'today' ? startOfToday() : startOfWeek();

  const { sessions, stats } = useMemo(() => {
    const to = Date.now() + 1;
    return {
      sessions: listSessionsBetween(from, to),
      stats: focusStatsBetween(from, to),
    };
    // historyVersion força a releitura quando o banco muda.
  }, [from, historyVersion]);

  const renderItem = useCallback(
    ({ item }: { item: SessionRecord }) => <SessionItem session={item} />,
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Text style={styles.appTitle}>📊 Histórico</Text>

      <View style={styles.content}>
        <View style={styles.periodTabs}>
          <PeriodTab
            label="Hoje"
            active={period === 'today'}
            onPress={() => setPeriod('today')}
          />
          <PeriodTab
            label="Semana"
            active={period === 'week'}
            onPress={() => setPeriod('week')}
          />
        </View>

        <View style={styles.statRow}>
          <StatCard value={String(stats.completedPomodoros)} label="Pomodoros" />
          <StatCard
            value={formatDurationMinutes(stats.focusTimeMs)}
            label="Tempo de foco"
          />
        </View>

        <FlatList
          data={sessions}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Nenhuma sessão registrada {period === 'today' ? 'hoje' : 'nesta semana'}.
              {'\n'}Inicie um Pomodoro para começar!
            </Text>
          }
        />
      </View>

      <AdSlot />
    </SafeAreaView>
  );
}

interface PeriodTabProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function PeriodTab({ label, active, onPress }: PeriodTabProps): React.JSX.Element {
  return (
    <Pressable
      style={[styles.periodTab, active && styles.periodTabActive]}
      onPress={onPress}
    >
      <Text style={[styles.periodTabLabel, active && styles.periodTabLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  appTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.forestDark,
    textAlign: 'center',
    paddingVertical: 10,
  },
  content: { flex: 1, paddingHorizontal: 16 },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  periodTab: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  periodTabActive: { backgroundColor: colors.forest },
  periodTabLabel: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  periodTabLabelActive: { color: colors.paper },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  list: { paddingBottom: 8 },
  empty: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
    marginTop: 32,
  },
});
