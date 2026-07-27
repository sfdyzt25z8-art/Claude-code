import React, { useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { Button } from "../ui/Button";

export interface TutorialStep {
  title: string;
  body: string;
}

interface TutorialOverlayProps {
  visible: boolean;
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip: () => void;
}

/**
 * Simple full-screen step-through tutorial with dot indicators + skip,
 * reused across the app (first-run + Settings > Tutorial Center) and
 * gated by `profile.tutorialCompleted`.
 */
export function TutorialOverlay({ visible, steps, onComplete, onSkip }: TutorialOverlayProps) {
  const { theme } = useTheme();
  const [stepIndex, setStepIndex] = useState(0);

  if (!steps.length) return null;
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  function handleNext() {
    if (isLast) {
      onComplete();
      setStepIndex(0);
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{step.title}</Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{step.body}</Text>

          <View style={styles.dots}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === stepIndex ? theme.colors.accent : theme.colors.border,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <Button title="Skip" variant="outline" onPress={onSkip} style={styles.skipButton} />
            <Button
              title={isLast ? "Get started" : "Next"}
              onPress={handleNext}
              style={styles.nextButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  skipButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});
