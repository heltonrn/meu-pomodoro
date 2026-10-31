import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { CycleDots } from "@/components/CycleDots";
import { ReviewPromptCard } from "@/components/ReviewPromptCard";
import { FeedbackSheet, StoreReviewSheet } from "@/components/ReviewSheets";
import { ScreenContainer } from "@/components/screen-container";
import { SessionChip } from "@/components/SessionChip";
import { SessionComplete } from "@/components/SessionComplete";
import { TaskInput } from "@/components/TaskInput";
import { Ticket } from "@/components/Ticket";
import { TimerControls } from "@/components/TimerControls";
import { nextTypeAfter } from "@/src/services/CycleService";
import { shouldPromptReview } from "@/src/services/ReviewPolicy";
import type { FeedbackCategory, ReviewAnswer } from "@/src/services/ReviewPolicy";
import { requestStoreReview, sendFeedbackEmail } from "@/src/services/ReviewService";
import { usePomodoroStore } from "@/src/store/pomodoroStore";
import { useReviewStore } from "@/src/store/reviewStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import { SessionType, TimerStatus } from "@/src/types";
import { formatClockTime, formatCountdown } from "@/src/utils/time";

export default function TimerScreen() {
  const status = usePomodoroStore((state) => state.status);
  const sessionType = usePomodoroStore((state) => state.sessionType);
  const currentPomodoro = usePomodoroStore((state) => state.currentPomodoro);
  const completedInCycle = usePomodoroStore((state) => state.completedInCycle);
  const completedToday = usePomodoroStore((state) => state.completedToday);
  const focusTimeTodayMs = usePomodoroStore((state) => state.focusTimeTodayMs);
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
  const finishedNaturally = usePomodoroStore((state) => state.finishedNaturally);
  const pomodorosPerCycle = useSettingsStore((state) => state.settings.pomodorosPerCycle);

  const reviewState = useReviewStore((state) => state.state);
  const reviewEngagement = useReviewStore((state) => state.engagement);
  const refreshReview = useReviewStore((state) => state.refresh);
  const answerReview = useReviewStore((state) => state.answer);
  const [reviewSheet, setReviewSheet] = useState<"store" | "feedback" | null>(null);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);

  // O pedido só aparece num momento de sucesso: um foco acabou de ser concluído.
  const justCompletedFocus =
    status === TimerStatus.Finished && finishedNaturally && sessionType === SessionType.Focus;

  useEffect(() => {
    if (justCompletedFocus) {
      void refreshReview();
    }
  }, [justCompletedFocus, refreshReview]);

  const showReviewCard =
    reviewState !== null &&
    reviewEngagement !== null &&
    shouldPromptReview(
      {
        ...reviewState,
        ...reviewEngagement,
        justCompletedFocus,
      },
      new Date(),
    );

  function handleReviewAnswer(answer: ReviewAnswer): void {
    answerReview(answer);
    if (answer === "yes") {
      setReviewSheet("store");
    } else if (answer === "improve") {
      setReviewSheet("feedback");
    }
  }

  async function handleSendFeedback(category: FeedbackCategory, message: string): Promise<void> {
    await sendFeedbackEmail(category, message);
    setReviewSheet(null);
    setReviewNotice("Obrigado pela sugestão!");
  }

  if (status === TimerStatus.Finished) {
    return (
      <ScreenContainer>
        <AppHeader title="🍅 Meu Pomodoro" />
        <SessionComplete
          completedInCycle={completedInCycle}
          completedToday={completedToday}
          finishedType={sessionType}
          focusTimeTodayMs={focusTimeTodayMs}
          nextType={nextTypeAfter(sessionType, currentPomodoro, pomodorosPerCycle)}
          footer={
            showReviewCard ? (
              <ReviewPromptCard
                onImprove={() => handleReviewAnswer("improve")}
                onLater={() => handleReviewAnswer("later")}
                onYes={() => handleReviewAnswer("yes")}
              />
            ) : reviewNotice !== null ? (
              <Text className="text-center text-[13px] text-primary-strong">{reviewNotice}</Text>
            ) : null
          }
          onDismiss={acknowledgeFinish}
          onStartNext={() => startNext()}
        />
        <StoreReviewSheet
          onConfirm={() => {
            setReviewSheet(null);
            void requestStoreReview().catch(() => {
              setReviewNotice("Não foi possível abrir a loja agora.");
            });
          }}
          onDismiss={() => setReviewSheet(null)}
          visible={reviewSheet === "store"}
        />
        <FeedbackSheet
          onCancel={() => setReviewSheet(null)}
          onSend={handleSendFeedback}
          visible={reviewSheet === "feedback"}
        />
      </ScreenContainer>
    );
  }

  const progress = sessionDurationMs > 0 ? 1 - remainingMs / sessionDurationMs : 0;
  const isFocus = sessionType === SessionType.Focus;
  const isIdleFocus = status === TimerStatus.Idle && isFocus;
  const progressPercent = Math.min(100, Math.max(0, progress * 100));

  return (
    <ScreenContainer>
      <AppHeader title="🍅 Meu Pomodoro" />

      <View className="flex-1 justify-center px-[18px] pb-6">
        <Ticket>
          <SessionChip sessionType={sessionType} />

          <Text
            accessibilityLabel={`Tempo restante ${formatCountdown(remainingMs)}`}
            accessibilityRole="timer"
            className="mb-1.5 text-center text-[58px] font-bold leading-[62px] text-foreground"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {formatCountdown(remainingMs)}
          </Text>
          {targetEndsAt !== null ? (
            <Text className="mb-4 text-center text-[12.5px] text-muted">
              termina às {formatClockTime(targetEndsAt)}
            </Text>
          ) : (
            <View className="mb-4 h-[18px]" />
          )}

          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(progressPercent) }}
            className="mb-4 h-2 overflow-hidden rounded-lg bg-border"
          >
            <View
              className={isFocus ? "h-full rounded-lg bg-tomato" : "h-full rounded-lg bg-primary"}
              style={{ width: `${progressPercent}%` }}
            />
          </View>

          <CycleDots
            completed={completedInCycle}
            current={isFocus ? currentPomodoro : null}
            total={pomodorosPerCycle}
          />
          <Text className="text-center text-xs text-muted">
            {isFocus
              ? `Pomodoro ${currentPomodoro} de ${pomodorosPerCycle}`
              : `${completedInCycle} ${completedInCycle === 1 ? "Pomodoro concluído" : "Pomodoros concluídos"} neste ciclo`}
          </Text>

          {isFocus ? (
            <TaskInput editable={isIdleFocus} onChange={setTask} value={task} />
          ) : (
            <View className="mt-3.5 border-t border-dashed border-border pt-3.5">
              <Text className="text-center text-[13px] text-muted">🌿 Levante, alongue, respire</Text>
            </View>
          )}
        </Ticket>

        <TimerControls
          onPause={pause}
          onRestart={restart}
          onResume={resume}
          onSkip={skip}
          onStart={start}
          status={status}
        />
      </View>
    </ScreenContainer>
  );
}
