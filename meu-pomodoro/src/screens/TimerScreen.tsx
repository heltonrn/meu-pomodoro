import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdSlot } from '../components/AdSlot/AdSlot';
import { CycleDots } from '../components/CycleDots/CycleDots';
import { SessionChip } from '../components/SessionChip/SessionChip';
import { SessionComplete } from '../components/SessionComplete/SessionComplete';
import { TaskInput } from '../components/TaskInput/TaskInput';
import { Ticket } from '../components/Ticket/Ticket';
import { TimerControls } from '../components/TimerControls/TimerControls';
import { colors } from '../constants/theme';
import { usePomodoroTimer } from '../hooks/usePomodoroTimer';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useSettingsStore } from '../store/settingsStore';
import { SessionType, TimerStatus } from '../types';
import { formatClockTime, formatCountdown } from '../utils/time';

function nextTypeAfter(
  sessionType: SessionType,
  currentPomodoro: number,
  pomodorosPerCycle: number,
): SessionType {
  if (sessionType !== SessionType.Focus) {
    return SessionType.Focus;
  }
  return currentPomodoro >= pomodorosPerCycle
    ? SessionType.LongBreak
    : SessionType.ShortBreak;
}

export function TimerScreen(): React.JSX.Element {
  usePomodoroTimer();

  const status = usePomodoroStore((state) => state.status);
  const sessionType = usePomodoroStore((state) => state.sessionType);
  const currentPomodoro = usePomodoroStore((state) => state.currentPomodoro);
  const completedInCycle = usePomodoroStore((state) => state.completedInCycle);
  const completedToday = usePomodoroStore((state) => state.completedToday);
  const task = usePomodoroStore((state) => state.task);
  const remainingMs = usePomodoroStore((state) => state.remainingMs);
  const sessionDurationMs = usePomodoroStore((state) => state.sessionDurationMs);
  const targetEndsAt = usePomodoroStore((state) => state.targetEndsAt);
  const setTask = usePomodoroStore((state) => state.setTask);
  const start = usePomodoroStore((state) => state.start);
  const pause = usePomodoroStore((state) => state.pause);
  const resume = usePomodoroStore((state) => state.resume);
  const restart = usePomodoroStore((state) => state.restart);
  const skip = usePomodoroStore((state) => state.skip);
  const startNext = usePomodoroStore((state) => state.startNext);
  const acknowledgeFinish = usePomodoroStore((state) => state.acknowledgeFinish);

  const pomodorosPerCycle = useSettingsStore(
    (state) => state.settings.pomodorosPerCycle,
  );

  if (status === TimerStatus.Finished) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Text style={styles.appTitle}>🍅 Meu Pomodoro</Text>
        <SessionComplete
          finishedType={sessionType}
          nextType={nextTypeAfter(sessionType, currentPomodoro, pomodorosPerCycle)}
          completedInCycle={completedInCycle}
          completedToday={completedToday}
          onStartNext={startNext}
          onDismiss={acknowledgeFinish}
        />
        <AdSlot />
      </SafeAreaView>
    );
  }

  const progress =
    sessionDurationMs > 0 ? 1 - remainingMs / sessionDurationMs : 0;
  const isFocus = sessionType === SessionType.Focus;
  const isIdleFocus = status === TimerStatus.Idle && isFocus;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Text style={styles.appTitle}>🍅 Meu Pomodoro</Text>

      <View style={styles.content}>
        <Ticket>
          <SessionChip sessionType={sessionType} />

          <Text style={styles.time}>{formatCountdown(remainingMs)}</Text>
          {targetEndsAt !== null && (
            <Text style={styles.endsAt}>
              termina às {formatClockTime(targetEndsAt)}
            </Text>
          )}

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                  backgroundColor: isFocus ? colors.tomato : colors.forest,
                },
              ]}
            />
          </View>

          <CycleDots
            total={pomodorosPerCycle}
            completed={completedInCycle}
            current={isFocus ? currentPomodoro : null}
          />
          <Text style={styles.cycleLabel}>
            {isFocus
              ? `Pomodoro ${currentPomodoro} de ${pomodorosPerCycle}`
              : `${completedInCycle} ${completedInCycle === 1 ? 'Pomodoro concluído' : 'Pomodoros concluídos'} neste ciclo`}
          </Text>

          {isFocus ? (
            <TaskInput value={task} editable={isIdleFocus} onChange={setTask} />
          ) : (
            <View style={styles.breakHint}>
              <Text style={styles.breakHintText}>🌿 Levante, alongue, respire</Text>
            </View>
          )}
        </Ticket>

        <TimerControls
          status={status}
          onStart={start}
          onPause={pause}
          onResume={resume}
          onRestart={restart}
          onSkip={skip}
        />
      </View>

      {/* Fase 7: banner oculto durante o foco para não atrapalhar (some com o timer rodando). */}
      {status !== TimerStatus.Running && <AdSlot />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  appTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.forestDark,
    textAlign: 'center',
    paddingVertical: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  time: {
    fontSize: 58,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    lineHeight: 62,
    marginBottom: 6,
  },
  endsAt: {
    fontSize: 12.5,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: 16,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.line,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  cycleLabel: {
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  breakHint: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderStyle: 'dashed',
  },
  breakHintText: {
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
  },
});
