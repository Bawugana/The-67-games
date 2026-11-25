(() => {
  if (document.querySelector('#project67-mobile-joystick')) return;

  const host = document.createElement('div');
  host.id = 'project67-mobile-joystick';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host{display:none;position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:Arial,sans-serif}
      .stick{position:absolute;left:max(18px,env(safe-area-inset-left));bottom:max(22px,env(safe-area-inset-bottom));width:132px;height:132px;border-radius:50%;pointer-events:auto;touch-action:none;background:#08101caa;border:2px solid #ffffff38;box-shadow:0 10px 35px #0009,inset 0 0 30px #64d2ff18;backdrop-filter:blur(7px)}
      .ring{position:absolute;inset:17px;border-radius:50%;border:1px solid #ffffff25}
      .nub{position:absolute;left:42px;top:42px;width:48px;height:48px;border-radius:50%;background:linear-gradient(145deg,#8ce9ff,#3a8bff);border:2px solid #dff9ff;box-shadow:0 5px 15px #0008;transform:translate(0,0)}
      .action{position:absolute;right:max(22px,env(safe-area-inset-right));bottom:max(38px,env(safe-area-inset-bottom));width:84px;height:84px;border:2px solid #fff7;border-radius:50%;pointer-events:auto;touch-action:none;background:linear-gradient(145deg,#ffdf74,#ff735f);color:#111827;font-size:14px;font-weight:1000;letter-spacing:.08em;box-shadow:0 9px 28px #0009,inset 0 -7px #0002}
      .action.pressed{transform:scale(.91);filter:brightness(1.2)}
      .hint{position:absolute;left:15px;right:15px;bottom:-19px;text-align:center;color:#dbeafeaa;font-size:9px;font-weight:900;letter-spacing:.1em}
      @media (hover:none),(pointer:coarse),(max-width:820px){:host{display:block}}
      @media (max-width:390px){.stick{width:116px;height:116px}.ring{inset:14px}.nub{left:37px;top:37px;width:42px;height:42px}.action{width:76px;height:76px}}
    </style>
    <div class="stick" aria-label="Movement joystick"><div class="ring"></div><div class="nub"></div><div class="hint">MOVE</div></div>
    <button class="action" aria-label="Action button">ACTION</button>`;
  document.body.appendChild(host);

  // Keep a second finger on the aim surface from turning into a browser pan or
  // pinch gesture while the movement thumb is held down.
  const multiTouchStyle = document.createElement('style');
  multiTouchStyle.id = 'project67-multitouch-style';
  multiTouchStyle.textContent = 'canvas,#moveStick,#lookPad,.look-pad{touch-action:none !important;-webkit-user-select:none !important;user-select:none !important}';
  document.head.appendChild(multiTouchStyle);

  const page = location.pathname.split('/').pop();

  // The two FPS trainers already include a dedicated left movement stick and
  // a separate right look surface. Turn that native dual-control layer on for
  // phones instead of covering it with the generic controls.
  const nativeDualControlPages = new Set([
    'rivals_loadout_trainer.html',
    'aim_3d_trainer.html'
  ]);
  if (nativeDualControlPages.has(page) && matchMedia('(hover:none), (pointer:coarse), (max-width:820px)').matches) {
    host.style.setProperty('display', 'none', 'important');
    const mobileToggle = document.querySelector('#mobileToggle');
    if (mobileToggle && !mobileToggle.classList.contains('active')) mobileToggle.click();
  }

  // Replace each featured game's old directional pad, while preserving its
  // separate fire/dash/interact buttons.
  const oldMovementPads = {
    'riftbound_skybreak.html': ['.touch > .stick'],
    'sixty_seven_rush.html': ['.pad'],
    'bawugana_bawuganiii_rat_game.html': ['#touch > .pad'],
    'neon_blaster.html': ['#movePad'],
    'orbit_post.html': ['.touch'],
    'rift_67.html': ['.mobile > #stick'],
    'swipe_the_crown.html': ['.touch > #stick']
  };
  for (const selector of oldMovementPads[page] || []) {
    document.querySelectorAll(selector).forEach(pad => pad.style.setProperty('display','none','important'));
  }

  const stick = root.querySelector('.stick');
  const nub = root.querySelector('.nub');
  const action = root.querySelector('.action');
  let activePointer = null;
  let activeKeys = new Set();

  const keyData = {
    up: ['ArrowUp', 'KeyW', 'w'], down: ['ArrowDown', 'KeyS', 's'],
    left: ['ArrowLeft', 'KeyA', 'a'], right: ['ArrowRight', 'KeyD', 'd']
  };
  function fire(type, dir) {
    const [key, code] = keyData[dir];
    document.dispatchEvent(new KeyboardEvent(type, {key, code, bubbles:true, cancelable:true}));
  }
  function setDirections(next) {
    for (const dir of activeKeys) if (!next.has(dir)) fire('keyup', dir);
    for (const dir of next) if (!activeKeys.has(dir)) fire('keydown', dir);
    activeKeys = next;
  }
  function update(clientX, clientY) {
    const r = stick.getBoundingClientRect();
    const cx = r.left + r.width/2, cy = r.top + r.height/2;
    let dx = clientX-cx, dy = clientY-cy;
    const max = r.width*.31, len = Math.hypot(dx,dy);
    if (len>max) { dx=dx/len*max; dy=dy/len*max; }
    nub.style.transform = `translate(${dx}px,${dy}px)`;
    const dead = max*.28, next = new Set();
    if (dx < -dead) next.add('left'); else if (dx > dead) next.add('right');
    if (dy < -dead) next.add('up'); else if (dy > dead) next.add('down');
    setDirections(next);
  }
  function release(e) {
    if (e && e.pointerId !== activePointer) return;
    activePointer=null;
    nub.style.transform='translate(0,0)';
    setDirections(new Set());
  }
  stick.addEventListener('pointerdown', e => {
    if (activePointer !== null) return;
    e.preventDefault();
    activePointer=e.pointerId;
    stick.setPointerCapture(e.pointerId);
    update(e.clientX,e.clientY);
  });
  stick.addEventListener('pointermove', e => { if(e.pointerId===activePointer) update(e.clientX,e.clientY); });
  stick.addEventListener('pointerup', release);
  stick.addEventListener('pointercancel', release);
  stick.addEventListener('lostpointercapture', release);
  const actionPointers = new Set();
  function actionEvent(type) {
    const down=type==='keydown';
    action.classList.toggle('pressed',down);
    document.dispatchEvent(new KeyboardEvent(type,{key:' ',code:'Space',bubbles:true,cancelable:true}));
  }
  action.addEventListener('pointerdown',e=>{
    e.preventDefault();
    actionPointers.add(e.pointerId);
    action.setPointerCapture(e.pointerId);
    if (actionPointers.size === 1) actionEvent('keydown');
  });
  function releaseAction(e) {
    actionPointers.delete(e.pointerId);
    if (!actionPointers.size) actionEvent('keyup');
  }
  action.addEventListener('pointerup',releaseAction);
  action.addEventListener('pointercancel',releaseAction);
  action.addEventListener('lostpointercapture',releaseAction);
  addEventListener('blur',()=>{
    release();
    actionPointers.clear();
    actionEvent('keyup');
  });
})();
