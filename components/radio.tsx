import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import tracks from "../data/tracks.json";
const pet = new URL("../assets/radio-pet.png", import.meta.url).href;
const volumeKey = "evan-universe-radio-volume";
type Status = "idle" | "loading" | "playing" | "paused" | "error";
export function Radio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const graph = useRef<{ context: AudioContext; gain: GainNode } | null>(null);
  const request = useRef(0),
    wanted = useRef(false),
    indexRef = useRef(0),
    volumeRef = useRef(0.2);
  const [index, setIndex] = useState(0),
    [volume, setVolume] = useState(0.2),
    [status, setStatus] = useState<Status>("idle");
  const track = tracks[index],
    active = status === "playing" || status === "loading";
  useEffect(() => {
    try {
      const saved = localStorage.getItem(volumeKey);
      if (saved !== null) {
        const n = Number(saved);
        if (Number.isFinite(n) && n >= 0 && n <= 1) {
          volumeRef.current = n;
          setVolume(n);
        }
      }
    } catch {}
    const audio = audioRef.current;
    return () => {
      request.current++;
      wanted.current = false;
      audio?.pause();
      audio?.removeAttribute("src");
      const old = graph.current;
      graph.current = null;
      void old?.context.close().catch(() => {});
    };
  }, []);
  function changeVolume(next: number) {
    volumeRef.current = next;
    setVolume(next);
    if (graph.current)
      graph.current.gain.gain.setTargetAtTime(next, graph.current.context.currentTime, 0.025);
    else if (audioRef.current) audioRef.current.volume = next;
    try {
      localStorage.setItem(volumeKey, String(next));
    } catch {}
  }
  function pause() {
    request.current++;
    wanted.current = false;
    audioRef.current?.pause();
    setStatus("paused");
  }
  function play(next = indexRef.current) {
    const audio = audioRef.current;
    if (!audio) return;
    const id = ++request.current;
    wanted.current = true;
    indexRef.current = next;
    setIndex(next);
    setStatus("loading");
    if (!graph.current && typeof AudioContext !== "undefined") {
      try {
        const context = new AudioContext(),
          source = context.createMediaElementSource(audio),
          gain = context.createGain();
        gain.gain.value = volumeRef.current;
        source.connect(gain).connect(context.destination);
        graph.current = { context, gain };
      } catch {}
    }
    audio.volume = graph.current ? 1 : volumeRef.current;
    const src = new URL(import.meta.env.BASE_URL + tracks[next].src, document.baseURI).href;
    if (audio.src !== src) audio.src = src;
    else if (audio.error) audio.load();
    void Promise.all([graph.current?.context.resume(), audio.play()])
      .then(() => {
        if (id === request.current && wanted.current) setStatus("playing");
      })
      .catch(() => {
        if (id !== request.current) return;
        wanted.current = false;
        audio.pause();
        setStatus("error");
      });
  }
  function skip(direction: number) {
    const next = (indexRef.current + direction + tracks.length) % tracks.length;
    play(next);
  }
  return (
    <aside
      className={`radio ${status === "playing" ? "is-playing" : ""}`}
      aria-label="Masayoshi radio"
    >
      <audio
        ref={audioRef}
        preload="none"
        onEnded={() => {
          if (wanted.current) skip(1);
        }}
        onPlaying={() => {
          if (wanted.current) setStatus("playing");
        }}
        onWaiting={() => {
          if (wanted.current) setStatus("loading");
        }}
        onPause={() => {
          if (wanted.current && status === "playing" && !audioRef.current?.ended) pause();
        }}
        onError={() => {
          if (audioRef.current?.error) {
            wanted.current = false;
            setStatus("error");
          }
        }}
      />
      <div className="radio-top">
        <button
          className="radio-character"
          onClick={() => (active ? pause() : play())}
          aria-label={active ? "Pause radio" : "Play radio"}
        >
          <img src={pet} alt="" width="80" height="80" />
        </button>
        <div className="radio-intro">
          <p>
            <span className="radio-light" /> COSMIC RADIO
          </p>
          <h2>Masayoshi’s 8-bit mix</h2>
          <span>{tracks.length} tracks from the game</span>
        </div>
      </div>
      <label className="sr-only" htmlFor="radio-track">
        Choose a track
      </label>
      <select id="radio-track" value={index} onChange={(e) => play(Number(e.target.value))}>
        {tracks.map((t, i) => (
          <option key={t.number} value={i}>
            {String(i + 1).padStart(2, "0")} · {t.title}
          </option>
        ))}
      </select>
      <div className="radio-bottom">
        <div className="transport">
          <button aria-label="Previous track" onClick={() => skip(-1)}>
            <SkipBack size={18} />
          </button>
          <button
            className="radio-play"
            aria-label={active ? "Pause music" : "Play music"}
            onClick={() => (active ? pause() : play())}
          >
            {active ? (
              <Pause size={19} fill="currentColor" />
            ) : (
              <Play size={19} fill="currentColor" />
            )}
          </button>
          <button aria-label="Next track" onClick={() => skip(1)}>
            <SkipForward size={18} />
          </button>
        </div>
        <label className="volume">
          {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          <span className="sr-only">Radio volume</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(volume * 100)}
            onChange={(e) => changeVolume(Number(e.target.value) / 100)}
            aria-label="Radio volume"
          />
        </label>
      </div>
      <p className={`radio-status ${status === "error" ? "radio-error" : ""}`} role="status">
        {status === "error"
          ? "Couldn’t play. Press play to try again."
          : status === "loading"
            ? "Tuning in…"
            : status === "playing"
              ? `Playing · ${track.title}`
              : status === "paused"
                ? "Taking a little breather."
                : "Press play when you feel like it."}
      </p>
    </aside>
  );
}
