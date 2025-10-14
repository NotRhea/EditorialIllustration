
const CONFIG = {
    machinePng: "assets/slot_bg.png",
    machinePngAlt: "assets/slot_bg_alt.png",
  
    symbols: [
      "assets/symbols/manifestor.png",
      "assets/symbols/generator.png",
      "assets/symbols/projector.png",
      "assets/symbols/reflector.png",
      "assets/symbols/mg.png"
    ],
  
    minHoldMs: 350,
    maxHoldMs: 900,
  
    machinePopup: "assets/slot_overlay.png",
    noImmediateRepeat: true
  };

  
  function preloadImages(urls) {
    urls.filter(Boolean).forEach(src => { const i = new Image(); i.src = src; });
  }
  preloadImages([CONFIG.machinePng, CONFIG.machinePngAlt, CONFIG.machinePopup, ...CONFIG.symbols]);
  

  const machine = document.getElementById("machine"); 
  const grid = document.getElementById("grid");
  const cells = Array.from(grid.querySelectorAll(".cell"));
  const popup = document.getElementById("popup");
  const popupImg = popup.querySelector("img");
  
  
  machine.style.setProperty('--machine-bg', `url(${CONFIG.machinePng})`);
  machine.style.setProperty('--machine-bg-size', 'contain');
  machine.style.setProperty('--machine-bg-pos', 'center');
  

  const rand = (a, b) => Math.random() * (b - a) + a;
  const randInt = (a, b) => Math.floor(rand(a, b));
  const nextHold = () => Math.round(rand(CONFIG.minHoldMs, CONFIG.maxHoldMs));
  

  let STOPPED = false;
  
  
  class MiniReel {
    constructor(cell) {
      this.cell = cell;
      this.viewport = cell.querySelector(".slot-viewport");
      this.track = cell.querySelector(".slot-track");
      this.frameA = cell.querySelector(".frame-a");
      this.frameB = cell.querySelector(".frame-b");
      this.lastIdx = -1;
      this.sliding = false;
      this._loopTO = null;
  
    
      this._onEnd = () => {
        if (!this.sliding || STOPPED) return;
        this.disableTransition(() => {
          this.track.style.transform = "translateY(-50%)";
          this.frameA.src = this.frameB.src;
          const nextIdx = this.randomIdx(this.lastIdx);
          this.frameB.src = CONFIG.symbols[nextIdx];
          this.lastIdx = nextIdx;
        });
        this.sliding = false;
        if (!STOPPED) this._loopTO = setTimeout(() => this.loop(), nextHold());
      };
  
      
      this.seedRandom();
      this.track.addEventListener("transitionend", this._onEnd);
      this._loopTO = setTimeout(() => this.loop(), randInt(100, 500));
    }
  
    randomIdx(except) {
      if (!CONFIG.noImmediateRepeat || CONFIG.symbols.length <= 1) {
        return randInt(0, CONFIG.symbols.length);
      }
      let i = randInt(0, CONFIG.symbols.length);
      if (i === except) i = (i + 1) % CONFIG.symbols.length;
      return i;
    }
  
  
    seedRandom() {
      const aIdx = this.randomIdx(-1);
      const bIdx = this.randomIdx(aIdx);
      this.disableTransition(() => {
        this.frameA.src = CONFIG.symbols[aIdx];
        this.frameB.src = CONFIG.symbols[bIdx];
        this.track.style.transform = "translateY(-50%)"; 
      });
      this.lastIdx = bIdx;
    }
  
    loop() {
      if (this.sliding || STOPPED) return;
      this.sliding = true;
      this.enableTransition(() => {
        this.track.style.transform = "translateY(0)";
      });
    }
  
    stopNow() {
      if (this._loopTO) { clearTimeout(this._loopTO); this._loopTO = null; }
      this.sliding = false;
  
      
      const cs = getComputedStyle(this.track);
      const currentTransform = cs.transform;
      this.track.style.transition = "none";
      this.track.style.transform = currentTransform === 'none' ? 'translateY(-50%)' : currentTransform;
  
      this.track.removeEventListener("transitionend", this._onEnd);
    }
  
    setImmediateTo(idx) {
      if (this._loopTO) { clearTimeout(this._loopTO); this._loopTO = null; }
      this.sliding = false;
      this.track.style.transition = "none";
      this.track.style.transform = "translateY(-50%)";
      this.frameA.src = CONFIG.symbols[idx];
      this.frameB.src = CONFIG.symbols[idx];
      this.lastIdx = idx;
    }
  
    
    restart() {
    
      this.track.style.transition = "";
  
      
      const a = randInt(0, CONFIG.symbols.length);
      let b = randInt(0, CONFIG.symbols.length);
      if (b === a) b = (b + 1) % CONFIG.symbols.length;
  
      this.disableTransition(() => {
        this.frameA.src = CONFIG.symbols[a];
        this.frameB.src = CONFIG.symbols[b];
        this.track.style.transform = "translateY(-50%)";
      });
      this.lastIdx = b;
  
  
      this.track.removeEventListener("transitionend", this._onEnd);
      this.track.addEventListener("transitionend", this._onEnd);
  
      
      this._loopTO = setTimeout(() => this.loop(), randInt(100, 500));
    }
  
   
    disableTransition(fn) {
      const prev = this.track.style.transition;
      this.track.style.transition = "none";
      fn();
      void this.track.offsetHeight;
      this.track.style.transition = prev || "";
    }
    enableTransition(fn) {
      void this.track.offsetHeight;
      fn();
    }
  }
  
 
  let reels = cells.map(c => new MiniReel(c));
  
  
  function showPopup(src, x, y) {
    if (!src) return hidePopup();
    popupImg.src = src;
    popup.style.display = "block";
    positionPopup(x, y);
  }
  function hidePopup() {
    popup.style.display = "none";
    popupImg.removeAttribute("src");
  }
  function positionPopup(mouseX, mouseY) {
    const rect = machine.getBoundingClientRect();
    const px = mouseX - rect.left + 12;
    const py = mouseY - rect.top + 12;
    popup.style.left = Math.min(Math.max(0, px), rect.width - popup.offsetWidth - 6) + "px";
    popup.style.top = Math.min(Math.max(0, py), rect.height - popup.offsetHeight - 6) + "px";
  }
  
  machine.addEventListener("mousemove", (e) => {
    if (STOPPED) return;
    const targetCell = e.target.closest(".cell");
    if (targetCell) {
      const specific = (targetCell.dataset.popupSrc || "").trim();
      if (specific) { showPopup(specific, e.clientX, e.clientY); return; }
    }
    if (CONFIG.machinePopup) showPopup(CONFIG.machinePopup, e.clientX, e.clientY);
    else hidePopup();
  });
  machine.addEventListener("mouseleave", hidePopup);
  
  
  machine.addEventListener("click", () => {
    if (!STOPPED) {

      const randomIdx = randInt(0, CONFIG.symbols.length); 
      machine.style.setProperty('--machine-bg', `url(${CONFIG.machinePngAlt})`);
      machine.style.setProperty('--machine-bg-size', '100% auto'); 
      machine.style.setProperty('--machine-bg-pos',  '0.5% 50%'); 
  
      STOPPED = true;
      reels.forEach(r => {
        r.setImmediateTo(randomIdx);
        r.stopNow();
      });
      hidePopup();
  
    } else {
     
      machine.style.setProperty('--machine-bg', `url(${CONFIG.machinePng})`);
      machine.style.setProperty('--machine-bg-size', 'contain');
      machine.style.setProperty('--machine-bg-pos',  'center');
  
      STOPPED = false;
      reels.forEach(r => r.restart());
    }
  });
  
  
  
