import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { format } from "date-fns";
import type { AiChatRequest, AiChatResponse, AiConversation, ChatMessage } from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { apiGet, apiPost } from "../../lib/api";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export function AiAssistantScreen() {
  const { theme } = useTheme();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    // Load the most recent conversation's history, if any, so the chat
    // isn't empty every time the tab is reopened.
    (async () => {
      try {
        const conversations = await apiGet<AiConversation[]>("/api/ai/conversations");
        const latest = conversations[0];
        if (latest) {
          setConversationId(latest.id);
          const history = await apiGet<ChatMessage[]>(`/api/ai/conversations/${latest.id}/messages`);
          setMessages(
            history
              .filter((m) => m.role !== "system")
              .map((m) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
                createdAt: m.createdAt,
              })),
          );
        }
      } catch (e) {
        console.warn("Failed to load AI conversation history", e);
      }
    })();
  }, []);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setError(null);
    const optimisticId = `local-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: optimisticId, role: "user", content: trimmed, createdAt: new Date().toISOString() },
    ]);
    setInput("");
    setSending(true);
    try {
      const request: AiChatRequest = { message: trimmed, conversationId: conversationId ?? undefined };
      const response = await apiPost<AiChatResponse>("/api/ai/chat", request);
      setConversationId(response.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: `${response.conversationId}-${response.createdAt}`,
          role: "assistant",
          content: response.reply,
          createdAt: response.createdAt,
        },
      ]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={[styles.header, { color: theme.colors.textPrimary }]}>Organizer AI</Text>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === "user"
                ? { alignSelf: "flex-end", backgroundColor: theme.colors.accent }
                : { alignSelf: "flex-start", backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 },
            ]}
          >
            <Text style={{ color: item.role === "user" ? "#0B0F19" : theme.colors.textPrimary }}>
              {item.content}
            </Text>
            <Text
              style={[
                styles.timestamp,
                { color: item.role === "user" ? "#0B0F19AA" : theme.colors.textSecondary },
              ]}
            >
              {format(new Date(item.createdAt), "h:mm a")}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: theme.colors.textSecondary, textAlign: "center", marginTop: 40 }}>
            Ask your AI assistant anything - homework help, business advice, or habit tips.
          </Text>
        }
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={[styles.inputRow, { borderTopColor: theme.colors.border }]}>
        <Input
          value={input}
          onChangeText={setInput}
          placeholder="Ask your AI assistant anything…"
          containerStyle={styles.textInput}
          onSubmitEditing={handleSend}
        />
        <Button title="Send" onPress={handleSend} loading={sending} style={styles.sendButton} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  header: { fontSize: 22, fontWeight: "800", marginBottom: 12, paddingTop: 44 },
  bubble: { borderRadius: 16, padding: 12, marginBottom: 10, maxWidth: "82%" },
  timestamp: { fontSize: 10, marginTop: 6 },
  inputRow: { flexDirection: "row", alignItems: "center", padding: 12, borderTopWidth: 1, gap: 8 },
  textInput: { flex: 1, marginBottom: 0 },
  sendButton: { paddingHorizontal: 18 },
  error: { color: "#DC2626", textAlign: "center", marginBottom: 4 },
});
