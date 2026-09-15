import {
  facilitySurveySchema
} from "/survey-schema.js";

import {
  saveSubmission,
  getAllSubmissions,
  getPendingSubmissions,
  updateSubmission
} from "/db.js";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log(
          "Service Worker registered:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error(
          "Service Worker registration failed:",
          error
        );
      });
  });
}

const formEl =
  document.querySelector("#survey-form");

const titleEl =
  document.querySelector("#form-title");

titleEl.textContent =
  facilitySurveySchema.title;

const answers = {};

function renderForm() {
  formEl.innerHTML = "";

  for (
    const field
    of facilitySurveySchema.fields
  ) {
    if (!shouldShowField(field)) {
      continue;
    }

    formEl.appendChild(
      renderField(field)
    );
  }

  const actions =
    document.createElement("div");

  actions.className = "actions";

  const submitButton =
    document.createElement("button");

  submitButton.type = "submit";
  submitButton.textContent =
    "Lưu khảo sát";

  actions.appendChild(submitButton);
  formEl.appendChild(actions);
}

function shouldShowField(field) {
  if (!field.showIf) {
    return true;
  }

  return (
    answers[field.showIf.field]
    === field.showIf.equals
  );
}

function removeHiddenAnswers() {
  for (
    const field
    of facilitySurveySchema.fields
  ) {
    if (!shouldShowField(field)) {
      delete answers[field.id];
    }
  }
}

function updateNetworkStatus() {
  const statusEl =
    document.querySelector(
      "#network-status"
    );

  if (navigator.onLine) {
    statusEl.textContent = "🟢 Online";
  } else {
    statusEl.textContent = "🔴 Offline";
  }
}

updateNetworkStatus();

function renderField(field) {
  const wrapper =
    document.createElement("div");

  wrapper.className = "field";

  if (field.type === "text") {
    const label =
      document.createElement("label");

    label.textContent = field.label;

    const input =
      document.createElement("input");

    input.type = "text";
    input.value =
      answers[field.id] ?? "";

    input.addEventListener(
      "input",
      () => {
        answers[field.id] =
          input.value;
      }
    );

    wrapper.append(label, input);
  }

  if (field.type === "textarea") {
    const label =
      document.createElement("label");

    label.textContent = field.label;

    const textarea =
      document.createElement("textarea");

    textarea.value =
      answers[field.id] ?? "";

    textarea.addEventListener(
      "input",
      () => {
        answers[field.id] =
          textarea.value;
      }
    );

    wrapper.append(
      label,
      textarea
    );
  }

  if (field.type === "radio") {
    const label =
      document.createElement("div");

    label.className =
      "field-label";

    label.textContent =
      field.label;

    wrapper.appendChild(label);

    for (
      const option
      of field.options
    ) {
      const optionLabel =
        document.createElement("label");

      optionLabel.className =
        "radio-option";

      const input =
        document.createElement("input");

      input.type = "radio";
      input.name = field.id;
      input.value = option.value;

      input.checked =
        answers[field.id]
        === option.value;

      input.addEventListener(
        "change",
        () => {
          answers[field.id] =
            option.value;

          removeHiddenAnswers();
          renderForm();
        }
      );

      optionLabel.append(
        input,
        ` ${option.label}`
      );

      wrapper.appendChild(
        optionLabel
      );
    }
  }

  return wrapper;
}

renderForm();

function validateAnswers() {
  const errors = [];

  for (
    const field
    of facilitySurveySchema.fields
  ) {
    if (!shouldShowField(field)) {
      continue;
    }

    if (
      field.required
      && !answers[field.id]
    ) {
      errors.push(
        `${field.label} là bắt buộc`
      );
    }
  }

  return errors;
}

formEl.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const errors =
      validateAnswers();

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    removeHiddenAnswers();

    const submission = {
      id: crypto.randomUUID(),

      formId:
        facilitySurveySchema.id,

      answers: {
        ...answers
      },

      createdAt:
        new Date().toISOString(),

      syncStatus: "pending",
      syncAttempts: 0,
      lastError: null,
      syncedAt: null
    };

    await saveSubmission(
      submission
    );

    console.log(
      "Saved locally:",
      submission
    );

    clearForm();

    await renderSubmissionList();

    if (navigator.onLine) {
      await syncPendingSubmissions();
    }
  }
);

