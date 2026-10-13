(() => {
  if (document.querySelector('#project67-cat-button')) return;

  const joystick = document.querySelector('#project67-mobile-joystick');
  if (joystick) joystick.style.setProperty('display', 'none', 'important');
  document.querySelectorAll('.touch .action').forEach(button => button.style.display = 'none');

  const host = document.createElement('div');
  host.id = 'project67-cat-button';
  const root = host.attachShadow({mode:'open'});
  root.innerHTML = `
    <style>
      :host{display:none;position:fixed;right:max(24px,env(safe-area-inset-right));bottom:max(28px,env(safe-area-inset-bottom));z-index:2147483640;font-family:Arial,sans-serif}
      button{position:relative;width:112px;height:104px;padding:0;border:0;background:transparent;cursor:pointer;touch-action:none;filter:drop-shadow(0 12px 13px #0009);-webkit-tap-highlight-color:transparent}
      .ear{position:absolute;top:2px;width:43px;height:48px;background:#ffb56b;border:4px solid #2b1c2f;transform:rotate(45deg);border-radius:9px 18px 7px 18px}
      .ear.left{left:12px}.ear.right{right:12px;transform:rotate(45deg) scale(-1,1)}
      .ear:after{content:"";position:absolute;inset:9px;background:#ff7f9d;border-radius:5px 12px 4px 12px}
      .face{position:absolute;left:7px;right:7px;bottom:3px;height:82px;border:4px solid #2b1c2f;border-radius:46% 46% 43% 43%;background:linear-gradient(145deg,#ffd185,#ff9e5b);box-shadow:inset 0 -10px #ee7f4938}
      .stripe{position:absolute;top:5px;left:50%;width:8px;height:24px;border-radius:8px;background:#b96548;transform:translateX(-50%)}
      .eye{position:absolute;top:30px;width:10px;height:15px;border-radius:50%;background:#25192b}.eye.left{left:25px}.eye.right{right:25px}
      .nose{position:absolute;left:50%;top:48px;width:12px;height:9px;border-radius:50% 50% 60% 60%;background:#e95878;transform:translateX(-50%)}
      .mouth{position:absolute;left:50%;top:57px;width:25px;height:12px;border-bottom:3px solid #2b1c2f;border-radius:0 0 50% 50%;transform:translateX(-50%)}
      .whisker{position:absolute;top:53px;width:30px;height:2px;background:#2b1c2f}.whisker.a{left:-15px;transform:rotate(9deg)}.whisker.b{left:-15px;top:63px;transform:rotate(-8deg)}.whisker.c{right:-15px;transform:rotate(-9deg)}.whisker.d{right:-15px;top:63px;transform:rotate(8deg)}
      .label{position:absolute;left:50%;bottom:-17px;transform:translateX(-50%);color:#fff;font-size:10px;font-weight:1000;letter-spacing:.13em;text-shadow:0 2px 5px #000;white-space:nowrap}
      button.pressed{transform:scale(.88) translateY(6px);filter:drop-shadow(0 5px 5px #0008)}
      button.pressed .eye{height:3px;top:37px;border-radius:4px}
      button.pressed .mouth{height:16px;background:#ff6585;border:3px solid #2b1c2f;border-top:0}
      @media (hover:none),(pointer:coarse),(max-width:820px){:host{display:block}}
      @media(max-width:390px){button{width:96px;height:90px}.face{height:70px}.ear{width:37px;height:41px}.eye{top:25px}.nose{top:42px}.mouth{top:51px}.whisker{top:47px}.whisker.b,.whisker.d{top:57px}}
    </style>
    <button aria-label="Cat action button">
      <span class="ear left"></span><span class="ear right"></span>
      <span class="face"><span class="stripe"></span><span class="eye left"></span><span class="eye right"></span><span class="nose"></span><span class="mouth"></span><span class="whisker a"></span><span class="whisker b"></span><span class="whisker c"></span><span class="whisker d"></span></span>
      <span class="label">TAP CAT</span>
    </button>`;
  document.body.appendChild(host);

  const button = root.querySelector('button');
  function fire(type) {
    button.classList.toggle('pressed', type === 'keydown');
    document.dispatchEvent(new KeyboardEvent(type,{key:' ',code:'Space',bubbles:true,cancelable:true}));
  }
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);fire('keydown')});
  button.addEventListener('pointerup',()=>fire('keyup'));
  button.addEventListener('pointercancel',()=>fire('keyup'));
  button.addEventListener('click',e=>e.preventDefault());
  addEventListener('blur',()=>fire('keyup'));
})();
