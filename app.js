(() => {
  const config = {
    colors: {
      logo: "#fa56ab",
      text: "#fa56ab",
    },
    messages: {
      header: "oopsie! you found me ;)",
      intro: "we need to survive in this economy and stay relevant in this industry, aren't we?",
      footer: "let's work together.",
    },
    ascii: `
███████╗ ██████╗ ██╗██████╗ ███████╗██████╗ ███╗   ███╗ █████╗ ██████╗ 
██╔════╝██╔═══██╗██║██╔══██╗██╔════╝██╔══██╗████╗ ███║██╔══██╗██╔══██╗
███████╗██║   ██║██║██║  ██║█████╗  ██████╔╝██╔████╔██║███████║██║  ██║
╚════██║██║▄▄ ██║██║██║  ██║██╔══╝  ██╔══██╗██║╚██╔╝██║██╔══██║██║  ██║
███████║╚██████╔╝██║██████╔╝███████╗██║  ██║██║ ╚═╝ ██║██║  ██║██████╔╝
╚══════╝ ╚══▀▀═╝ ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝ 
    `,
  };

  const logMessage = (message, isHeader = false) => {
    const style = `
      color: ${isHeader ? config.colors.logo : config.colors.text};
      font-size: ${isHeader ? "20px" : "14px"};
      font-weight: ${isHeader ? "bold" : "normal"};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      ${!isHeader ? "line-height: 1.5;" : ""}
    `;
    console.log(`%c${message}`, style);
  };

  console.log(
    `\n%c${config.ascii}`,
    `color: ${config.colors.logo}; font-weight: bold; background-color: transparent;`
  );

  logMessage(config.messages.header, true);
  logMessage(config.messages.intro);
  logMessage(config.messages.footer);

  const root = document.documentElement;
  const mainMatrix = document.getElementById("main-matrix");
  const adhdMatrix = document.getElementById("adhd-matrix");
  const stimVisual = document.querySelector(".stim-visual");
  const fontInc = document.getElementById("font-inc");
  const fontDec = document.getElementById("font-dec");
  const fontSelect = document.getElementById("font-select");
  const themeSelect = document.getElementById("theme-select");
  const highlightToggle = document.getElementById("highlight-toggle");
  const accessCollapse = document.getElementById("access-collapse");
  const accessPanel = document.querySelector(".access-panel");
  const adhdAnimationControl = document.getElementById("adhd-animation-control");
  const adhdAnimationToggle = document.getElementById("adhd-animation-toggle");
  const greetingEl = document.getElementById("dynamic-greeting");
  const pinyinEl = document.getElementById("pinyin-line");
  const caretEl = document.querySelector(".caret");
  const lineHeightInc = document.getElementById("line-height-inc");
  const lineHeightDec = document.getElementById("line-height-dec");
  const letterSpacingInc = document.getElementById("letter-spacing-inc");
  const letterSpacingDec = document.getElementById("letter-spacing-dec");
  const liveRegion = document.getElementById("live-region");
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  let bits = [];
  let cursorTarget = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let cursorSmooth = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let bounds = { w: window.innerWidth, h: window.innerHeight };
  let rafId;
  let lastTs = 0;
  let lastInteraction = performance.now();
  const IDLE_TIMEOUT_MS = 15000;

  const getMatrixBounds = () => {
    const isAdhd = document.body.getAttribute("data-theme") === "adhd";
    if (isAdhd && stimVisual && adhdMatrix) {
      const rect = stimVisual.getBoundingClientRect();
      return { w: rect.width, h: rect.height };
    }
    return { w: window.innerWidth, h: window.innerHeight };
  };

  const getCurrentMatrix = () => {
    const isAdhd = document.body.getAttribute("data-theme") === "adhd";
    return isAdhd ? adhdMatrix : mainMatrix;
  };

  const startAnimationIfNeeded = () => {
    if (!rafId && bits.length > 0) {
      lastTs = 0;
      rafId = requestAnimationFrame(animateBits);
    }
  };

  const spawnBits = (count = 260) => {
    const matrix = getCurrentMatrix();
    if (!matrix) return;
    const currentBounds = getMatrixBounds();
    matrix.innerHTML = "";
    const frag = document.createDocumentFragment();
    bits = [];
    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      el.className = "bit";
      el.textContent = Math.random() > 0.5 ? "1" : "0";
      const depth = 0.6 + Math.random() * 1.8;
      const x = Math.random() * currentBounds.w;
      const y = Math.random() * currentBounds.h;
      const angle = Math.random() * Math.PI * 2;
      const speed = 14 + Math.random() * 36;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const alpha = 0.35 + Math.random() * 0.2;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      el.dataset.depth = depth.toFixed(2);
      frag.appendChild(el);
      bits.push({ el, x, y, vx, vy, depth, alpha });
    }
    matrix.appendChild(frag);
  };

  const shuffleBits = () => {
    bits.forEach((bit) => {
      bit.el.textContent = Math.random() > 0.5 ? "1" : "0";
      if (Math.random() < 0.1) {
        bit.vx *= -1;
        bit.vy *= -1;
      }
    });
  };

  const animateBits = (ts) => {
    const isAdhd = document.body.getAttribute("data-theme") === "adhd";
    const animationEnabled = document.body.getAttribute("data-adhd-animation") !== "off";
    
    // Don't animate if ADHD mode is active but animation is disabled
    if (isAdhd && !animationEnabled) {
      rafId = null;
      return;
    }
    
    const matrix = getCurrentMatrix();
    if (!matrix || bits.length === 0) {
      rafId = null;
      return;
    }

    if (!lastTs) lastTs = ts;
    const dt = Math.min(32, ts - lastTs) / 1000;
    const currentBounds = getMatrixBounds();
    
    // Get cursor position relative to matrix container
    let cursorX = cursorTarget.x;
    let cursorY = cursorTarget.y;
    
    if (isAdhd && stimVisual) {
      const rect = stimVisual.getBoundingClientRect();
      cursorX = cursorTarget.x - rect.left;
      cursorY = cursorTarget.y - rect.top;
    }
    
    cursorSmooth.x += (cursorX - cursorSmooth.x) * 0.12;
    cursorSmooth.y += (cursorY - cursorSmooth.y) * 0.12;

    bits.forEach((bit) => {
      const dx = bit.x - cursorSmooth.x;
      const dy = bit.y - cursorSmooth.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < 200 * 200) {
        const dist = Math.sqrt(dist2) || 1;
        const influence = (1 - dist / 200) * 260;
        bit.vx += (dx / dist) * influence * dt;
        bit.vy += (dy / dist) * influence * dt;
      }

      bit.x += bit.vx * dt;
      bit.y += bit.vy * dt;

      if (bit.x < -40) bit.x = currentBounds.w + 40;
      if (bit.x > currentBounds.w + 40) bit.x = -40;
      if (bit.y < -40) bit.y = currentBounds.h + 40;
      if (bit.y > currentBounds.h + 40) bit.y = -40;

      bit.el.style.transform = `translate3d(${bit.x}px, ${bit.y}px, 0)`;
      bit.el.style.opacity = bit.alpha;
    });

    lastTs = ts;
    // If user has been idle for a while, pause the animation loop to save resources
    if (ts - lastInteraction > IDLE_TIMEOUT_MS) {
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(animateBits);
  };

  const handlePointer = (event) => {
    cursorTarget = { x: event.clientX, y: event.clientY };
    lastInteraction = performance.now();
    startAnimationIfNeeded();
  };

  const setBaseFontSize = (size) => {
    const clamped = clamp(size, 14, 22);
    root.style.fontSize = `${clamped}px`;
    localStorage.setItem("baseFontSize", String(clamped));
  };

  const initFontSize = () => {
    const saved = Number(localStorage.getItem("baseFontSize"));
    if (saved && !Number.isNaN(saved)) {
      setBaseFontSize(saved);
    } else {
      setBaseFontSize(16);
    }
  };

  const handleFontInc = () => {
    const current = parseFloat(getComputedStyle(root).fontSize) || 16;
    setBaseFontSize(current + 1);
  };

  const handleFontDec = () => {
    const current = parseFloat(getComputedStyle(root).fontSize) || 16;
    setBaseFontSize(current - 1);
  };

  const setFontFamily = (family) => {
    if (!family) return;
    root.style.setProperty("--font-body", `"${family}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`);
    localStorage.setItem("fontFamily", family);
  };

  const initFontFamily = () => {
    const saved = localStorage.getItem("fontFamily");
    if (saved && fontSelect) {
      fontSelect.value = saved;
      setFontFamily(saved);
      // Update custom dropdown display
      const customSelect = document.querySelector('[data-select="font-select"]');
      if (customSelect) {
        const option = customSelect.querySelector(`[data-value="${saved}"]`);
        if (option) {
          customSelect.querySelectorAll(".custom-select-option").forEach(opt => opt.setAttribute("aria-selected", "false"));
          option.setAttribute("aria-selected", "true");
          const valueDisplay = customSelect.querySelector(".custom-select-value");
          if (valueDisplay) valueDisplay.textContent = option.textContent;
        }
      }
    }
  };

  const setLineHeight = (value) => {
    const clamped = clamp(value, 1.2, 2.5);
    root.style.setProperty("--line-height", String(clamped));
    localStorage.setItem("lineHeight", String(clamped));
    if (liveRegion) {
      liveRegion.textContent = `Line height set to ${Math.round(clamped * 100)}%`;
    }
  };

  const initLineHeight = () => {
    const saved = Number(localStorage.getItem("lineHeight"));
    if (saved && !Number.isNaN(saved)) {
      setLineHeight(saved);
    } else {
      setLineHeight(1.7);
    }
  };

  const handleLineHeightInc = () => {
    const current = parseFloat(getComputedStyle(root).getPropertyValue("--line-height")) || 1.7;
    setLineHeight(current + 0.1);
  };

  const handleLineHeightDec = () => {
    const current = parseFloat(getComputedStyle(root).getPropertyValue("--line-height")) || 1.7;
    setLineHeight(current - 0.1);
  };

  const setLetterSpacing = (value) => {
    const clamped = clamp(value, -0.05, 0.15);
    root.style.setProperty("--letter-spacing", `${clamped}em`);
    localStorage.setItem("letterSpacing", String(clamped));
    if (liveRegion) {
      liveRegion.textContent = `Letter spacing set to ${clamped > 0 ? '+' : ''}${(clamped * 100).toFixed(0)}%`;
    }
  };

  const initLetterSpacing = () => {
    const saved = Number(localStorage.getItem("letterSpacing"));
    if (saved && !Number.isNaN(saved)) {
      setLetterSpacing(saved);
    } else {
      root.style.setProperty("--letter-spacing", "normal");
    }
  };

  const handleLetterSpacingInc = () => {
    const current = parseFloat(getComputedStyle(root).getPropertyValue("--letter-spacing")) || 0;
    if (getComputedStyle(root).getPropertyValue("--letter-spacing") === "normal") {
      setLetterSpacing(0.02);
    } else {
      setLetterSpacing(current + 0.01);
    }
  };

  const handleLetterSpacingDec = () => {
    const current = parseFloat(getComputedStyle(root).getPropertyValue("--letter-spacing")) || 0;
    if (getComputedStyle(root).getPropertyValue("--letter-spacing") === "normal") {
      setLetterSpacing(-0.01);
    } else {
      setLetterSpacing(current - 0.01);
    }
  };

  const setTheme = (mode) => {
    const theme = ["cb", "hc", "adhd"].includes(mode) ? mode : "default";
    if (theme === "default") {
      document.body.removeAttribute("data-theme");
    } else {
      document.body.setAttribute("data-theme", theme);
    }
    if (themeSelect) {
      themeSelect.value = theme;
    }
    localStorage.setItem("themeMode", theme);

    // Update custom dropdown display
    const customSelect = document.querySelector('[data-select="theme-select"]');
    if (customSelect) {
      const option = customSelect.querySelector(`[data-value="${theme}"]`);
      if (option) {
        customSelect.querySelectorAll(".custom-select-option").forEach(opt => opt.setAttribute("aria-selected", "false"));
        option.setAttribute("aria-selected", "true");
        const valueDisplay = customSelect.querySelector(".custom-select-value");
        if (valueDisplay) valueDisplay.textContent = option.textContent;
      }
    }

    const page = document.querySelector(".page");
    const stim = document.querySelector(".stim-pane");
    if (page && stim) {
      if (theme === "adhd") {
        page.classList.add("is-split");
        stim.style.display = "flex";
        // Show ADHD animation control
        if (adhdAnimationControl) {
          adhdAnimationControl.style.display = "flex";
        }
        // Respawn bits with new bounds when switching to ADHD mode (if enabled)
        const animationEnabled = localStorage.getItem("adhdAnimation") !== "off";
        if (animationEnabled) {
          setTimeout(() => {
            bounds = getMatrixBounds();
            // Slightly denser field in ADHD mode, but fewer bits than before for performance
            spawnBits(520);
            startAnimationIfNeeded();
          }, 100);
        } else {
          // Clear bits if animation is disabled
          if (adhdMatrix) {
            adhdMatrix.innerHTML = "";
            bits = [];
          }
        }
      } else {
        page.classList.remove("is-split");
        stim.style.display = "none";
        // Hide ADHD animation control
        if (adhdAnimationControl) {
          adhdAnimationControl.style.display = "none";
        }
        // Respawn bits in main matrix when leaving ADHD mode (slightly lighter density)
        setTimeout(() => {
          bounds = getMatrixBounds();
          spawnBits(520);
          startAnimationIfNeeded();
        }, 100);
      }
    }

    // Disable highlight in high contrast mode (accessibility best practice)
    if (theme === "hc") {
      document.body.removeAttribute("data-highlight");
      if (highlightToggle) {
        highlightToggle.disabled = true;
        highlightToggle.textContent = "Highlight: Disabled";
        highlightToggle.setAttribute("aria-label", "Highlighting is disabled in high contrast mode for better accessibility");
      }
    } else {
      if (highlightToggle) {
        highlightToggle.disabled = false;
        highlightToggle.removeAttribute("aria-label");
        // Restore highlight state from localStorage when switching away from high contrast
        const savedHighlight = localStorage.getItem("highlightMode");
        if (savedHighlight === "on") {
          document.body.setAttribute("data-highlight", "on");
          highlightToggle.textContent = "Highlight: On";
        } else {
          document.body.removeAttribute("data-highlight");
          highlightToggle.textContent = "Highlight: Off";
        }
      }
    }
  };

  const initTheme = () => {
    const saved = localStorage.getItem("themeMode");
    setTheme(saved);
    // Update custom dropdown display
    const customSelect = document.querySelector('[data-select="theme-select"]');
    if (customSelect) {
      const themeValue = saved || "default";
      const option = customSelect.querySelector(`[data-value="${themeValue}"]`);
      if (option) {
        customSelect.querySelectorAll(".custom-select-option").forEach(opt => opt.setAttribute("aria-selected", "false"));
        option.setAttribute("aria-selected", "true");
        const valueDisplay = customSelect.querySelector(".custom-select-value");
        if (valueDisplay) {
          const displayText = themeValue === "default" ? "Default" : 
                             themeValue === "cb" ? "Color blind friendly" :
                             themeValue === "hc" ? "High contrast" : "ADHD friendly";
          valueDisplay.textContent = displayText;
        }
      }
    }
  };

  const setHighlight = (mode) => {
    // Don't allow highlighting in high contrast mode (accessibility best practice)
    const isHighContrast = document.body.getAttribute("data-theme") === "hc";
    if (isHighContrast) {
      document.body.removeAttribute("data-highlight");
      return;
    }

    const on = mode === "on";
    if (on) {
      document.body.setAttribute("data-highlight", "on");
      if (highlightToggle) highlightToggle.textContent = "Highlight: On";
    } else {
      document.body.removeAttribute("data-highlight");
      if (highlightToggle) highlightToggle.textContent = "Highlight: Off";
    }
    localStorage.setItem("highlightMode", on ? "on" : "off");
  };

  const initHighlight = () => {
    // Don't initialize highlight if high contrast mode is active
    const isHighContrast = document.body.getAttribute("data-theme") === "hc";
    if (isHighContrast) {
      if (highlightToggle) {
        highlightToggle.disabled = true;
        highlightToggle.textContent = "Highlight: Disabled";
        highlightToggle.setAttribute("aria-label", "Highlighting is disabled in high contrast mode for better accessibility");
      }
      return;
    }
    const saved = localStorage.getItem("highlightMode");
    setHighlight(saved === "off" ? "off" : "on");
  };

  fontInc?.addEventListener("click", handleFontInc);
  fontDec?.addEventListener("click", handleFontDec);
  fontSelect?.addEventListener("change", (e) => setFontFamily(e.target.value));
  themeSelect?.addEventListener("change", (e) => setTheme(e.target.value));

  // Custom dropdown functionality
  const initCustomSelects = () => {
    const customSelects = document.querySelectorAll(".custom-select");
    let activeDropdown = null;
    
    // Single document click handler for all dropdowns (outside loop)
    const handleDocumentClick = (e) => {
      if (activeDropdown) {
        const select = activeDropdown.closest(".custom-select");
        if (select && !select.contains(e.target)) {
          const trigger = select.querySelector(".custom-select-trigger");
          const options = select.querySelector(".custom-select-options");
          if (trigger && options && options.style.display === "block") {
            trigger.setAttribute("aria-expanded", "false");
            options.setAttribute("aria-expanded", "false");
            options.style.display = "none";
            activeDropdown = null;
          }
        }
      }
    };
    
    // Add document listener once, outside the loop
    document.addEventListener("click", handleDocumentClick);
    
    customSelects.forEach((select) => {
      const trigger = select.querySelector(".custom-select-trigger");
      const options = select.querySelector(".custom-select-options");
      const optionItems = select.querySelectorAll(".custom-select-option");
      const hiddenSelect = select.querySelector("select");
      const valueDisplay = select.querySelector(".custom-select-value");
      
      if (!trigger || !options || !hiddenSelect) return;

      const updateDisplay = () => {
        const selectedOption = Array.from(optionItems).find(opt => opt.getAttribute("aria-selected") === "true");
        if (selectedOption && valueDisplay) {
          valueDisplay.textContent = selectedOption.textContent;
        }
      };

      const closeDropdown = () => {
        trigger.setAttribute("aria-expanded", "false");
        options.setAttribute("aria-expanded", "false");
        options.style.display = "none";
        activeDropdown = null;
      };

      const openDropdown = () => {
        // Close all other dropdowns first
        customSelects.forEach(s => {
          if (s !== select) {
            const t = s.querySelector(".custom-select-trigger");
            const o = s.querySelector(".custom-select-options");
            if (t && o) {
              t.setAttribute("aria-expanded", "false");
              o.setAttribute("aria-expanded", "false");
              o.style.display = "none";
            }
          }
        });
        
        trigger.setAttribute("aria-expanded", "true");
        options.setAttribute("aria-expanded", "true");
        options.style.display = "block";
        activeDropdown = trigger;
      };

      const selectOption = (option) => {
        // Update aria-selected
        optionItems.forEach(opt => opt.setAttribute("aria-selected", "false"));
        option.setAttribute("aria-selected", "true");
        
        // Update hidden select
        const value = option.getAttribute("data-value");
        hiddenSelect.value = value;
        
        // Trigger change event
        hiddenSelect.dispatchEvent(new Event("change", { bubbles: true }));
        
        // Update display
        updateDisplay();
        
        // Close dropdown
        closeDropdown();
      };

      // Trigger click
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = trigger.getAttribute("aria-expanded") === "true";
        if (isOpen) {
          closeDropdown();
        } else {
          openDropdown();
        }
      });

      // Option clicks
      optionItems.forEach((option) => {
        option.addEventListener("click", (e) => {
          e.stopPropagation();
          selectOption(option);
        });

        // Keyboard navigation
        option.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectOption(option);
          } else if (e.key === "Escape") {
            closeDropdown();
            trigger.focus();
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = option.nextElementSibling || optionItems[0];
            next.focus();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const prev = option.previousElementSibling || optionItems[optionItems.length - 1];
            prev.focus();
          }
        });
      });

      // Keyboard support for trigger
      trigger.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          openDropdown();
          if (optionItems.length > 0) {
            const selected = Array.from(optionItems).find(opt => opt.getAttribute("aria-selected") === "true") || optionItems[0];
            selected.focus();
          }
        } else if (e.key === "Escape") {
          closeDropdown();
        }
      });

      // Make options focusable
      optionItems.forEach(opt => {
        opt.setAttribute("tabindex", "-1");
      });


      // Initialize display
      updateDisplay();
    });
  };

  initCustomSelects();
  
  // ADHD Animation Toggle
  adhdAnimationToggle?.addEventListener("click", () => {
    const currentState = document.body.getAttribute("data-adhd-animation");
    const isEnabled = currentState !== "off";
    const newState = isEnabled ? "off" : "on";
    
    document.body.setAttribute("data-adhd-animation", newState);
    localStorage.setItem("adhdAnimation", newState);
    
    if (adhdAnimationToggle) {
      adhdAnimationToggle.textContent = `Binary Animation: ${isEnabled ? "Off" : "On"}`;
    }
    
    // Update animation based on state
    if (newState === "off") {
      // Stop animation and clear bits
      if (adhdMatrix) {
        adhdMatrix.innerHTML = "";
        bits = [];
      }
      if (rafId && document.body.getAttribute("data-theme") === "adhd") {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    } else {
      // Start animation
      if (document.body.getAttribute("data-theme") === "adhd") {
        bounds = getMatrixBounds();
        spawnBits(520);
        startAnimationIfNeeded();
      }
    }
  });
  
  // Initialize ADHD animation state
  const initAdhdAnimation = () => {
    const saved = localStorage.getItem("adhdAnimation");
    const isAdhd = document.body.getAttribute("data-theme") === "adhd";
    if (isAdhd && adhdAnimationControl) {
      adhdAnimationControl.style.display = "flex";
    }
    if (saved === "off") {
      document.body.setAttribute("data-adhd-animation", "off");
      if (adhdAnimationToggle) {
        adhdAnimationToggle.textContent = "Binary Animation: Off";
      }
    } else {
      document.body.setAttribute("data-adhd-animation", "on");
      if (adhdAnimationToggle) {
        adhdAnimationToggle.textContent = "Binary Animation: On";
      }
    }
  };
  
  highlightToggle?.addEventListener("click", () => {
    // Prevent toggling if disabled (e.g., in high contrast mode)
    if (highlightToggle.disabled) return;
    const next = document.body.getAttribute("data-highlight") === "on" ? "off" : "on";
    setHighlight(next);
  });
  lineHeightInc?.addEventListener("click", handleLineHeightInc);
  lineHeightDec?.addEventListener("click", handleLineHeightDec);
  letterSpacingInc?.addEventListener("click", handleLetterSpacingInc);
  letterSpacingDec?.addEventListener("click", handleLetterSpacingDec);
  accessCollapse?.addEventListener("click", () => {
    const collapsed = accessPanel?.classList.toggle("is-collapsed");
    if (accessCollapse) {
      accessCollapse.textContent = collapsed ? "+" : "✕";
      accessCollapse.setAttribute("aria-label", collapsed ? "Expand accessibility panel" : "Collapse accessibility panel");
      accessCollapse.setAttribute("aria-expanded", collapsed ? "false" : "true");
    }
    
    // Adjust body padding when sidebar is collapsed/expanded
    const root = document.documentElement;
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      // On mobile, don't adjust padding (sidebar goes to bottom)
      return;
    }
    
    if (collapsed) {
      root.style.setProperty("--sidebar-width", "48px");
    } else {
      const width = window.innerWidth <= 1024 ? "260px" : "280px";
      root.style.setProperty("--sidebar-width", width);
    }
  });

  const handleResize = () => {
    bounds = { w: window.innerWidth, h: window.innerHeight };
    spawnBits(bits.length || 260);
  };

  const greetSlots = [
    { start: 0, end: 3, id: "Selamat Tengah Malam", zh: "Shēnyè hǎo", hanzi: "深夜好", en: "Good Midnight" },
    { start: 3, end: 5, id: "Selamat Dini Hari", zh: "Língchén hǎo", hanzi: "凌晨好", en: "Good Early Morning" },
    { start: 5, end: 7, id: "Selamat Pagi", zh: "Zǎo ān", hanzi: "早安", en: "Good Morning" },
    { start: 7, end: 11, id: "Selamat Pagi", zh: "Zǎo ān", hanzi: "早安", en: "Good Morning" },
    { start: 11, end: 15, id: "Selamat Siang", zh: "Wǔ ān", hanzi: "午安", en: "Good Afternoon" },
    { start: 15, end: 18, id: "Selamat Sore", zh: "Xiàwǔ hǎo", hanzi: "下午好", en: "Good Late Afternoon" },
    { start: 18, end: 21, id: "Selamat Malam", zh: "Wǎnshàng hǎo", hanzi: "晚上好", en: "Good Evening" },
    { start: 21, end: 24, id: "Selamat Malam", zh: "Wǎn'ān", hanzi: "晚安", en: "Good Night" },
  ];

  const getGreetingSlot = () => {
    const hour = new Date().getHours();
    return greetSlots.find((s) => hour >= s.start && hour < s.end) || greetSlots[0];
  };

  const languageOrder = ["id", "zh", "en"];
  let langIndex = 0;
  let typeRaf = null;
  let holdTimeout = null;

  const getLangText = (slot, lang) => {
    if (lang === "zh") {
      return { main: slot.hanzi, sub: slot.zh };
    }
    if (lang === "en") {
      return { main: slot.en, sub: "" };
    }
    return { main: slot.id, sub: "" };
  };

  const typeGreeting = (fullText, subText, onDone) => {
    if (!greetingEl) return;
    if (typeRaf) cancelAnimationFrame(typeRaf);
    if (holdTimeout) clearTimeout(holdTimeout);

    greetingEl.textContent = "";
    if (pinyinEl) pinyinEl.textContent = subText || "";
    if (caretEl) caretEl.style.opacity = 0;
    
    // Announce greeting change to screen readers
    if (liveRegion && fullText) {
      liveRegion.textContent = `Greeting: ${fullText}`;
    }

    let i = 0;
    const typeStep = () => {
      if (!greetingEl) return;
      greetingEl.textContent = fullText.slice(0, i);
      i += 1;
      if (i <= fullText.length) {
        typeRaf = requestAnimationFrame(typeStep);
      } else {
        if (caretEl) caretEl.style.opacity = 1;
        holdTimeout = setTimeout(() => backspaceStep(fullText, onDone), 1400);
      }
    };

    const backspaceStep = (text, done) => {
      if (caretEl) caretEl.style.opacity = 0;
      const erase = () => {
        if (!greetingEl) return;
        if (i >= 0) {
          greetingEl.textContent = text.slice(0, i);
          i -= 1;
          typeRaf = requestAnimationFrame(erase);
        } else if (typeof done === "function") {
          done();
        }
      };
      erase();
    };

    typeStep();
  };

  const cycleGreeting = () => {
    const slot = getGreetingSlot();
    const lang = languageOrder[langIndex % languageOrder.length];
    langIndex += 1;
    const { main, sub } = getLangText(slot, lang);
    typeGreeting(main, sub, cycleGreeting);
  };

  initFontSize();
  initFontFamily();
  initLineHeight();
  initLetterSpacing();
  initTheme();
  initHighlight();
  initAdhdAnimation();
  cycleGreeting();
  window.addEventListener("pointermove", handlePointer, { passive: true });
  window.addEventListener("resize", handleResize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    } else {
      lastInteraction = performance.now();
      startAnimationIfNeeded();
    }
  });
  
  // Start animation for all themes with theme-aware density
  bounds = getMatrixBounds();
  const initialIsAdhd = document.body.getAttribute("data-theme") === "adhd";
  spawnBits(initialIsAdhd ? 360 : 520);
  setInterval(shuffleBits, 2400);
  startAnimationIfNeeded();
})();
