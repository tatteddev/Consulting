import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowDown, List, X, Check } from "@phosphor-icons/react";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import { ContactForm } from "./ContactForm.tsx";

const modes = [
  {
    name: "Explore",
    title: "See the whole picture.",
    text: "Understand the product, the people and the constraints before choosing the technology.",
  },
  {
    name: "Connect",
    title: "Bring the pieces together.",
    text: "Connect architecture decisions to business goals, and give the team a shared direction.",
  },
  {
    name: "Simplify",
    title: "Make the next step clear.",
    text: "Find the smallest useful change. Remove friction, build with purpose and move the work forward.",
  },
];
const services = [
  {
    number: "01",
    title: "Architecture & modernization",
    text: "Make the next technical decision with confidence. Shape a practical architecture, untangle older systems and create a path forward.",
    outcome: "A clear technical direction",
  },
  {
    number: "02",
    title: "Engineering leadership & delivery",
    text: "Bring structure to the work and momentum to the team. Get hands-on support with delivery, engineering practices and the decisions that keep things moving.",
    outcome: "A team equipped to deliver",
  },
  {
    number: "03",
    title: "Practical AI workflows",
    text: "Move from experimenting with AI to using it well. Find useful applications, improve development workflows and keep quality at the center.",
    outcome: "AI that earns its place",
  },
];

