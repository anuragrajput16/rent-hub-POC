import { BOX_VARS, ftin, STATUS_LABEL, statusVar } from "../lib.js";

export default function BedroomCard({ room, index, active, chosenBed, onSelect, onPickBed }) {
  const color = `var(${BOX_VARS[index % BOX_VARS.length]})`;
  const recommended = room.options.find((o) => o.bed === room.recommended);
  const shown = room.options.find((o) => o.bed === chosenBed) || recommended;
  const sc = `var(${statusVar(shown.status)})`;

  return (
    <div
      className="card"
      data-active={active ? "1" : "0"}
      style={{ "--bc": color }}
      onClick={onSelect}
    >
      <div className="card-top">
        <span className="card-n" style={{ "--bc": color }}>
          {index + 1}
        </span>
        <span className="card-name">{room.label}</span>
        <span className="card-dim">
          {ftin(room.size_ft.width)} × {ftin(room.size_ft.depth)}
        </span>
        {room.read?.needs_review && <span className="warn-chip" title="Needs checking">!</span>}
      </div>

      {room.read?.needs_review && (
        <div className="review">
          <div className="review-k">Check this one</div>
          <ul className="review-list">
            {room.read.review.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="headwall">
        <span className="headwall-k">Headboard</span>
        <span className="headwall-v">{room.headboard_reasoning}</span>
      </div>

      <div className="card-verdict">
        <span className="card-best">{shown.label.replace(" bed", "")}</span>
        <span className="pill" style={{ "--sc": sc }}>
          {STATUS_LABEL[shown.status] || shown.status}
        </span>
      </div>

      <div className="choices">
        {room.options.map((o) => {
          const fits = o.status !== "DOES_NOT_FIT";
          const dot = `var(${statusVar(o.status)})`;
          const tight =
            o.clearances_achieved_ft.side_a === null
              ? null
              : Math.min(o.clearances_achieved_ft.side_a, o.clearances_achieved_ft.side_b);
          return (
            <button
              key={o.bed}
              className="choice"
              data-on={o.bed === shown.bed ? "1" : "0"}
              disabled={!fits}
              onClick={(e) => {
                e.stopPropagation();
                onPickBed(o.bed);
              }}
            >
              <span className="dot" style={{ "--dc": dot }} />
              <span className="choice-name">{o.label.replace(" bed", "")}</span>
              <span className="choice-gap">{tight === null ? "no fit" : `${ftin(tight)} side`}</span>
            </button>
          );
        })}
      </div>

      <p className="why">{shown.notes}</p>

      {(room.openings || []).length > 0 && (
        <div className="openings">
          {room.openings.map((op, i) => (
            <div className="op-row" key={i}>
              <span className="op-kind">{op.type}</span>
              <span>
                {op.wall} wall
                {op.role ? ` · ${op.role.replace(/_/g, " ")}` : ""}
              </span>
              {op.span_ft_local && (
                <span className="op-span">
                  {ftin(op.span_ft_local[0])}–{ftin(op.span_ft_local[1])}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
