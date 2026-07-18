import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import CloseIcon from "@mui/icons-material/Close";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import {
  Box,
  Chip,
  CircularProgress,
  Fab,
  IconButton,
  TextField,
  Tooltip,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/appSlice";
import {
  checkChatbotHealth,
  sendChatMessageStream,
} from "../../services/chatbotService";
import "./StoreChatbot.css";

const QUICK_QUESTION_KEYS = ["chatbot.quick1", "chatbot.quick2", "chatbot.quick3", "chatbot.quick4"];

const STATUS_HINT_KEYS = {
  started: "chatbot.statusStarted",
  retrieving: "chatbot.statusRetrieving",
  generating: "chatbot.statusGenerating",
  complete: "chatbot.statusComplete",
  cache_hit: "chatbot.statusCache",
};

function getUserFriendlyStatus(healthOk, healthLabel, t) {
  if (healthOk) return { label: t("chatbot.online"), online: true };
  if (healthLabel.includes("Neo4j") || healthLabel.includes("đồng bộ"))
    return { label: t("chatbot.connecting"), online: false };
  if (healthLabel.includes("NVIDIA"))
    return { label: t("chatbot.starting"), online: false };
  return { label: t("chatbot.offline"), online: false };
}

const TypingIndicator = () => {
  const { t } = useTranslation();
  return (
    <div className="store-chatbot-typing" aria-label={t("chatbot.typing")}>
      <span />
      <span />
      <span />
    </div>
  );
};

function getOrCreateSessionId(userId) {
  const key = "electro_chatbot_session";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    const prefix = userId ? `user_${userId}` : "guest";
    sid = `${prefix}_${Date.now()}`;
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

const ChatMessage = ({ msg }) => {
  const { t } = useTranslation();
  return (
  <div
    className={`store-chatbot-row ${msg.role} ${msg.loading ? "loading" : ""}`}
  >
    <div className="store-chatbot-row-avatar" aria-hidden>
      {msg.role === "user" ? (
        <PersonOutlineIcon sx={{ fontSize: 16 }} />
      ) : (
        <SupportAgentOutlinedIcon sx={{ fontSize: 16 }} />
      )}
    </div>
    <div
      className={`store-chatbot-msg ${msg.role} ${msg.loading ? "loading" : ""}`}
    >
      {msg.loading && !msg.text ? (
        <>
          {msg.statusHint && (
            <span className="store-chatbot-status-hint">{msg.statusHint}</span>
          )}
          <TypingIndicator />
        </>
      ) : (
        <>
          {msg.text}
          {msg.fromCache && (
            <span className="store-chatbot-msg-meta store-chatbot-cache-badge">
              {t("chatbot.cacheBadge")}
            </span>
          )}
          {msg.status && msg.status !== "Accurate" && (
            <span className="store-chatbot-msg-meta">
              {t("chatbot.referenceInfo", { status: msg.status })}
            </span>
          )}
        </>
      )}
    </div>
  </div>
  );
};

const StoreChatbot = () => {
  const { t, i18n } = useTranslation();
  const user = useSelector(selectUser);
  const welcome = t("chatbot.welcome");
  const quickQuestions = useMemo(
    () => QUICK_QUESTION_KEYS.map((key) => t(key)),
    [t, i18n.language]
  );
  const statusHints = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(STATUS_HINT_KEYS).map(([phase, key]) => [phase, t(key)])
      ),
    [t, i18n.language]
  );

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [healthLabel, setHealthLabel] = useState(() => t("chatbot.healthChecking"));
  const [healthOk, setHealthOk] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: welcome },
  ]);
  const [clientHistory, setClientHistory] = useState([]);
  const [sessionId, setSessionId] = useState(() =>
    getOrCreateSessionId(user?.id)
  );
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const hasUserMessage = messages.some((m) => m.role === "user");
  const status = getUserFriendlyStatus(healthOk, healthLabel, t);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "assistant" && !prev[0].loading) {
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
  }, [messages, open, scrollToBottom]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const { data, error, url } = await checkChatbotHealth();
        if (cancelled) return;
        if (error) {
          setHealthOk(false);
          setHealthLabel(error);
          console.warn("[Chatbot] API URL:", url);
          return;
        }
        if (typeof data.neo4j_connected !== "boolean") {
          setHealthOk(false);
          setHealthLabel(t("chatbot.healthInvalid"));
          console.warn("[Chatbot] Health response invalid:", data, url);
          return;
        }
        const validatorOk =
            data.validator_configured ?? data.nvidia_configured;
        const ok =
          data.neo4j_connected &&
          data.nvidia_configured &&
          validatorOk &&
          data.graph_ready;
        setHealthOk(ok);
        if (ok) setHealthLabel(t("chatbot.healthReady"));
        else if (!data.neo4j_connected)
          setHealthLabel(t("chatbot.healthNeo4j"));
        else if (!data.nvidia_configured || !validatorOk)
          setHealthLabel(t("chatbot.healthNvidia"));
        else if (!data.graph_ready)
          setHealthLabel(t("chatbot.healthGraphEmpty"));
        else setHealthLabel(t("chatbot.healthNotReady"));
        if (!ok) {
          console.warn("[Chatbot] Health:", data, "URL:", url);
        }
      } catch (err) {
        if (!cancelled) {
          setHealthOk(false);
          setHealthLabel(t("chatbot.healthApiDown"));
          console.warn("[Chatbot] Health exception:", err);
        }
      }
    };
    run();
    const interval = setInterval(run, 45000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [t]);

  const handleNewChat = () => {
    const prefix = user?.id ? `user_${user.id}` : "guest";
    const sid = `${prefix}_${Date.now()}`;
    sessionStorage.setItem("electro_chatbot_session", sid);
    setSessionId(sid);
    setClientHistory([]);
    setMessages([{ role: "assistant", text: welcome }]);
    inputRef.current?.focus();
  };

  const sendQuestion = async (question) => {
    const q = question.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: "",
        loading: true,
        statusHint: statusHints.started,
      },
    ]);

    const updateAssistant = (patch) => {
      setMessages((prev) => {
        if (!prev.length || prev[prev.length - 1].role !== "assistant") {
          return prev;
        }
        const idx = prev.length - 1;
        return prev.map((m, i) => (i === idx ? { ...m, ...patch } : m));
      });
    };

    try {
      let fullAnswer = "";
      const done = await sendChatMessageStream({
        sessionId,
        question: q,
        history: clientHistory.slice(-10),
        onStatus: (data) => {
          const hint =
            statusHints[data.phase] || data.message || t("common.loading");
          updateAssistant({ statusHint: hint, loading: true });
        },
        onToken: (content) => {
          fullAnswer += content;
          updateAssistant({
            text: fullAnswer,
            loading: true,
            statusHint: statusHints.generating,
          });
        },
        onDone: (data) => {
          fullAnswer = data.answer || fullAnswer;
          updateAssistant({
            text: fullAnswer,
            loading: false,
            status: data.status,
            statusHint: undefined,
            fromCache: Boolean(data.from_cache),
          });
        },
      });

      const finalText = done?.answer || fullAnswer;
      if (finalText) {
        setClientHistory((prev) => [
          ...prev,
          `Khách: ${q}`,
          `Trợ lý: ${finalText}`,
        ]);
      }
    } catch (err) {
      updateAssistant({
        text:
          err.message ||
          t("chatbot.connectionError"),
        loading: false,
        statusHint: undefined,
      });
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuestion(input);
  };

  return createPortal(
    <div className="store-chatbot-root">
      {open && (
        <div
          className="store-chatbot-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {!open && (
        <div className="store-chatbot-fab-wrap">
          <span className="store-chatbot-fab-pulse" aria-hidden />
          {healthOk && (
            <span className="store-chatbot-fab-badge" title={t("chatbot.fabOnline")} />
          )}
          <Tooltip title={t("chatbot.fabTooltip")} placement="left" arrow>
            <Fab
              className="store-chatbot-fab"
              onClick={() => setOpen(true)}
              aria-label={t("chatbot.open")}
            >
              <SupportAgentOutlinedIcon sx={{ fontSize: 28 }} />
            </Fab>
          </Tooltip>
        </div>
      )}

      {open && (
        <Box
          className="store-chatbot-panel"
          role="dialog"
          aria-label={t("chatbot.dialogAria")}
          sx={{
            position: "fixed",
            bottom: 96,
            right: 24,
            left: "auto",
            zIndex: 1400,
          }}
        >
          <header className="store-chatbot-header">
            <div className="store-chatbot-header-info">
              <div className="store-chatbot-avatar">
                <SupportAgentOutlinedIcon sx={{ fontSize: 22 }} />
              </div>
              <div>
                <div className="store-chatbot-header-title">{t("chatbot.assistantName")}</div>
                <div className="store-chatbot-header-status">
                  <span
                    className={`store-chatbot-status-dot ${status.online ? "online" : "offline"}`}
                  />
                  {status.label}
                </div>
              </div>
            </div>
            <div className="store-chatbot-header-actions">
              <Tooltip title={t("chatbot.newChat")} arrow>
                <IconButton
                  size="small"
                  className="store-chatbot-header-btn"
                  onClick={handleNewChat}
                  aria-label={t("chatbot.newChat")}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("chatbot.close")} arrow>
                <IconButton
                  size="small"
                  className="store-chatbot-header-btn"
                  onClick={() => setOpen(false)}
                  aria-label={t("chatbot.close")}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          </header>

          <Box className="store-chatbot-messages">
            <div className="store-chatbot-date-divider">
              <span>{t("chatbot.today")}</span>
            </div>
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} msg={msg} />
            ))}
            <div ref={messagesEndRef} />
          </Box>

          {!healthOk && (
            <div className="store-chatbot-offline-banner" role="status">
              {t("chatbot.offlineBanner", {
                status: healthLabel || t("chatbot.offlineStarting"),
              })}
            </div>
          )}

          {!hasUserMessage && !loading && (
            <div className="store-chatbot-hints-wrap">
              <div className="store-chatbot-hints-label">{t("chatbot.quickHints")}</div>
              <div className="store-chatbot-hints">
                {quickQuestions.map((q) => (
                  <Chip
                    key={q}
                    label={q}
                    size="small"
                    variant="outlined"
                    className="store-chatbot-hint-chip"
                    onClick={() => sendQuestion(q)}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>
          )}

          <Box
            component="form"
            className="store-chatbot-input-wrap"
            onSubmit={handleSubmit}
          >
            <TextField
              inputRef={inputRef}
              fullWidth
              size="small"
              placeholder={t("chatbot.placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              multiline
              maxRows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <IconButton
              type="submit"
              className="store-chatbot-send-btn"
              disabled={loading || !input.trim()}
              aria-label={t("chatbot.send")}
            >
              {loading ? (
                <CircularProgress size={22} sx={{ color: "#fff" }} />
              ) : (
                <SendIcon fontSize="small" />
              )}
            </IconButton>
          </Box>
        </Box>
      )}
    </div>,
    document.body
  );
};

export default StoreChatbot;
