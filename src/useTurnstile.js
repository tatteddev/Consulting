import { useEffect, useRef, useState } from "react";

let scriptPromise;
function loadScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise)
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      const fail = () => {
        clearTimeout(timer);
        script.remove();
        scriptPromise = null;
        reject(new Error("Security check unavailable."));
      };
      const timer = setTimeout(fail, 10000);
      script.onload = () => {
        clearTimeout(timer);
        resolve(window.turnstile);
      };
      script.onerror = fail;
      document.head.append(script);
    });
  return scriptPromise;
}

export function useTurnstile() {
  const container = useRef(null);
  const widget = useRef(null);
  const [token, setToken] = useState("");
  const [required, setRequired] = useState(true);
  const [message, setMessage] = useState("Loading security check…");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    (async () => {
      try {
        const response = await fetch("/api/contact-config", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Configuration unavailable");
        const config = await response.json();
        if (!active) return;
        if (
          config.required === false &&
          ["localhost", "127.0.0.1"].includes(window.location.hostname)
        ) {
          setRequired(false);
          setLoaded(true);
          setMessage("");
          return;
        }
        if (typeof config.siteKey !== "string" || !config.siteKey)
          throw new Error("Configuration unavailable");
        const api = await loadScript();
        if (!active) return;
        widget.current = api.render(container.current, {
          sitekey: config.siteKey,
          action: "contact",
          theme: "dark",
          size: container.current.clientWidth < 300
            ? "compact"
            : "flexible",
          "response-field": false,
          callback: (value) => {
            if (active) {
              setToken(value);
              setMessage("");
            }
          },
          "expired-callback": () => {
            if (active) {
              setToken("");
              setMessage("Please complete the security check again.");
            }
          },
          "error-callback": () => {
            if (active) {
              setToken("");
              setMessage(
                "Security check unavailable. Please retry or use the email link.",
              );
            }
          },
        });
        setLoaded(true);
        setMessage("");
      } catch {
        if (active)
          setMessage(
            "Security check unavailable. Please refresh or use the email link.",
          );
      } finally {
        clearTimeout(timeout);
      }
    })();
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeout);
      if (widget.current !== null) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, []);
  function reset() {
    setToken("");
    if (widget.current !== null) window.turnstile?.reset(widget.current);
  }
  return {
    container,
    token,
    message,
    ready: loaded && (!required || Boolean(token)),
    reset,
  };
}
