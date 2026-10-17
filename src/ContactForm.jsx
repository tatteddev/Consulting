import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check } from "@phosphor-icons/react";
import { useTurnstile } from "./useTurnstile.js";
const services = [
  "Architecture & modernization",
  "Engineering leadership & delivery",
  "Practical AI workflows",
].map((title) => ({ title }));
export function ContactForm({ topic, setTopic }) {
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");
  const pending = useRef(false);
  const attempt = useRef(null);
  const statusRef = useRef(null);
  const busy = state === "sending";
  const security = useTurnstile();

  useEffect(() => {
    if (!pending.current) {
      setState("idle");
      setError("");
      attempt.current = null;
    }
  }, [topic]);

  async function submit(event) {
    event.preventDefault();
    if (pending.current || !security.ready) return;
    const form = event.currentTarget;
    form.elements.name.setCustomValidity(
      form.elements.name.value.trim() ? "" : "Please enter your name.",
    );
    form.elements.message.setCustomValidity(
      form.elements.message.value.trim().length >= 20
        ? ""
        : "Please add at least 20 characters about your project.",
    );
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    const signature = JSON.stringify(values);
    if (attempt.current?.signature !== signature)
      attempt.current = { signature, requestId: crypto.randomUUID() };
    pending.current = true;
    setState("sending");
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          requestId: attempt.current.requestId,
          turnstileToken: security.token,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true)
        throw new Error(
          result?.error || "We couldn't send your inquiry. Please try again.",
        );
      setState("sent");
      form.reset();
      attempt.current = null;
    } catch (failure) {
      setState("error");
      setError(
        failure.name === "TimeoutError"
          ? "We couldn't confirm submission. Your message is still here—please try again."
          : failure.message ||
              "We couldn't send your inquiry. Please try again.",
      );
    } finally {
      security.reset();
      pending.current = false;
      requestAnimationFrame(() => statusRef.current?.focus());
    }
  }
  return (
    <form
      onSubmit={submit}
      aria-busy={busy}
      onChange={(event) => {
        event.target.setCustomValidity?.("");
        if (!pending.current) {
          setState("idle");
          setError("");
        }
      }}
    >
      <fieldset disabled={busy}>
        <div className="form-pair">
          <label>
            Your name
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={100}
              placeholder="Alex Morgan"
            />
          </label>
          <label>
            Email address
            <input
              name="email"
              autoComplete="email"
              type="email"
              required
              maxLength={254}
              placeholder="alex@company.com"
            />
          </label>
        </div>
        <label htmlFor="inquiry-topic">Where could I help?</label>
        <select
          id="inquiry-topic"
          name="topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
        >
          <option value="Let's figure it out">Let’s figure it out</option>
          {services.map((service) => (
            <option key={service.title}>{service.title}</option>
          ))}
        </select>
        <label>
          A little about what you have in mind
          <textarea
            name="message"
            required
            minLength={20}
            maxLength={2500}
            rows={4}
            placeholder="What are you working on, and what’s getting in the way?"
          />
        </label>
        <div className="form-trap" aria-hidden="true">
          <label>
            Leave this field empty
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <div className="contact-security" ref={security.container} />
        {security.message && <p role="status">{security.message}</p>}
        <div className="form-bottom">
          <p>Your details are used to respond to your inquiry.</p>
          <button
            className="button primary"
            type="submit"
            disabled={busy || !security.ready}
          >
            {busy ? "Sending…" : "Send inquiry"}{" "}
            <ArrowUpRight size={19} aria-hidden="true" />
          </button>
        </div>
      </fieldset>
      {state === "sent" && (
        <div
          className="form-notice success"
          ref={statusRef}
          tabIndex={-1}
          role="status"
        >
          <Check size={20} aria-hidden="true" />
          <div>
            <h3>Thanks—your inquiry is on its way.</h3>
            <p>I’ll review your message and get back to you by email.</p>
          </div>
        </div>
      )}
      {state === "error" && (
        <div
          className="form-notice error"
          ref={statusRef}
          tabIndex={-1}
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}
    </form>
  );
}
