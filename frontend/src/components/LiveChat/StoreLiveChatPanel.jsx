/**
 * Live chat khách ↔ Sales (user-service). Không dùng chatbot-service.
 */
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/appSlice";
import {
  buildLiveChatCustomerProfile,
  getGuestSessionToken,
  guestPollMessages,
  guestSendMessage,
  setGuestSessionToken,
  startLiveChatSession,
} from "../../services/liveChatService";
import "../Chatbot/StoreChatbot.css";

const mapLiveMessages = (apiMessages) =>
  (apiMessages || []).map((m) => ({
    id: m.id,
    role: m.senderType === "CUSTOMER" ? "user" : "assistant",
    text: m.body,
    senderName: m.senderName,
    senderType: m.senderType,
  }));

const ChatBubble = ({ msg }) => (
  <div className={`store-chatbot-row ${msg.role}`}>
    <div className="store-chatbot-row-avatar" aria-hidden>
      {msg.role === "user" ? (
        <PersonOutlineIcon sx={{ fontSize: 16 }} />
      ) : (
        <SupportAgentIcon sx={{ fontSize: 16 }} />
      )}
    </div>
    <div className={`store-chatbot-msg ${msg.role}`}>
      {msg.senderName && msg.role !== "user" && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          {msg.senderName}
        </Typography>
      )}
      {msg.text}
    </div>
  </div>
);

const StoreLiveChatPanel = () => {
  const { t } = useTranslation();
  const user = useSelector(selectUser);
  const welcome = t("liveChat.welcome");
  const [liveSessionToken, setLiveToken] = useState(() => getGuestSessionToken());
  const [lastLiveMsgId, setLastLiveMsgId] = useState(0);
  const [messages, setMessages] = useState([{ role: "assistant", text: welcome }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "assistant" && !prev[0].id) {
        return [{ role: "assistant", text: welcome }];
      }
      return prev;
    });
  }, [welcome]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const customerProfile = buildLiveChatCustomerProfile(user);

  const ensureLiveSession = useCallback(
    async (initialMessage) => {
      if (liveSessionToken) return liveSessionToken;
      const profile = buildLiveChatCustomerProfile(user);
      const res = await startLiveChatSession(profile, initialMessage);
      setLiveToken(res.sessionToken);
      return res.sessionToken;
    },
    [liveSessionToken, user]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setConnecting(true);
      setError("");
      try {
        const token = await ensureLiveSession(null);
        if (cancelled) return;
        const all = await guestPollMessages(token, 0);
        if (all.length > 0) {
          setMessages(mapLiveMessages(all));
          setLastLiveMsgId(Math.max(...all.map((m) => m.id)));
        }
      } catch (e) {
        if (!cancelled) setError(e.message || t("liveChat.connectError"));
      } finally {
        if (!cancelled) setConnecting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!liveSessionToken) return;
    const poll = async () => {
      try {
        const incoming = await guestPollMessages(liveSessionToken, lastLiveMsgId);
        if (incoming.length === 0) return;
        const mapped = mapLiveMessages(incoming);
        setMessages((prev) => {
          const withoutId = prev.filter((m) => !m.id);
          const ids = new Set(withoutId.map((m) => m.id).filter(Boolean));
          const merged = [...withoutId];
          mapped.forEach((m) => {
            if (!ids.has(m.id)) merged.push(m);
          });
          return merged;
        });
        setLastLiveMsgId(Math.max(...incoming.map((m) => m.id)));
      } catch {
        /* polling */
      }
    };
    poll();
    const interval = setInterval(poll, 3500);
    return () => clearInterval(interval);
  }, [liveSessionToken, lastLiveMsgId]);

  const handleNewChat = async () => {
    setGuestSessionToken(null);
    setLiveToken(null);
    setLastLiveMsgId(0);
    setMessages([{ role: "assistant", text: welcome }]);
    setConnecting(true);
    setError("");
    try {
      const token = await startLiveChatSession(buildLiveChatCustomerProfile(user));
      setLiveToken(token.sessionToken);
      const all = await guestPollMessages(token.sessionToken, 0);
      if (all.length) {
        setMessages(mapLiveMessages(all));
        setLastLiveMsgId(Math.max(...all.map((m) => m.id)));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setConnecting(false);
      inputRef.current?.focus();
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);
    setInput("");
    try {
      const token = await ensureLiveSession(q);
      await guestSendMessage(token, q);
      const all = await guestPollMessages(token, 0);
      setMessages(mapLiveMessages(all));
      if (all.length) setLastLiveMsgId(Math.max(...all.map((m) => m.id)));
      setError("");
    } catch (err) {
      setError(err.message || t("liveChat.sendFail"));
    } finally {
      setLoading(false);
    }
  };

  const guestStatus = user?.id
    ? ` · KH#${user.id}`
    : ` · ${t("liveChat.guestNotLoggedIn")}`;

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid #e8eaed",
        maxWidth: 720,
        mx: "auto",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          background: "linear-gradient(135deg, #d32f2f 0%, #ff7a00 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SupportAgentIcon />
          <Box>
            <Typography fontWeight="bold">{t("liveChat.title")}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {customerProfile.guestName}
              {guestStatus} · {t("liveChat.updateInterval")}
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={handleNewChat}
          sx={{ color: "#fff" }}
          title={t("liveChat.newChat")}
          aria-label={t("liveChat.newChat")}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          minHeight: 380,
          maxHeight: 480,
          overflow: "auto",
          p: 2,
          bgcolor: "#f8fafc",
        }}
      >
        {connecting ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <CircularProgress size={32} sx={{ color: "#ff7a00" }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {t("liveChat.connecting")}
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <ChatBubble key={msg.id || idx} msg={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      <Box
        component="form"
        onSubmit={handleSend}
        sx={{
          p: 2,
          borderTop: "1px solid #e8eaed",
          display: "flex",
          gap: 1,
          bgcolor: "#fff",
        }}
      >
        <TextField
          inputRef={inputRef}
          fullWidth
          size="small"
          placeholder={t("liveChat.placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={connecting || loading}
        />
        <IconButton type="submit" color="primary" disabled={connecting || loading || !input.trim()}>
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default StoreLiveChatPanel;
