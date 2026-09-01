import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';
import { SessionRecord } from '../../services/database/db';
import { SessionType } from '../../types';
import { formatClockTime, formatDurationMinutes } from '../../utils/time';

interface SessionItemProps {
  session: SessionRecord;
}

const TYPE_EMOJI: Record<SessionType, string> = {
  [SessionType.Focus]: '🍅',
  [SessionType.ShortBreak]: '☕',
  [SessionType.LongBreak]: '🌿',
};

const TYPE_LABEL: Record<SessionType, string> = {
  [SessionType.Focus]: 'Foco',
  [SessionType.ShortBreak]: 'Pausa curta',
  [SessionType.LongBreak]: 'Pausa longa',
};

export function SessionItem({ session }: SessionItemProps): React.JSX.Element {
  const isFocus = session.type === SessionType.Focus;
  const title =
    isFocus && session.task.length > 0 ? session.task : TYPE_LABEL[session.type];

  return (
    <View style={styles.item}>
      <View style={[styles.icon, !isFocus && styles.breakIcon]}>
        <Text style={styles.iconText}>{TYPE_EMOJI[session.type]}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta}>
          {formatClockTime(session.startedAt)} · {formatDurationMinutes(session.duration)}
        </Text>
      </View>
      <View style={[styles.badge, session.completed ? styles.badgeDone : styles.badgeSkipped]}>
        <Text
          style={[
            styles.badgeText,
            session.completed ? styles.badgeTextDone : styles.badgeTextSkipped,
          ]}
        >
          {session.completed ? 'Concluído' : 'Pulado'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.tomatoLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakIcon: { backgroundColor: colors.forestLight },
  iconText: { fontSize: 17 },
  info: { flex: 1, minWidth: 0 },
  title: { fontSize: 13.5, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 11.5, color: colors.inkSoft, marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  badgeDone: { backgroundColor: colors.forestLight },
  badgeSkipped: { backgroundColor: colors.plumLight },
  badgeText: { fontSize: 10.5, fontWeight: '600' },
  badgeTextDone: { color: colors.forestDark },
  badgeTextSkipped: { color: colors.plum },
});
