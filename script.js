const CONFIG = {
    
    machinePng: "assets/slot_bg.png",
  
    
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
  
  function preloadImages(urls){
    urls.filter(Boolean).forEach(src => { const i = new Image(); i.src = src; });
  }
  preloadImages([CONFIG.machinePng, CONFIG.machinePopup, ...CONFIG.symbols]);
  
  
  const machine = document.getElementById("machine");
  const machineImg = document.getElementById("machineImg");
  const grid = document.getElementById("grid");
  const cells = Array.from(grid.querySelectorAll(".cell"));
  const popup = document.getElementById("popup");
  const popupImg = popup.querySelector("img");
  
  machineImg.src = CONFIG.machinePng;
  
  
  const rand = (a,b) => Math.random()*(b-a)+a;
  const randInt = (a,b) => Math.floor(rand(a,b)); 
  const nextHold = () => Math.round(rand(CONFIG.minHoldMs, CONFIG.maxHoldMs));
  

  class MiniReel {
    constructor(cell){
      this.cell = cell;
      this.viewport = cell.querySelector(".slot-viewport");
      this.track = cell.querySelector(".slot-track");
      this.frameA = cell.querySelector(".frame-a"); 
      this.frameB = cell.querySelector(".frame-b"); 
      this.lastIdx = -1;
      this.sliding = false;
  
      
      const idxA = this.randomIdx(-1);
      const idxB = this.randomIdx(idxA);
      this.frameA.src = CONFIG.symbols[idxA];
      this.frameB.src = CONFIG.symbols[idxB];
      this.lastIdx = idxB; 
  
      
      setTimeout(() => this.loop(), randInt(100, 500));
  

      this.track.addEventListener("transitionend", () => {
        if (!this.sliding) return;
  
        this.disableTransition(() => {
          
          this.track.style.transform = "translateY(-50%)";
  
          
          this.frameA.src = this.frameB.src;
  
          
          const nextIdx = this.randomIdx(this.lastIdx);
          this.frameB.src = CONFIG.symbols[nextIdx];
          this.lastIdx = nextIdx;
        });
  
        this.sliding = false;
        setTimeout(() => this.loop(), nextHold());
      });
    }
  
    randomIdx(except){
      if (!CONFIG.noImmediateRepeat || CONFIG.symbols.length <= 1) {
        return randInt(0, CONFIG.symbols.length);
      }
      let i = randInt(0, CONFIG.symbols.length);
      if (i === except) i = (i + 1) % CONFIG.symbols.length;
      return i;
    }
  
    loop(){
      if (this.sliding) return;
      this.sliding = true;
  
      this.enableTransition(() => {
        this.track.style.transform = "translateY(0)"; 
      });
    }
  
    
    disableTransition(fn){
      const prev = this.track.style.transition;
      this.track.style.transition = "none";
      fn();
      void this.track.offsetHeight; 
      this.track.style.transition = prev || "";
    }
    enableTransition(fn){
      void this.track.offsetHeight; 
      fn();
    }
  }
  

  const reels = cells.map(c => new MiniReel(c));
  
 
  function showPopup(src, x, y){
    if (!src) return hidePopup();
    popupImg.src = src;
    popup.style.display = "block";
    positionPopup(x, y);
  }
  function hidePopup(){
    popup.style.display = "none";
    popupImg.removeAttribute("src");
  }
  function positionPopup(mouseX, mouseY){
    const rect = machine.getBoundingClientRect();
    const px = mouseX - rect.left + 12;
    const py = mouseY - rect.top  + 12;
    popup.style.left = Math.min(Math.max(0, px), rect.width  - popup.offsetWidth  - 6) + "px";
    popup.style.top  = Math.min(Math.max(0, py), rect.height - popup.offsetHeight - 6) + "px";
  }
  
  machine.addEventListener("mousemove", (e) => {
    const targetCell = e.target.closest(".cell");
    if (targetCell) {
      const specific = (targetCell.dataset.popupSrc || "").trim();
      if (specific) { showPopup(specific, e.clientX, e.clientY); return; }
    }
    if (CONFIG.machinePopup) showPopup(CONFIG.machinePopup, e.clientX, e.clientY);
    else hidePopup();
  });
  machine.addEventListener("mouseleave", hidePopup);
  
  
  