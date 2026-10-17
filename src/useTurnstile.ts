import { isRecord } from "../shared/json.ts";
import { useEffect, useRef, useState } from "react";

interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme: "dark";
      size: "compact" | "flexible";
      "response-field": false;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ): string;
  reset(widget: string): void;
  remove(widget: string): void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}
let scriptPromise: Promise<TurnstileApi> | null = null;
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
        if (window.turnstile) resolve(window.turnstile);
        else fail();
      };
      script.onerror = fail;
      document.head.append(script);
    });
  return scriptPromise;
}

export function useTurnstile() {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
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
        const config: unknown = await response.json();
        if (!isRecord(config)) throw new Error("Configuration unavailable");
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
        if (!active || !container.current) return;
        widget.current = api.render(container.current, {
          sitekey: config.siteKey,
          action: "contact",
          theme: "dark",
          size: container.current.clientWidth < 300 ? "compact" : "flexible",
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
