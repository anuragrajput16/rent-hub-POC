import { useCallback, useEffect, useRef, useState } from "react";
import { detectWalls, getCatalog, getHealth, getSample, placeRooms, readPlan } from "./api.js";
import PlanCanvas from "./components/PlanCanvas.jsx";
import BedroomCard from "./components/BedroomCard.jsx";
import ClearanceStrip from "./components/ClearanceStrip.jsx";
import RoomEditor from "./components/RoomEditor.jsx";
import { ftin } from "./lib.js";

export default function App() {
  const [mode, setMode] = useState("sample"); // sample | read
  const [sample, setSample] = useState(null);
  const [bedrooms, setBedrooms] = useState([]);
  const [imageURL, setImageURL] = useState(null);
  const [chosen, setChosen] = useState({});
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [health, setHealth] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [over, setOver] = useState(false);

  // manual mode
  const [walls, setWalls] = useState(null);
  const [scale, setScale] = useState(null);
  const [planWidthFt, setPlanWidthFt] = useState(25);
  const [drafts, setDrafts] = useState([]);
  const [drawMode, setDrawMode] = useState(false);

  const fileRef = useRef(null);
  const objectURL = useRef(null);
  const pendingFile = useRef(null);
  const readMeta = useRef({});   // what the reader was and wasn't sure about

  const loadSample = useCallback(() => {
    getSample()
      .then((data) => {
        setSample(data);
        setBedrooms(data.bedrooms);
        setMode("sample");
        setChosen({});
        setSelected(0);
        setError("");
        setDrafts([]);
        setWalls(null);
        setDrawMode(false);
        if (objectURL.current) URL.revokeObjectURL(objectURL.current);
        objectURL.current = null;
        pendingFile.current = null;
        setImageURL(null);
      })
      .catch((e) => setError(`${e.message} Is the API running on port 8000?`));
  }, []);

  useEffect(() => {
    loadSample();
    getHealth().then(setHealth).catch(() => setHealth({ ok: false, detection_available: false }));
    getCatalog().then(setCatalog).catch(() => {});
    return () => {
      if (objectURL.current) URL.revokeObjectURL(objectURL.current);
    };
  }, [loadSample]);

  // Re-solve whenever a room is corrected. No model call — pure geometry.
  useEffect(() => {
    if (mode === "sample") return;
    if (!drafts.length) {
      setBedrooms([]);
      return;
    }
    placeRooms(drafts)
      .then((d) =>
        setBedrooms(d.bedrooms.map((b) => ({ ...b, read: readMeta.current[b.id] })))
      )
      .catch((e) => setError(e.message));
  }, [drafts, mode]);

  function takeFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    if (objectURL.current) URL.revokeObjectURL(objectURL.current);
    objectURL.current = URL.createObjectURL(file);
    pendingFile.current = file;

    setImageURL(objectURL.current);
    setBedrooms([]);
    setDrafts([]);
    setChosen({});
    setError("");
    readAndSolve(file, planWidthFt);
  }

  /** Upload, read, recommend — the whole thing, with no key involved. */
  function readAndSolve(file, widthFt) {
    setMode("read");
    setBusy(true);
    setDrawMode(false);
    Promise.all([
      readPlan(file, widthFt),
      detectWalls(file, widthFt).catch(() => null),
    ])
      .then(([data, wallData]) => {
        readMeta.current = Object.fromEntries(data.bedrooms.map((b) => [b.id, b.read]));
        setBedrooms(data.bedrooms);
        setDrafts(
          data.bedrooms.map((b) => ({
            id: b.id, label: b.label, box: b.box,
            room_ft: b.size_ft, openings: b.openings || [],
          }))
        );
        setScale(wallData);
        setWalls(wallData?.walls || null);
        setSelected(0);
        setError("");
      })
      .catch((e) => setError(e.message))
      .finally(() => setBusy(false));
  }

  /** A better scale means a better read, so run the whole thing again. */
  function rescale(nextWidth) {
    setPlanWidthFt(nextWidth);
    if (pendingFile.current && nextWidth >= 4) {
      readAndSolve(pendingFile.current, nextWidth);
    }
  }

  function sizeOf(box, s) {
    const sc = s || scale;
    if (!sc?.ft_per_px) return { width: 10, depth: 10 };
    return {
      width: Math.max(3, Number((box.w * sc.image_px.w * sc.ft_per_px).toFixed(2))),
      depth: Math.max(3, Number((box.h * sc.image_px.h * sc.ft_per_px).toFixed(2))),
    };
  }

  function addDrawn(box) {
    const id = `bedroom_${Date.now()}`;
    readMeta.current[id] = null;
    setDrafts((ds) => [
      ...ds,
      { id, label: `Bedroom ${ds.length + 1}`, box, room_ft: sizeOf(box), openings: [] },
    ]);
    setSelected(drafts.length);
    setDrawMode(false);
  }

  function updateDraft(next) {
    readMeta.current[next.id] = null;   // corrected by hand: the flag has served its purpose
    setDrafts((ds) => ds.map((d) => (d.id === next.id ? next : d)));
  }

  function removeDraft(id) {
    setDrafts((ds) => ds.filter((d) => d.id !== id));
    setSelected(0);
  }

  const room = bedrooms[selected];
  const option = room
    ? room.options.find((o) => o.bed === (chosen[room.id] || room.recommended))
    : null;
  const draft = mode !== "sample" ? drafts[selected] : null;

  return (
    <div className="wrap">
      <header className="top">
        <div>
          <p className="eyebrow">Unit interior spec · placement engine</p>
          <h1>Bed Fit</h1>
          <p className="sub">
            Upload a 2D plan and it reads itself — room names from the printed text, walls from
            the pixels. Every bedroom gets a bed against the wall the brand guide allows, and
            anything the reader was unsure about is flagged rather than guessed at.
          </p>
        </div>
        <div className="top-actions">
          <span className="health" data-ok={health?.detection_available ? "1" : "0"}>
            <i className="dot" />
            {health === null
              ? "checking API"
              : `reads plans locally · no key needed${health.detection_available ? " · key also set" : ""}`}
          </span>
          <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>
            Upload plan
          </button>
          {mode !== "sample" && (
            <button className="btn" onClick={loadSample}>
              Unit 101 sample
            </button>
          )}
        </div>
      </header>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && takeFile(e.target.files[0])}
      />

      <div className="grid">
        <section className="panel plan-panel">
          <PlanCanvas
            imageURL={imageURL}
            sample={sample}
            bedrooms={bedrooms}
            chosen={chosen}
            selected={selected}
            onSelect={setSelected}
            busy={busy}
            walls={walls}
            drawMode={mode !== "sample" && drawMode}
            onDrawn={addDrawn}
          />

          <div className="legend">
            <span>
              <i style={{ background: "var(--ok)" }} /> bed, clearances met
            </span>
            <span>
              <i style={{ background: "var(--warn)" }} /> bed, fits with a caveat
            </span>
            <span>
              <i style={{ background: "color-mix(in srgb, var(--bad) 30%, transparent)", border: "1px dotted var(--bad)" }} />{" "}
              door swing
            </span>
            <span>
              <i style={{ background: "color-mix(in srgb, var(--ink-2) 30%, transparent)", border: "1px dashed var(--ink-2)" }} />{" "}
              nightstand
            </span>
            {mode !== "sample" && (
              <span>
                <i style={{ background: "var(--accent)" }} /> wall found in the image
              </span>
            )}
          </div>

          {mode !== "sample" ? (
            <div className="drop" style={{ cursor: "default" }}>
              <div className="drop-t">
                {drawMode
                  ? "Drag a box around the bedroom"
                  : `Read ${bedrooms.length} bedroom${bedrooms.length === 1 ? "" : "s"} off the plan`}
              </div>
              <div className="drop-s">
                Room names come from the text, walls from the pixels. Set the plan width to fix
                the scale; anything flagged on the right can be corrected.
              </div>
              <div className="scale-row" style={{ marginTop: 10 }}>
                <label className="field" style={{ maxWidth: 150 }}>
                  <span>Plan is __ ft wide</span>
                  <input
                    type="number"
                    step="0.5"
                    min="4"
                    max="400"
                    value={planWidthFt}
                    onChange={(e) => rescale(Number(e.target.value) || 0)}
                  />
                </label>
                <button className="btn" onClick={() => setDrawMode((d) => !d)}>
                  {drawMode ? "Cancel" : "Add a bedroom by hand"}
                </button>
                {scale?.derived_size_ft && (
                  <span className="hint" style={{ marginBottom: 8 }}>
                    Plan reads {ftin(scale.derived_size_ft.width)} ×{" "}
                    {ftin(scale.derived_size_ft.depth)}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div
              className="drop"
              data-over={over ? "1" : "0"}
              onClick={() => fileRef.current?.click()}
              onDragEnter={(e) => { e.preventDefault(); setOver(true); }}
              onDragOver={(e) => { e.preventDefault(); setOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setOver(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                takeFile(e.dataTransfer.files?.[0]);
              }}
            >
              <div className="drop-t">Drop a floor plan here, or click to choose</div>
              <div className="drop-s">
                PNG, JPG or WebP · works best when room sizes are printed on the plan
              </div>
            </div>
          )}

          <ClearanceStrip room={room} option={option} clearances={catalog?.clearances_ft} />
        </section>

        <aside className="rail">
          {error && (
            <div className="alert">
              <b>Heads up. </b>
              {error}
            </div>
          )}

          {mode !== "sample" && !drafts.length && !busy && (
            <div className="panel pad">
              <div className="pad-title">No bedrooms yet</div>
              <p className="hint">
                Drag a box around a bedroom on the plan. Its edges snap to the walls found in
                the image, and its size comes from the plan width you entered.
              </p>
            </div>
          )}

          {bedrooms.map((r, i) => (
            <BedroomCard
              key={r.id}
              room={r}
              index={i}
              active={i === selected}
              chosenBed={chosen[r.id] || r.recommended}
              onSelect={() => setSelected(i)}
              onPickBed={(bed) => {
                setChosen((c) => ({ ...c, [r.id]: bed }));
                setSelected(i);
              }}
            />
          ))}

          {draft && (
            <RoomEditor
              room={draft}
              onChange={updateDraft}
              onRemove={() => removeDraft(draft.id)}
            />
          )}

          {catalog && (
            <div className="panel pad">
              <div className="pad-title">Clearance rules</div>
              <div className="dim-foot" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
                <div>
                  Walkway aim<b>{ftin(catalog.clearances_ft.walk_side)}</b>
                </div>
                <div>
                  Minimum side<b>{ftin(catalog.clearances_ft.min_side)}</b>
                </div>
                <div>
                  Past the foot<b>{ftin(catalog.clearances_ft.foot)}</b>
                </div>
                <div>
                  Door swing<b>{ftin(catalog.door_swing_ft)}</b>
                </div>
              </div>
            </div>
          )}

          {bedrooms.length > 0 && (
            <div className="panel pad">
              <div className="pad-title">Export</div>
              <div className="stack">
                <button
                  className="btn"
                  onClick={() => navigator.clipboard?.writeText(JSON.stringify(bedrooms, null, 2))}
                >
                  Copy placement JSON
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      <p className="foot">
        Bed sizes come from <code>unit_101_interior_spec.json</code> — queen 5′×6′8″, king
        6′4″×6′8″ — which differ from the older <code>bed_fit_reference.md</code> (queen 5′×6′6″,
        king 6′×6′6″). The brand guide wins; retune in <code>backend/app/catalog.py</code>. A side
        under {ftin(catalog?.clearances_ft?.min_side ?? 1.5)} stops counting as a walkway, and a
        door sweeps a square of its own width just inside the room. Plans are read on your own
        machine with Tesseract — room names from the text, walls from the pixels — so no API key
        and no per-plan cost. Where a label is covered by furniture the text genuinely cannot be
        recovered, so that room is flagged for you to check rather than guessed at.
      </p>
    </div>
  );
}