function Workbench() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const scene = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updatePreference();
    updateVisibility();
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    if (scene.current) observer.observe(scene.current);
    return () => {
      preference.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer.disconnect();
    };
  }, []);
  const running = !reducedMotion && visible && pageVisible;
  function handleKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % modes.length;
    if (event.key === "ArrowLeft")
      next = (index + modes.length - 1) % modes.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = modes.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }
  return (
    <div className="workbench">
      <div
        ref={scene}
        className={`scene scene-animated scene-${active}`}
        data-motion-running={running}
      >
        <picture>
          <source
            type="image/webp"
            srcSet="/assets/workbench-neon-640.webp 640w, /assets/workbench-neon-1000.webp 1000w, /assets/workbench-neon-1448.webp 1448w"
            sizes="(max-width: 760px) 100vw, 62vw"
          />
          <img
            className="stage-image"
            src="/assets/workbench-neon-1000.webp"
            width="1448"
            height="1086"
            alt="A graphite laptop workbench connecting four stationary structures: Product, Services, Data and Delivery. Violet data travels across the screen and board."
            fetchPriority="high"
          />
        </picture>
        <div className="data-packets" aria-hidden="true">
          {[
            "screen-one",
            "screen-two",
            "product",
            "services",
            "data",
            "delivery",
            "hub",
            "ambient-left",
            "ambient-right",
          ].map((route) => (
            <img
              key={route}
              className={`data-packet packet-${route}`}
              src="/assets/data-packet.webp"
              alt=""
              width="128"
              height="128"
            />
          ))}
          {["product", "services", "data", "delivery"].map((route) => (
            <img
              key={`trail-${route}`}
              className={`data-packet packet-${route} packet-trail`}
              src="/assets/data-packet.webp"
              alt=""
              width="128"
              height="128"
            />
          ))}
        </div>
        <div className="physical-controls" aria-hidden="true">
          {modes.map((mode, i) => (
            <button
              type="button"
              tabIndex={-1}
              key={mode.name}
              onClick={() => setActive(i)}
              title={mode.name}
            />
          ))}
        </div>
      </div>
      <div className="workbench-console">
        <div className="console-toolbar">
          <div
            className="mode-tabs"
            role="tablist"
            aria-label="Explore my approach"
          >
            {modes.map((mode, i) => (
              <button
                type="button"
                key={mode.name}
                role="tab"
                id={`mode-${i}`}
                aria-controls={`panel-${i}`}
                aria-selected={active === i}
                tabIndex={active === i ? 0 : -1}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                onKeyDown={(event) => handleKey(event, i)}
                onClick={() => setActive(i)}
              >
                <span className="mode-number">0{i + 1}</span>
                {mode.name}
              </button>
            ))}
          </div>
        </div>
        {modes.map((mode, i) => (
          <div
            key={mode.name}
            role="tabpanel"
            id={`panel-${i}`}
            aria-labelledby={`mode-${i}`}
            hidden={active !== i}
            tabIndex={0}
            className="mode-panel"
          >
            <strong>{mode.title}</strong>
            <p>{mode.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [topic, setTopic] = useState("Let's figure it out");
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header wrap">
        <a href="#" className="wordmark" aria-label="Oleg Novoselskyy, home">
          Oleg Novoselskyy<span className="brand-dot">.</span>
        </a>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-controls="main-nav"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={23} /> : <List size={23} />}
        </button>
        <nav
          id="main-nav"
          aria-label="Main navigation"
          className={menuOpen ? "nav-open" : ""}
          onClick={() => setMenuOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setMenuOpen(false);
              document
                .querySelector<HTMLButtonElement>(".menu-toggle")
                ?.focus();
            }
          }}
        >
          <a href="#services">How I help</a>
          <a href="#about">About me</a>
          <a className="nav-contact" href="#contact">
            Let’s talk <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </nav>
      </header>
      <main id="main">
        <section className="hero wrap" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="hero-intro">
              <p className="eyebrow">
                <span className="status-dot" /> INDEPENDENT TECHNOLOGY
                CONSULTANT
              </p>
              <h1 id="hero-title">
                Clear direction.
                <br />
                Real <em>progress.</em>
              </h1>
            </div>
            <div className="hero-details">
              <p className="hero-description">
                Architecture, engineering leadership and practical AI. I help
                businesses and teams make confident decisions—and get the work
                delivered.
              </p>
              <a className="button primary hero-cta" href="#contact">
                Let’s talk <ArrowUpRight size={20} aria-hidden="true" />
              </a>
              <p className="hero-availability">
                Available for select consulting engagements.
              </p>
              <div className="hero-person">
                <img
                  src="/assets/oleg-portrait.webp"
                  alt="Oleg Novoselskyy"
                  width="60"
                  height="60"
                />
                <p>
                  <strong>Oleg Novoselskyy</strong>
                  <span>Builder. Technical leader. Thought partner.</span>
                </p>
              </div>
            </div>
          </div>
          <Workbench />
          <a href="#services" className="scroll-link">
            <ArrowDown size={15} aria-hidden="true" /> A LITTLE CLARITY GOES A
            LONG WAY
          </a>
        </section>
        <section
          id="services"
          className="services section wrap"
          aria-labelledby="services-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">HOW I HELP</p>
              <h2 id="services-title">
                Experience <em>where it counts.</em>
              </h2>
            </div>
            <p>
              For the decisions that matter.
              <br />
              And the work that comes next.
            </p>
          </div>
          <div className="service-grid">
            {services.map((service) => (
              <article className="service" key={service.number}>
                <span className="tiny-label service-number">
                  {service.number} /
                </span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <div className="service-outcome">
                  <Check size={16} aria-hidden="true" />
                  {service.outcome}
                </div>
                <a
                  href="#contact"
                  onClick={() => setTopic(service.title)}
                  aria-label={`Talk about ${service.title.toLowerCase()}`}
                >
                  Let’s work through it{" "}
                  <ArrowUpRight size={18} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </section>
        <section
          id="about"
          className="about section wrap"
          aria-labelledby="about-title"
        >
          <div className="about-copy">
            <p className="eyebrow">THE PERSON BEHIND THE WORK</p>
            <h2 id="about-title">
              A builder since twelve.
              <br />A leader through <em>experience.</em>
            </h2>
            <p>
              I’ve been building websites since I was about twelve. Nearly a
              decade of professional software development has taken me from web
              developer to software engineer to technical lead, now leading
              multiple teams.
            </p>
            <p>
              I’m comfortable shaping the architecture, explaining the tradeoffs
              and rolling up my sleeves to build. I help teams establish better
              practices, get work across the finish line and use AI with
              purpose.
            </p>
            <p>
              Outside that work, I run HoneyDrunk Studios, my personal digital
              lab, and write as Tatted Dev. Curiosity is still the starting
              point.
            </p>
            <div className="elsewhere">
              <a href="https://tatteddev.com/" target="_blank" rel="noreferrer">
                Writing <ArrowUpRight size={16} aria-hidden="true" />
              </a>
              <a
                href="https://honeydrunkstudios.com/"
                target="_blank"
                rel="noreferrer"
              >
                The lab <ArrowUpRight size={16} aria-hidden="true" />
              </a>
              <a
                href="https://github.com/tatteddev"
                target="_blank"
                rel="noreferrer"
              >
                GitHub <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
        <section
          id="approach"
          className="approach section wrap"
          aria-labelledby="approach-title"
        >
          <p className="eyebrow">WORKING TOGETHER</p>
          <div className="approach-layout">
            <h2 id="approach-title">
              A thought partner.
              <br />
              With a builder’s <em>instinct.</em>
            </h2>
            <div className="steps">
              <div>
                <span>01</span>
                <div>
                  <h3>Start with your reality.</h3>
                  <p>
                    We talk through your goals, your team and the problems worth
                    solving.
                  </p>
                </div>
              </div>
              <div>
                <span>02</span>
                <div>
                  <h3>Make a practical plan.</h3>
                  <p>
                    We agree on a focused scope, clear priorities and what
                    progress looks like.
                  </p>
                </div>
              </div>
              <div>
                <span>03</span>
                <div>
                  <h3>Move the work forward.</h3>
                  <p>
                    Advice, hands-on implementation or support for your
                    team—whatever the work calls for.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          id="contact"
          className="contact section wrap"
          aria-labelledby="contact-title"
        >
          <div className="contact-intro">
            <p className="eyebrow">LET’S FIND YOUR NEXT STEP</p>
            <h2 id="contact-title">
              Something on
              <br />
              your <em>mind?</em>
            </h2>
            <p>
              A technical decision, a team challenge or an idea you’re ready to
              build. Tell me a little about it.
            </p>
            <p className="availability">
              <span className="status-dot" /> Available for select consulting
              engagements.
            </p>
            <a
              className="direct-email"
              href="mailto:oleg.novoselskyy@gmail.com"
            >
              Prefer email? <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
          <ContactForm topic={topic} setTopic={setTopic} />
        </section>
      </main>
      <footer className="wrap">
        <a className="wordmark" href="#">
          Oleg Novoselskyy<span className="brand-dot">.</span>
        </a>
        <span>Thoughtful systems. Meaningful progress.</span>
        <a href="#main">
          Back to top <ArrowUpRight size={17} aria-hidden="true" />
        </a>
        <small>© {new Date().getFullYear()} Oleg Novoselskyy</small>
      </footer>
    </>
  );
}
