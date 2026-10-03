   const WS_URL = "ws://localhost:8080";

    const $ = (id) => document.getElementById(id);
    const chat = $("chat"), statusEl = $("status"), presence = $("presence"), orbit = $("orbit");
    const aurora = $("aurora"), log = $("log"), emptyEl = $("empty"), jump = $("jump");
    const nameInput = $("name"), meAvatar = $("meAvatar");
    const composer = $("composer"), textInput = $("text"), sendBtn = $("send");

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let ws;
    let retryDelay = 1000;
    let countdownTimer;
    let others = 0;
    let unread = 0;
    let last = null; // { name, at } of the previous message, used for grouping

    /* ---------- identity ---------- */
    function hueOf(name) {
      let h = 0;
      for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
      return h;
    }
    function myName() {
      return nameInput.value.trim() || "anon";
    }
    function paintMe() {
      const n = myName();
      meAvatar.textContent = n[0].toUpperCase();
      meAvatar.style.setProperty("--h", hueOf(n));
    }

    try { nameInput.value = localStorage.getItem("signal-name") || ""; } catch {}
    if (!nameInput.value) nameInput.value = "user" + Math.floor(Math.random() * 100);
    paintMe();

    nameInput.addEventListener("input", () => {
      paintMe();
      try { localStorage.setItem("signal-name", nameInput.value); } catch {}
    });

    /* ---------- little reusable effects ---------- */
    function restart(el, cls) {
      el.classList.remove(cls);
      void el.offsetWidth; // force reflow so the animation can run again
      el.classList.add(cls);
    }
    function ping() {
      restart(presence, "ping");
      restart(aurora, "pulse");
    }

    chat.addEventListener("pointermove", (e) => {
      const r = chat.getBoundingClientRect();
      chat.style.setProperty("--mx", e.clientX - r.left + "px");
      chat.style.setProperty("--my", e.clientY - r.top + "px");
    });

    /* ---------- connection state ---------- */
    function setState(state, text) {
      chat.dataset.state = state;
      statusEl.textContent = text;
      sendBtn.disabled = state !== "live";
    }

    function renderPresence(count) {
      others = Math.max(count - 1, 0);
      const shown = Math.min(others, 8);
      orbit.replaceChildren();
      for (let i = 0; i < shown; i++) {
        const dot = document.createElement("i");
        dot.style.setProperty("--a", (360 / shown) * i + "deg");
        dot.style.animationDelay = i * 60 + "ms";
        orbit.appendChild(dot);
      }
      if (chat.dataset.state === "live") {
        statusEl.textContent =
          others === 0 ? "Just you here" :
          others === 1 ? "You and 1 other" :
          `You and ${others} others`;
      }
    }

    function scheduleRetry() {
      let left = Math.ceil(retryDelay / 1000);
      setState("down", `Disconnected. Retrying in ${left}s`);
      clearInterval(countdownTimer);
      countdownTimer = setInterval(() => {
        left -= 1;
        if (left <= 0) {
          clearInterval(countdownTimer);
          connect();
        } else {
          setState("down", `Disconnected. Retrying in ${left}s`);
        }
      }, 1000);
      retryDelay = Math.min(retryDelay * 2, 10000);
    }

    function connect() {
      setState("connecting", "Connecting…");
      ws = new WebSocket(WS_URL);

      ws.addEventListener("open", () => {
        retryDelay = 1000;
        clearInterval(countdownTimer);
        setState("live", "Connected");
      });

      ws.addEventListener("close", () => {
        renderPresence(0);
        scheduleRetry();
      });

      // a "close" event always follows an error, and that handles the retry
      ws.addEventListener("error", () => {});

      ws.addEventListener("message", (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }

        if (msg.type === "onlineUsers") renderPresence(msg.count);
        if (msg.type === "chat") addMessage(msg);
      });
    }

    /* ---------- rendering messages ---------- */
    function nearBottom() {
      return log.scrollHeight - log.scrollTop - log.clientHeight < 90;
    }
    function toBottom() {
      log.scrollTo({ top: log.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
    }

    function addMessage(msg) {
      emptyEl.remove();

      const mine = msg.name === myName();
      const now = Date.now();
      const grouped = last && last.name === msg.name && now - last.at < 60000;
      last = { name: msg.name, at: now };

      const stick = nearBottom() || mine;

      const row = document.createElement("div");
      row.className = "row" + (mine ? " mine" : "") + (grouped ? " grouped" : "");
      row.style.setProperty("--h", hueOf(msg.name));

      if (!mine) {
        const av = document.createElement("div");
        av.className = "avatar";
        av.textContent = msg.name[0].toUpperCase();
        row.appendChild(av);
      }

      const col = document.createElement("div");
      col.className = "col";

      if (!grouped) {
        const head = document.createElement("div");
        head.className = "head";
        if (!mine) {
          const nm = document.createElement("span");
          nm.className = "name";
          nm.textContent = msg.name;
          head.appendChild(nm);
        }
        const tm = document.createElement("span");
        tm.className = "time";
        tm.textContent = String(msg.time).replace(/:\d{2}(?=\s?[AP]M|$)/i, "");
        head.appendChild(tm);
        col.appendChild(head);
      }

      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.textContent = msg.text; // textContent keeps user input from becoming HTML
      col.appendChild(bubble);

      row.appendChild(col);
      log.appendChild(row);

      ping();

      if (stick) {
        toBottom();
      } else {
        unread += 1;
        jump.textContent = unread === 1 ? "1 new message" : `${unread} new messages`;
        jump.hidden = false;
      }
    }

    log.addEventListener("scroll", () => {
      if (nearBottom()) { unread = 0; jump.hidden = true; }
    });
    jump.addEventListener("click", toBottom);

    /* ---------- sending ---------- */
    composer.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = textInput.value.trim();
      if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

      ws.send(JSON.stringify({ type: "chat", name: myName(), text }));
      textInput.value = "";
      restart(sendBtn, "sent");
      textInput.focus();
    });

    connect();