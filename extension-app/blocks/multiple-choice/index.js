import {
  textareaField,
  toggleField,
  collect,
  textInput,
  radioField,
} from "../shared/form-helper.js";

export const meta = {
  id: "multiple-choice",
  name: "Multiple Choice",
  description: "Scoreable question block with configurable feedback.",
  icon: "C",
  category: "Assessment",
  defaultConfig: {
    prompt: "What is the correct answer?",
    choices: ["Option A", "Option B", "Option C"],
    correctIndex: 0,
    requireCorrectAnswer: true,
    revealCorrectAnswer: false,
    correctFeedback: "That is correct!",
    incorrectFeedback: "Not quite. Try again.",
  },
};

export function builder(root, config, onChange) {
  textareaField(root, "Prompt", config.prompt, (v) => onChange({ prompt: v }), 3);
  radioField(root, "Correct answer", config.choices, config.choices[config.correctIndex], (v) => {
    onChange({ correctIndex: Math.max(0, config.choices.indexOf(v)) });
  });
  collect(root, "Choices", config.choices.slice(), "Type an answer choice", (index, value) => {
    if (value === null) {
      const choices = config.choices.filter((_, i) => i !== index);
      onChange({ choices, correctIndex: choices.indexOf(config.choices[config.correctIndex]) });
    } else {
      const choices = config.choices.map((c, i) => (i === index ? value : c));
      onChange({ choices, correctIndex: choices.indexOf(config.choices[config.correctIndex]) });
    }
  });
  toggleField(root, "Require correct answer to continue", config.requireCorrectAnswer, (v) =>
    onChange({ requireCorrectAnswer: v })
  );
  toggleField(root, "Reveal correct answer after submit", config.revealCorrectAnswer, (v) =>
    onChange({ revealCorrectAnswer: v })
  );
  textInput(root, "Correct feedback", config.correctFeedback, (v) => onChange({ correctFeedback: v }));
  textInput(root, "Incorrect feedback", config.incorrectFeedback, (v) => onChange({ incorrectFeedback: v }));
}

export function viewer(root, config, host) {
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "background:#fff;border:1px solid #e2e4ee;border-radius:14px;box-shadow:0 12px 32px rgba(28,30,38,.08);padding:24px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;";
  const prompt = document.createElement("div");
  prompt.style.cssText = "font-size:18px;font-weight:650;color:#1c1e26;margin-bottom:16px;white-space:pre-wrap;";
  prompt.textContent = config.prompt;
  wrap.appendChild(prompt);

  let answered = false;
  let selected = -1;
  const choices = config.choices.map((label, index) => {
    const el = document.createElement("button");
    el.type = "button";
    el.textContent = label;
    el.style.cssText =
      "display:block;width:100%;text-align:left;box-sizing:border-box;padding:12px 14px;margin-bottom:8px;border:1px solid #e2e4ee;border-radius:10px;background:#fff;cursor:pointer;font:500 14px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#1c1e26;transition:border-color .12s,background .12s;";
    el.addEventListener("mouseenter", () => {
      if (!answered) el.style.borderColor = "#6d5df6";
    });
    el.addEventListener("mouseleave", () => {
      if (!answered) el.style.borderColor = "#e2e4ee";
    });
    el.addEventListener("click", () => {
      if (answered) return;
      selected = index;
      const isCorrect = index === config.correctIndex;
      const correct = config.revealCorrectAnswer;
      answered = correct || isCorrect;
      choices.forEach((c, ci) => {
        c.style.borderColor = "#e2e4ee";
        c.style.background = "#fff";
      });
      el.style.borderColor = isCorrect ? "#1aa179" : "#d9404c";
      el.style.background = isCorrect ? "rgba(26,161,121,.08)" : "rgba(217,64,76,.06)";
      if (answered) {
        const feedback = document.createElement("div");
        feedback.style.cssText =
          "margin-top:12px;font-size:14px;color:" + (isCorrect ? "#1aa179" : "#d9404c") + ";font-weight:600;";
        feedback.textContent = isCorrect ? config.correctFeedback : config.incorrectFeedback;
        wrap.appendChild(feedback);
      }
      if (host && host.track) {
        host.track("multiple-choice.answer", {
          choice: label,
          correct: isCorrect,
          standard: host.standard || "scorm2004",
        });
      }
    });
    wrap.appendChild(el);
    return el;
  });

  if (host && host.onComplete && config.requireCorrectAnswer && !config.revealCorrectAnswer) {
    const observer = new MutationObserver(() => {
      if (answered && selected === config.correctIndex) {
        host.onComplete();
        observer.disconnect();
      }
    });
    observer.observe(wrap, { childList: true, subtree: true });
  }
}