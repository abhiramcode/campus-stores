(() => {
  const storageKey = "campus-stores.shift.v1";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);
  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      dueAt: "Fri 20:00",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      dueAt: "Sat 10:00",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      dueAt: "Sat 12:00",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
    },
  ];
  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "Workshop",
      repair: true,
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  const people = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
  ];
  const shifts = [
    {
      time: "Friday · 3:45 pm",
      at: "Fri 15:45",
      req: "RQ-214",
      kind: "issue",
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      at: "Fri 19:30",
      req: "RQ-214",
      kind: "return",
      targetReturned: 2,
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      at: "Sat 09:00",
      req: "RQ-214",
      kind: "return",
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    },
  ];
  const pages = [
    ["Requests", "clipboard-list"],
    ["Issue out", "package-open"],
    ["Loan register", "book-open"],
    ["Inventory", "package"],
    ["Desk book", "messages-square"],
  ];
  const original = () => ({
    version: 2,
    tab: "Requests",
    phase: 0,
    selected: "",
    filter: "All items",
    loans: [
      {
        num: 401,
        req: "RQ-209",
        asset: "MI-09",
        collectedBy: "Tara Shah",
        returnedBy: "",
        returnedAt: "",
        back: false,
      },
    ],
    notes: [],
    editing: false,
    onlyOpen: true,
    draftReq: "",
    returning: 0,
    advancePrompt: false,
    notice: "Sample shift · All records are fictional.",
  });
  let s = original();
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const opts = (list, picked = "") =>
    list
      .map(
        ([v, t]) =>
          '<option value="' +
          esc(v) +
          '"' +
          (v === picked ? " selected" : "") +
          ">" +
          esc(t) +
          "</option>",
      )
      .join("");
  const btn = (label, act, val = "", style = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '">' +
    esc(label) +
    "</button>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    title +
    "</h2><small>" +
    sub +
    "</small></div>" +
    control +
    "</div>";
  const row = (label, sub, right) =>
    '<div class="row"><div><strong>' +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    "</small></div><div>" +
    right +
    "</div></div>";
  const badge = (t, tone = "") =>
    '<span class="tag' + (tone ? " " + tone : "") + '">' + esc(t) + "</span>";
  const DAY_INDEX = { Fri: 0, Sat: 1 };
  const mins = (v) => {
    const [day, time] = v.split(" ");
    const [h, m] = time.split(":").map(Number);
    return DAY_INDEX[day] * 1440 + h * 60 + m;
  };
  const dueOf = (loan) => getReq(loan.req).due;
  function lateText(loan) {
    if (loan.back) return "";
    const late = mins(shifts[s.phase].at) - mins(getReq(loan.req).dueAt);
    if (late <= 0) return "";
    const span =
      late >= 60 ? Math.round((late / 60) * 10) / 10 + " hr" : late + " min";
    return "Overdue - by " + span + " - since " + dueOf(loan);
  }
  function obligation(reqId) {
    const r = getReq(reqId);
    return [...new Set(r.items)].map((type) => {
      const issued = s.loans.filter(
        (l) => l.req === reqId && getAsset(l.asset).type === type,
      );
      return {
        type,
        required: r.items.filter((x) => x === type).length,
        issued: issued.length,
        back: issued.filter((l) => l.back).length,
      };
    });
  }
  function phaseTask() {
    const shift = shifts[s.phase];
    const r = getReq(shift.req);
    const lines = [];
    let remaining = 0;
    if (shift.kind === "issue") {
      for (const o of obligation(shift.req)) {
        const done = o.issued >= o.required;
        if (!done) remaining += o.required - o.issued;
        lines.push({
          label: o.type,
          meta: done ? "Issued" : "Not issued",
          done,
          action: done ? "" : "open-issue",
          val: shift.req,
        });
      }
    } else {
      const loans = s.loans.filter((l) => l.req === shift.req);
      const back = loans.filter((l) => l.back).length;
      const target =
        shift.targetReturned == null
          ? r.items.length
          : shift.targetReturned;
      remaining = Math.max(0, target - back);
      for (const o of obligation(shift.req)) {
        const units = loans.filter((l) => getAsset(l.asset).type === o.type);
        if (!units.length) {
          lines.push({
            label: o.type,
            meta: "Never issued",
            done: false,
            action: "open-issue",
            val: shift.req,
          });
          continue;
        }
        for (const l of units)
          lines.push({
            label: o.type + " · " + l.asset,
            meta: l.back
              ? "Returned" + (l.returnedBy ? " by " + l.returnedBy : "")
              : lateText(l) || "Still out",
            done: l.back,
            action: l.back ? "" : "open-register",
            val: String(l.num),
          });
      }
    }
    return { lines, remaining, req: r };
  }
  function tasksHtml(t) {
    const items = t.lines
      .map(
        (l) =>
          '<li class="' +
          (l.done ? "done" : "open") +
          '"><span><strong>' +
          esc(l.label) +
          "</strong> <small>" +
          esc(l.meta) +
          "</small></span>" +
          (l.action
            ? btn(
                l.action === "open-issue" ? "Issue" : "Return",
                l.action,
                l.val,
              )
            : "") +
          "</li>",
      )
      .join("");
    const done =
      shifts[s.phase].kind === "issue"
        ? "Kit issued."
        : shifts[s.phase].next
          ? "Ready for handover."
          : "Kit accounted for.";
    return (
      '<li class="taskmeta">' +
      esc(t.req.id + " · " + t.req.club + " · due " + t.req.due) +
      "</li>" +
      items +
      (t.remaining ? "" : '<li class="taskdone">' + done + "</li>")
    );
  }
  function openLabels(t) {
    return t.lines
      .filter((l) => !l.done)
      .map((l) => l.label + (l.meta ? " (" + l.meta + ")" : ""));
  }
  function guardHtml(t) {
    const open = openLabels(t);
    return (
      "<div><strong>Work still open</strong><p>" +
      esc(open.join(" · ") || "The shift record is incomplete.") +
      "</p></div>" +
      btn("Advance anyway", "advance-anyway", "", "primary") +
      btn("Not yet", "cancel-advance")
    );
  }
  function getShiftEndSummary(phaseIndex) {
    const openLoans = s.loans.filter((l) => !l.back);
    const unissued = [];
    for (const r of requests) {
      for (const o of obligation(r.id)) {
        const remaining = o.required - o.issued;
        if (remaining > 0) {
          unissued.push(o.type + " (" + r.id + " · " + r.club + ")");
        }
      }
    }

    const parts = [];
    if (openLoans.length) {
      const loanStrs = openLoans.map((l) => {
        const asset = getAsset(l.asset);
        const late = lateText(l);
        return (
          "L-" +
          l.num +
          " · " +
          l.asset +
          " (" +
          (asset ? asset.type : "unit") +
          ") with " +
          l.collectedBy +
          " (" +
          l.req +
          ", due " +
          dueOf(l) +
          (late ? ", " + late : "") +
          ")"
        );
      });
      parts.push("Still out on loan: " + loanStrs.join("; "));
    } else {
      parts.push("No units currently on loan");
    }

    if (unissued.length) {
      parts.push("Still pending issue: " + unissued.join(", "));
    }

    return "Shift handover — " + parts.join(". ") + ".";
  }
  function advanceShift() {
    const summary = getShiftEndSummary(s.phase);
    s.notes.push({
      phase: s.phase,
      kind: "handover",
      text: summary,
    });
    s.advancePrompt = false;
    s.returning = 0;
    if (s.phase < 2) s.phase++;
    s.notice = "Shift time updated.";
  }
  function skipAndAdvance() {
    const open = openLabels(phaseTask());
    const summary = getShiftEndSummary(s.phase);
    s.notes.push({
      phase: s.phase,
      kind: "skip",
      text:
        "Shift advanced with work open: " +
        (open.join(", ") || "shift record incomplete") +
        ". " +
        summary,
    });
    s.advancePrompt = false;
    s.returning = 0;
    if (s.phase < 2) s.phase++;
    s.notice = "Shift time updated. Skipped work is in the desk book.";
  }
  function pendingItemsForReq(reqId) {
    const obligations = obligation(reqId);
    const pending = [];
    for (const o of obligations) {
      const needed = o.required - o.issued;
      for (let i = 0; i < needed; i++) {
        pending.push(o.type);
      }
    }
    return pending;
  }
  function requestPage() {
    let html = head(
      "Approved requests",
      "Student Activities Office · 3 approved forms",
    );
    if (s.selected) {
      const r = getReq(s.selected);
      const pendingCount = pendingItemsForReq(r.id).length;
      html +=
        btn("Back to list", "close") +
        (pendingCount
          ? btn(
              "Issue equipment (" + pendingCount + " pending)",
              "open-issue",
              r.id,
              "primary",
            )
          : "") +
        '<div class="record"><small>' +
        r.id +
        " · Approved</small><h3>" +
        r.event +
        "</h3><p>" +
        r.club +
        " · Filed by " +
        r.owner +
        "</p><p><b>Return by</b> " +
        r.due +
        "</p><p><b>Approved equipment</b></p><ul>" +
        r.items.map((x) => "<li>" + x + "</li>").join("") +
        "</ul><p>" +
        r.note +
        "</p></div>";
    } else
      html += requests
        .map((r) => {
          const pending = pendingItemsForReq(r.id).length;
          return row(
            r.event,
            r.id +
              " · " +
              r.club +
              (pending
                ? " · " + pending + " pending checkout"
                : " · All issued"),
            (pending
              ? btn("Issue out", "open-issue", r.id, "primary")
              : "") + btn("View form", "request", r.id),
          );
        })
        .join("");
    return html;
  }
  function issueOutPage() {
    let html = head(
      "Issue out",
      "Pending equipment requests · Grouped by parent request",
    );

    const pendingGroups = [];
    const completedGroups = [];

    for (const r of requests) {
      const pendingTypes = pendingItemsForReq(r.id);
      if (pendingTypes.length > 0) {
        pendingGroups.push({ req: r, pendingTypes });
      } else {
        completedGroups.push(r);
      }
    }

    if (!pendingGroups.length) {
      html +=
        '<div class="record"><p><strong>No pending issues.</strong> All approved equipment requests are currently issued.</p></div>';
    }

    const busyAssetIds = new Set(
      s.loans.filter((l) => !l.back).map((l) => l.asset),
    );

    for (const { req: r, pendingTypes } of pendingGroups) {
      const assignedBatch = new Set();
      const itemsWithAssets = pendingTypes.map((type) => {
        const asset = assets.find(
          (a) =>
            a.type === type &&
            !a.repair &&
            !busyAssetIds.has(a.id) &&
            !assignedBatch.has(a.id),
        );
        if (asset) assignedBatch.add(asset.id);
        return { type, asset };
      });

      const allAvailable = itemsWithAssets.every((x) => x.asset);

      html +=
        '<div class="record issuecard" data-issue-req="' +
        esc(r.id) +
        '">' +
        '<div class="issuecard-head"><small>' +
        esc(r.id + " · Approved request · Return by " + r.due) +
        "</small><h3>" +
        esc(r.event) +
        "</h3><p><strong>" +
        esc(r.club) +
        "</strong> · Filed by " +
        esc(r.owner) +
        "</p>" +
        (r.note ? '<p class="formnote">' + esc(r.note) + "</p>" : "") +
        "</div>" +
        '<div class="issuecard-items"><strong>Pending units to issue (' +
        itemsWithAssets.length +
        ")</strong>";

      for (const item of itemsWithAssets) {
        html +=
          '<div class="issuerow"><div><strong>' +
          esc(item.type) +
          "</strong>" +
          (item.asset
            ? "<small>" +
              esc(
                item.asset.id +
                  " · " +
                  item.asset.model +
                  " · Bin " +
                  item.asset.bin,
              ) +
              "</small>"
            : '<small class="formerror">No units available on shelf</small>') +
          "</div><div>" +
          (item.asset
            ? badge("On shelf", "good")
            : badge("Unavailable", "late")) +
          (item.asset && itemsWithAssets.length > 1
            ? '<button type="submit" form="form-' +
              esc(r.id) +
              '" name="singleType" value="' +
              esc(item.type) +
              '" class="btn-sm">Issue item</button>'
            : "") +
          "</div></div>";
      }

      html +=
        "</div>" +
        '<form id="form-' +
        esc(r.id) +
        '" data-issue-group data-req="' +
        esc(r.id) +
        '" class="issuecard-form">' +
        '<label><span>Who is collecting?</span>' +
        '<select name="who" data-collector required>' +
        '<option value="">Who is at the counter…</option>' +
        opts(people.map((p) => [p, p])) +
        "</select></label>" +
        '<button type="submit" class="primary"' +
        (allAvailable ? "" : " disabled") +
        ">Issue out (" +
        itemsWithAssets.length +
        (itemsWithAssets.length === 1 ? " item" : " items") +
        ")</button>" +
        "</form>" +
        "</div>";
    }

    if (completedGroups.length) {
      html +=
        '<details class="completed-issues"><summary>Completed checkouts (' +
        completedGroups.length +
        ")</summary>";
      for (const r of completedGroups) {
        const loans = s.loans.filter((l) => l.req === r.id);
        html +=
          '<div class="row"><div><strong>' +
          esc(r.id + " · " + r.club + " · " + r.event) +
          "</strong><small>" +
          (loans.length
            ? loans
                .map((l) => "L-" + l.num + " (" + l.asset + ")")
                .join(", ") +
              " · Due " +
              esc(r.due)
            : "No loans issued") +
          "</small></div><div>" +
          badge("All issued", "good") +
          "</div></div>";
      }
      html += "</details>";
    }

    return html;
  }
  function inventory() {
    let html = head(
      "Inventory",
      "Physical units · home shelf and current availability",
    );
    html +=
      '<div class="buttons"><label>Show <select data-filter>' +
      opts(
        ["All items", "On shelf", "On loan", "In repair"].map((f) => [f, f]),
      ) +
      "</select></label></div>";
    for (const a of assets) {
      const status = a.repair
        ? "In repair"
        : out(a.id)
          ? "On loan"
          : "On shelf";
      if (s.filter !== "All items" && s.filter !== status) continue;
      html += row(
        a.id + " · " + a.type,
        a.model + " · " + a.bin,
        badge(status, status === "On shelf" ? "good" : ""),
      );
    }
    return html;
  }
  function register() {
    let html = head(
      "Loan register",
      "One slip per physical unit",
      btn("Issue out", "go-issue-out", "", "primary"),
    );
    html +=
      '<div class="buttons">' +
      ["Outstanding", "All slips"]
        .map(
          (v, i) =>
            '<button type="button" data-action="scope" data-val="' +
            i +
            '" aria-pressed="' +
            (s.onlyOpen === (i === 0)) +
            '">' +
            v +
            "</button>",
        )
        .join("") +
      "</div>";
    const shown = s.loans
      .filter((l) => !s.onlyOpen || !l.back)
      .slice()
      .reverse();
    if (!shown.length) html += "<p>No outstanding slips.</p>";
    for (const l of shown) {
      const late = lateText(l);
      html += row(
        "L-" + l.num + " · " + l.asset,
        l.req +
          " · " +
          l.collectedBy +
          " · Due " +
          dueOf(l) +
          (l.back && l.returnedBy ? " · Back via " + l.returnedBy : ""),
        (late ? badge(late, "late") : "") +
          (l.back
            ? badge("Returned", "good")
            : btn("Record return", "return", String(l.num))),
      );
      if (!l.back && s.returning === l.num)
        html +=
          '<form data-return data-num="' +
          l.num +
          '" class="returnpanel"><label><span>Returned by</span>' +
          '<select name="returnedBy" data-returner required>' +
          '<option value="">Who is at the counter…</option>' +
          opts(people.map((p) => [p, p])) +
          "</select></label>" +
          '<button type="submit" class="primary">Confirm return</button>' +
          btn("Cancel", "cancel-return") +
          "</form>";
    }
    return html;
  }
  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and notes for the next shift",
    );
    const entries = [
      [
        "Friday · 3:20 pm",
        "Isha Rao · Film Society",
        "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
      ],
      [
        "Friday · 3:30 pm",
        "Tara Shah · Debate Union",
        "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
      ],
    ];
    if (s.phase >= 1)
      entries.push([
        "Friday · 7:30 pm",
        "Kabir Sen · Film Society",
        "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
      ]);
    for (const n of s.notes)
      entries.push([shifts[n.phase].time, "Counter handover", n.text]);
    for (const [t, author, body] of entries.slice().reverse())
      html +=
        '<article class="record"><small>' +
        esc(t) +
        "</small><h3>" +
        esc(author) +
        "</h3><p>" +
        esc(body) +
        "</p></article>";
    return (
      html +
      '<form data-note><div class="form"><label class="full"><span>Note for the next shift</span><textarea name="note" rows="2" maxlength="400" required></textarea></label></div><button type="submit">Add handover note</button></form>'
    );
  }
  const screens = {
    Requests: requestPage,
    "Issue out": issueOutPage,
    "Loan register": register,
    Inventory: inventory,
    "Desk book": deskbook,
  };
  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    const task = phaseTask();
    q("[data-tasks]").innerHTML = tasksHtml(task);
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent =
      (phase.next || "") +
      (task.remaining ? " · " + task.remaining + " left" : "");
    const guard = q("[data-guard]");
    guard.hidden = !s.advancePrompt;
    guard.innerHTML = s.advancePrompt ? guardHtml(task) : "";
    q("[data-nav]").innerHTML = pages
      .map(
        ([n, icon]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '"><svg aria-hidden="true" class="store-icon"><use href="#icon-' +
          icon +
          '"></use></svg>' +
          n +
          "</button>",
      )
      .join("");
    q("[data-page]").innerHTML = screens[s.tab]();
    if (q("[data-filter]")) q("[data-filter]").value = s.filter;
    q("[data-status]").textContent = s.notice;
    if (s.returning && q("[data-returner]")) q("[data-returner]").focus();
    if (s.tab === "Issue out") {
      const activeCollector =
        q('[data-issue-req="' + shifts[s.phase].req + '"] [data-collector]') ||
        q("[data-collector]");
      if (activeCollector && document.activeElement !== activeCollector) {
        activeCollector.focus();
      }
    }
    if (s.advancePrompt && q('[data-action="advance-anyway"]'))
      q('[data-action="advance-anyway"]').focus();
  }
  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      q("[data-status]").textContent +=
        " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;
    switch (b.dataset.action) {
      case "restart":
        s = original();
        break;
      case "advance": {
        if (s.phase >= 2) break;
        const t = phaseTask();
        if (t.remaining && !s.advancePrompt) {
          s.advancePrompt = true;
          s.notice =
            t.remaining +
            (t.remaining === 1 ? " item is" : " items are") +
            " still open. Advance anyway?";
          break;
        }
        if (t.remaining) {
          skipAndAdvance();
          break;
        }
        advanceShift();
        break;
      }
      case "advance-anyway":
        skipAndAdvance();
        break;
      case "cancel-advance":
        s.advancePrompt = false;
        s.notice = "Stayed in this shift.";
        break;
      case "tab":
        s.tab = v;
        s.editing = false;
        s.returning = 0;
        s.advancePrompt = false;
        break;
      case "close":
        s.selected = "";
        break;
      case "request":
        s.selected = v;
        break;
      case "new":
      case "go-issue-out":
        s.tab = "Issue out";
        s.editing = false;
        s.returning = 0;
        s.advancePrompt = false;
        break;
      case "open-issue":
        s.tab = "Issue out";
        s.editing = false;
        s.returning = 0;
        s.advancePrompt = false;
        break;
      case "open-register":
        s.tab = "Loan register";
        s.editing = false;
        s.returning = Number(v);
        s.onlyOpen = true;
        s.advancePrompt = false;
        break;
      case "cancel":
        s.editing = false;
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      case "return":
        s.returning = Number(v);
        break;
      case "cancel-return":
        s.returning = 0;
        break;
    }
    commit();
  });
  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-filter]")) {
      s.filter = e.target.value;
      commit();
      return;
    }
    if (e.target.matches('[data-issue] [name="req"]')) {
      s.draftReq = e.target.value;
      commit();
    }
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, text });
      commit("Handover note saved.");
      return;
    }
    if (f.matches("[data-return]")) {
      const l = s.loans.find((x) => x.num === Number(f.dataset.num));
      const returnedBy = String(form.get("returnedBy") || "");
      if (!l || l.back) return;
      if (!people.includes(returnedBy)) {
        q("[data-status]").textContent = "Choose who is handing the unit in.";
        return;
      }
      l.back = true;
      l.returnedBy = returnedBy;
      l.returnedAt = shifts[s.phase].time;
      s.returning = 0;
      commit(
        l.asset +
          " returned by " +
          returnedBy +
          ". Slip L-" +
          l.num +
          " closed.",
      );
      return;
    }
    if (f.matches("[data-issue-group]")) {
      const reqId = f.dataset.req;
      const r = getReq(reqId);
      const who = String(form.get("who") || "");
      if (!r || !people.includes(who)) {
        q("[data-status]").textContent =
          "Choose who is collecting the equipment.";
        const sel = f.querySelector('[name="who"]');
        if (sel) sel.focus();
        return;
      }

      const submitter = e.submitter;
      const singleType =
        submitter && submitter.name === "singleType" ? submitter.value : "";

      const typesToIssue = [];
      for (const o of obligation(reqId)) {
        if (singleType && o.type !== singleType) continue;
        const needed = o.required - o.issued;
        for (let i = 0; i < needed; i++) {
          typesToIssue.push(o.type);
        }
      }

      if (!typesToIssue.length) {
        q("[data-status]").textContent =
          "No pending items to issue for this request.";
        return;
      }

      const busyAssetIds = new Set(
        s.loans.filter((l) => !l.back).map((l) => l.asset),
      );
      const newLoans = [];
      let maxNum = Math.max(...s.loans.map((l) => l.num), 400);

      for (const type of typesToIssue) {
        const asset = assets.find(
          (a) => a.type === type && !a.repair && !busyAssetIds.has(a.id),
        );
        if (!asset) {
          q("[data-status]").textContent =
            "Cannot issue " + type + ": no available units on shelf.";
          return;
        }
        busyAssetIds.add(asset.id);
        maxNum++;
        newLoans.push({
          num: maxNum,
          req: reqId,
          asset: asset.id,
          collectedBy: who,
          returnedBy: "",
          returnedAt: "",
          back: false,
        });
      }

      for (const loan of newLoans) {
        s.loans.push(loan);
      }

      const assetList = newLoans.map((l) => l.asset).join(", ");
      const slipList = newLoans.map((l) => "L-" + l.num).join(", ");
      const msg =
        newLoans.length === 1
          ? "Issued " +
            assetList +
            " to " +
            who +
            " on slip " +
            slipList +
            ". Due " +
            r.due +
            "."
          : "Issued " +
            assetList +
            " to " +
            who +
            " on slips " +
            slipList +
            ". Due " +
            r.due +
            ".";

      commit(msg);
      return;
    }
    if (!f.matches("[data-issue]")) return;
    const [req, asset, who] = ["req", "asset", "who"].map((k) =>
      form.get(k),
    );
    const unit = getAsset(asset),
      r = getReq(req);
    if (!r || !unit || unit.repair || out(asset) || !people.includes(who))
      return;
    if (!r.items.includes(unit.type)) {
      q("[data-status]").textContent =
        "This equipment type is outside the approved request. Choose an approved unit.";
      return;
    }
    if (
      s.loans.some(
        (l) => l.req === req && !l.back && getAsset(l.asset).type === unit.type,
      )
    ) {
      q("[data-status]").textContent =
        "The approved quantity of this equipment type is already on loan.";
      return;
    }
    const num = Math.max(...s.loans.map((l) => l.num)) + 1;
    s.loans.push({
      num,
      req,
      asset,
      collectedBy: who,
      returnedBy: "",
      returnedAt: "",
      back: false,
    });
    s.editing = false;
    s.draftReq = req;
    commit(
      "Issued " +
        asset +
        " to " +
        who +
        " on slip L-" +
        num +
        ". Due " +
        r.due +
        ".",
    );
  });
  function migrate(d) {
    if (!d) return null;
    if (d.version === 2) return d;
    if (d.version !== 1 || !Array.isArray(d.loans)) return null;
    return {
      ...d,
      version: 2,
      loans: d.loans.map((l) => ({
        num: l.num,
        req: l.req,
        asset: l.asset,
        collectedBy: l.collectedBy || l.who || "",
        returnedBy: l.returnedBy || "",
        returnedAt: l.returnedAt || "",
        back: !!l.back,
      })),
      draftReq: "",
    };
  }
  function restore(raw) {
    const d = migrate(raw);
    if (
      !d ||
      !Object.hasOwn(screens, d.tab) ||
      !shifts[d.phase] ||
      (d.selected && !getReq(d.selected)) ||
      !Array.isArray(d.notes) ||
      !d.notes.every(
        (n) => n && shifts[n.phase] && typeof n.text === "string",
      ) ||
      !Array.isArray(d.loans) ||
      !d.loans.length ||
      !d.loans.every(
        (l) =>
          l &&
          getReq(l.req) &&
          getAsset(l.asset) &&
          Number.isInteger(l.num) &&
          people.includes(l.collectedBy) &&
          (!l.returnedBy || people.includes(l.returnedBy)),
      )
    )
      return;
    s = {
      ...original(),
      ...d,
      loans: d.loans.map((l) => ({ ...l })),
      notes: d.notes.map((n) => ({ ...n })),
      editing: false,
      returning: 0,
      advancePrompt: false,
      draftReq: d.draftReq && getReq(d.draftReq) ? d.draftReq : "",
    };
    paint();
  }
  paint();
  try {
    restore(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    // Keep the fresh shift when storage is unavailable or the saved data is invalid.
  }
})();
