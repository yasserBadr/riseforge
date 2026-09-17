const doc = document;

export function create(tag, attrs) {
  const el = doc.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null) continue;
      if (k === "class") el.className = v;
      else if (k === "style") el.style.cssText = v;
      else el.setAttribute(k, v);
    }
  }
  return el;
}

export function textInput(root, label, value, cb) {
  const el = create("rf-input", { label, value });
  el.addEventListener("change", (e) => cb(e.detail.value));
  root.appendChild(el);
  return el;
}

export function textareaField(root, label, value, cb, rows) {
  const el = create("rf-textarea", { label, value, rows: String(rows || 3) });
  el.addEventListener("change", (e) => cb(e.detail.value));
  root.appendChild(el);
  return el;
}

export function numberField(root, label, value, cb, opts) {
  const el = create("rf-number", {
    label,
    value: value === undefined ? "" : String(value),
    step: opts && opts.step ? String(opts.step) : "1",
    min: opts && opts.min !== undefined ? String(opts.min) : "",
    max: opts && opts.max !== undefined ? String(opts.max) : "",
  });
  el.addEventListener("change", (e) => cb(e.detail.value));
  root.appendChild(el);
  return el;
}

export function selectField(root, label, options, value, cb) {
  const el = create("rf-select", { label, options: options.join(","), value });
  el.addEventListener("change", (e) => cb(e.detail.value));
  root.appendChild(el);
  return el;
}

export function toggleField(root, label, checked, cb) {
  const el = create("rf-toggle", { label });
  if (checked) el.setAttribute("checked", "");
  el.addEventListener("change", (e) => cb(e.detail.checked));
  root.appendChild(el);
  return el;
}

export function colorField(root, label, value, cb) {
  const el = create("rf-color-input", { value: value || "#6d5df6" });
  el.addEventListener("change", (e) => cb(e.detail.value));
  const wrapper = create("div", { style: "margin: 2px 0 12px;" });
  const labelEl = create("div", { class: "rf-field-label" });
  labelEl.textContent = label;
  labelEl.style.cssText = "font-size:12px;font-weight:600;color:#565a6b;margin-bottom:5px;";
  wrapper.append(labelEl, el);
  root.appendChild(wrapper);
  return el;
}

export function sliderField(root, label, value, min, max, step, unit, cb) {
  const el = create("rf-slider", {
    label,
    value: String(value),
    min: String(min),
    max: String(max),
    step: String(step || 1),
    unit: unit || "",
  });
  el.addEventListener("change", (e) => cb(e.detail.value));
  const wrapper = create("div", { style: "margin-bottom:12px;" });
  wrapper.appendChild(el);
  root.appendChild(wrapper);
  return el;
}

export function radioField(root, label, options, value, cb) {
  const el = create("rf-radio-group", { label, options: options.join(","), value });
  el.addEventListener("change", (e) => cb(e.detail.value));
  const wrapper = create("div", { style: "margin-bottom:12px;" });
  wrapper.appendChild(el);
  root.appendChild(wrapper);
  return el;
}

export function collect(root, label, items, placeholder, update) {
  const wrap = create("div", { style: "margin-bottom:14px;" });
  const heading = create("div", { style: "font-size:12px;font-weight:600;color:#565a6b;margin-bottom:6px;" });
  heading.textContent = label;
  wrap.appendChild(heading);
  const render = () => {
    wrap.querySelectorAll(".rf-collect-item").forEach((n) => n.remove());
    items.forEach((item, index) => {
      const rowWrap = create("div", { class: "rf-collect-item", style: "display:flex;gap:6px;align-items:center;margin-bottom:6px;" });
      const input = create("input", {
        type: "text",
        value: item,
        placeholder,
        style: "flex:1;box-sizing:border-box;border:1px solid #c9cddd;border-radius:7px;padding:8px 10px;font:14px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;outline:none;",
      });
      input.addEventListener("input", () => update(index, input.value));
      const del = create("button", {
        style: "border:1px solid #e2e4ee;background:#f0f1f7;border-radius:7px;width:34px;cursor:pointer;font-size:14px;color:#d9404c;",
        type: "button",
      });
      del.textContent = "+";
      del.style.transform = "rotate(45deg)";
      del.addEventListener("click", () => update(index, null));
      const add = create("button", {
        style: "border:1px solid #e2e4ee;background:#f6f7fb;border-radius:7px;width:34px;cursor:pointer;font-size:16px;color:#6d5df6;",
        type: "button",
      });
      add.textContent = "+";
      add.addEventListener("click", () => {
        items.splice(index + 1, 0, "");
        render();
      });
      rowWrap.append(input, del, add);
      wrap.appendChild(rowWrap);
    });
  };
  render();
  root.appendChild(wrap);
  return wrap;
}