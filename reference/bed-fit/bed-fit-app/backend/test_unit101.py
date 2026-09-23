"""Check the engine reproduces unit_101_interior_spec.json -> bed_placement."""

import json
from app.placement import plan_bedroom

UNIT_101_BEDROOM = {
    "id": "bedroom",
    "label": "Bedroom",
    "room_ft": {"width": 11, "depth": 12},
    "openings": [
        {"type": "door", "role": "entry", "wall": "left",
         "span_ft_local": [0.9, 3.9], "width_ft": 3.0, "swing": "inward",
         "swing_footprint_local": [0, 0, 3.0, 3.0]},
        {"type": "window", "wall": "right", "span_ft_local": [3.7, 6.8], "width_ft": 3.0},
        {"type": "doorway", "role": "to_balcony", "wall": "bottom", "span_ft_local": [4.5, 7.6]},
    ],
}

EXPECTED = {
    "headboard_wall": "top",
    "recommended": "bed_queen",
    "bed_queen": {"box": [4.5, 0, 9.5, 6.67], "status": "RECOMMENDED",
                  "sides": (1.5, 1.5), "foot": 5.33},
    "bed_king":  {"box": [4.17, 0, 10.5, 6.67], "status": "FITS_WITH_CAVEAT",
                  "sides": (1.17, 0.5), "foot": 5.33},
}


def close(a, b, tol=0.02):
    return abs(a - b) <= tol


def main():
    got = plan_bedroom(UNIT_101_BEDROOM)
    fails = []

    if got["headboard_wall"] != EXPECTED["headboard_wall"]:
        fails.append(f"headboard_wall: {got['headboard_wall']} != {EXPECTED['headboard_wall']}")
    if got["recommended"] != EXPECTED["recommended"]:
        fails.append(f"recommended: {got['recommended']} != {EXPECTED['recommended']}")

    for opt in got["options"]:
        exp = EXPECTED[opt["bed"]]
        if opt["status"] != exp["status"]:
            fails.append(f"{opt['bed']} status: {opt['status']} != {exp['status']}")
        for i, (g, e) in enumerate(zip(opt["box_local_ft"], exp["box"])):
            if not close(g, e):
                fails.append(f"{opt['bed']} box[{i}]: {g} != {e}")
        c = opt["clearances_achieved_ft"]
        if not close(c["side_a"], exp["sides"][0]) or not close(c["side_b"], exp["sides"][1]):
            fails.append(f"{opt['bed']} sides: {(c['side_a'], c['side_b'])} != {exp['sides']}")
        if not close(c["foot"], exp["foot"]):
            fails.append(f"{opt['bed']} foot: {c['foot']} != {exp['foot']}")

    print(json.dumps(got, indent=2))
    print("\n" + "=" * 60)
    if fails:
        print("FAIL")
        for f in fails:
            print("  -", f)
        raise SystemExit(1)
    print("PASS — engine reproduces the Unit 101 spec exactly.")


if __name__ == "__main__":
    main()