function clearForm() {
  for (
    const key
    of Object.keys(answers)
  ) {
    delete answers[key];
  }

  renderForm();
}

const listEl =
  document.querySelector(
    "#submission-list"
  );

function getOptionLabel(fieldId, value) {
  if (!value) {
    return "—";
  }

  const field =
    facilitySurveySchema.fields.find(
      (f) => f.id === fieldId
    );

  const option =
    field?.options?.find(
      (o) => o.value === value
    );

  return option?.label ?? value;
}

function formatCreatedAt(isoString) {
  if (!isoString) {
    return "—";
  }

  return new Date(isoString)
    .toLocaleString("vi-VN");
}

const counterEl =
  document.querySelector(
    "#sync-counter"
  );

function updateSyncCounter(submissions) {
  const pendingCount =
    submissions.filter(
      (s) => s.syncStatus === "pending"
    ).length;

  const syncedCount =
    submissions.filter(
      (s) => s.syncStatus === "synced"
    ).length;

  counterEl.textContent =
    `Pending: ${pendingCount}  |  Synced: ${syncedCount}`;
}

async function
  renderSubmissionList() {
  const submissions =
    await getAllSubmissions();

  updateSyncCounter(submissions);

  submissions.sort(
    (a, b) =>
      new Date(b.createdAt)
      - new Date(a.createdAt)
  );

  listEl.innerHTML = "";

  if (
    submissions.length === 0
  ) {
    listEl.textContent =
      "Chưa có submission.";

    return;
  }

  for (
    const submission
    of submissions
  ) {
    const item =
      document.createElement(
        "div"
      );

    item.className =
      "submission";

    item.innerHTML = `
      <strong>
        ${submission.answers
        .facility_name
      ?? "(Không tên)"
      }
      </strong>

      <p>
        Tòa nhà:
        ${getOptionLabel(
        "building",
        submission.answers.building
      )
      }
      </p>

      <p>
        Loại hạng mục:
        ${getOptionLabel(
        "facility_type",
        submission.answers.facility_type
      )
      }
      </p>

      <p>
        Tình trạng:
        ${getOptionLabel(
        "condition",
        submission.answers.condition
      )
      }
      </p>

      <p>
        Created:
        ${formatCreatedAt(
        submission.createdAt
      )
      }
      </p>

      <p>
        ID:
        <code>
          ${submission.id}
        </code>
      </p>

      <span class="badge">
        ${submission.syncStatus}
      </span>
    `;

    listEl.appendChild(item);
  }
}

renderSubmissionList();

let syncInProgress = false;

async function
  syncPendingSubmissions() {
  if (syncInProgress) {
    return;
  }

  if (!navigator.onLine) {
    console.log(
      "Skip sync: browser is offline"
    );

    return;
  }

  syncInProgress = true;

  try {
    const pending =
      await getPendingSubmissions();

    console.log(
      `Sync ${pending.length}
       pending submission(s)`
    );

    for (
      const submission
      of pending
    ) {
      await syncOneSubmission(
        submission
      );
    }
  } finally {
    syncInProgress = false;

    await renderSubmissionList();
  }
}

async function
  syncOneSubmission(submission) {
  try {
    const response =
      await fetch(
        "/api/submissions",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            id: submission.id,

            formId:
              submission.formId,

            answers:
              submission.answers,

            createdAt:
              submission.createdAt
          })
        }
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    await updateSubmission(
      submission.id,
      {
        syncStatus: "synced",

        syncedAt:
          new Date()
            .toISOString(),

        lastError: null
      }
    );

    console.log(
      "Synced:",
      submission.id
    );
  } catch (error) {
    await updateSubmission(
      submission.id,
      {
        syncStatus: "pending",

        syncAttempts:
          submission.syncAttempts
          + 1,

        lastError:
          String(
            error.message
            ?? error
          )
      }
    );

    console.error(
      "Sync failed:",
      submission.id,
      error
    );
  }
}

window.addEventListener(
  "online",
  async () => {
    updateNetworkStatus();

    console.log(
      "Online again → try sync"
    );

    await syncPendingSubmissions();
  }
);

window.addEventListener(
  "offline",
  updateNetworkStatus
);

document
  .querySelector("#sync-button")
  .addEventListener(
    "click",
    syncPendingSubmissions
  );