import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Radio } from "../components/radio";
import { Sparkles, Palette, Moon, Sun } from "lucide-react";
import { Galaxy } from "../components/galaxy";
import "./style.css";
const brandLogo = new URL("../assets/evan-tyson-logo-v1.png", import.meta.url).href;
function App() {
  const [calm, setCalm] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [colour, setColour] = useState(0);
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const respect = () => {
      if (media.matches) setCalm(true);
    };
    media.addEventListener("change", respect);
    return () => media.removeEventListener("change", respect);
  }, []);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (tool: unknown, options: { signal: AbortSignal }) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const life = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "configure_galaxy",
            title: "Set the galaxy mood",
            description: "Set calm mode and the trail colour using the same controls as the page.",
            inputSchema: {
              type: "object",
              properties: {
                calm: { type: "boolean" },
                colour: { type: "integer", minimum: 0, maximum: 2 },
              },
              required: ["calm", "colour"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute(input: unknown) {
              if (!input || typeof input !== "object") throw Error("Expected galaxy settings");
              const value = input as Record<string, unknown>;
              if (
                Object.keys(value).some((k) => !["calm", "colour"].includes(k)) ||
                typeof value.calm !== "boolean" ||
                !Number.isInteger(value.colour) ||
                Number(value.colour) < 0 ||
                Number(value.colour) > 2
              )
                throw Error("Use calm: boolean and colour: 0, 1 or 2");
              flushSync(() => {
                setCalm(value.calm as boolean);
                setColour(value.colour as number);
              });
              return { calm: value.calm, colour: value.colour };
            },
          },
          { signal: life.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => life.abort();
  }, []);
  return (
    <main className="universe">
      <Galaxy calm={calm} colour={colour} burst={burst} />
      <header>
        <a className="wordmark" href="#" aria-label="Evan's Universe home">
          <img className="brand-portrait" src={brandLogo} alt="" width={72} height={72} />
          <span>EVAN’S UNIVERSE</span>
        </a>
        <button className="calm-toggle" onClick={() => setCalm(!calm)} aria-pressed={calm}>
          {calm ? <Sun size={18} /> : <Moon size={18} />}
          <span>{calm ? "Wake the sky" : "Calm mode"}</span>
        </button>
      </header>
      <section className="greeting">
        <p>HELLO, EXPLORER</p>
        <h1>
          A little space.
          <br />
          <em>All yours.</em>
        </h1>
        <p className="instruction">
          Move your mouse. Make some magic.<span>On a tablet? Draw with your finger.</span>
        </p>
      </section>
      <div className="sky-tools" aria-label="Sky controls">
        <button onClick={() => setColour((colour + 1) % 3)} aria-label="Change trail colour">
          <Palette size={20} />
          <span>Colour</span>
          <i className={`swatch swatch-${colour}`} />
        </button>
        <span className="divider" />
        <button
          onClick={() => {
            setCalm(false);
            setBurst((count) => count + 1);
          }}
        >
          <Sparkles size={20} />
          <span>Star burst</span>
        </button>
      </div>
      <Radio />
      <p className="quiet-label">YOUR CORNER OF THE COSMOS</p>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
