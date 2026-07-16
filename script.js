/* ================= GUEST NAME FROM ?to= ================= */
(function(){
  const params = new URLSearchParams(location.search);
  const name = params.get('to');
  if(name){
    document.querySelectorAll('.guest-name').forEach(el=>{ el.textContent = decodeURIComponent(name); });
    document.title = "Will You Be My Bridesmaid? — for " + decodeURIComponent(name);
  }
})();

/* ================= GSAP CORE SETUP ================= */
gsap.registerPlugin(ScrollTrigger);
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const scroller = document.getElementById('scroller');
ScrollTrigger.defaults({ scroller: scroller });
gsap.defaults({ ease: 'power3.out' });

/* ---- text split helpers (chars / words), <br> and nested dynamic spans safe ---- */
function splitChars(el){
  if(!el || el.dataset.split) return [];
  el.dataset.split = '1';
  el.setAttribute('aria-label', el.textContent.trim());
  const frag = document.createDocumentFragment();
  const spans = [];
  el.childNodes.forEach(node=>{
    if(node.nodeType === 3){
      const words = node.textContent.split(' ');
      words.forEach((word, wi)=>{
        if(word.length){
          const group = document.createElement('span');
          group.className = 'split-word-group';
          [...word].forEach(ch=>{
            const span = document.createElement('span');
            span.className = 'split-ch';
            span.textContent = ch;
            span.setAttribute('aria-hidden','true');
            group.appendChild(span);
            spans.push(span);
          });
          frag.appendChild(group);
        }
        if(wi < words.length - 1) frag.appendChild(document.createTextNode(' '));
      });
    } else if(node.nodeName === 'BR'){
      frag.appendChild(document.createElement('br'));
    }
  });
  el.innerHTML = '';
  el.appendChild(frag);
  el.classList.add('is-split');
  return spans;
}
function splitWords(el){
  if(!el || el.dataset.split || el.querySelector('.guest-name')) return [];
  el.dataset.split = '1';
  el.setAttribute('aria-label', el.textContent.trim());
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = '';
  const spans = [];
  words.forEach((w,i)=>{
    const span = document.createElement('span');
    span.className = 'split-wd';
    span.textContent = w;
    span.setAttribute('aria-hidden','true');
    el.appendChild(span);
    spans.push(span);
    if(i < words.length-1) el.appendChild(document.createTextNode(' '));
  });
  el.classList.add('is-split');
  return spans;
}

/* ================= OPENING SEQUENCE (Welcome) ================= */
function playOpening(){
  const welcome = document.getElementById('welcome');
  if(!welcome) return;
  const bg = welcome.querySelector('.bg');
  const heading = welcome.querySelector('h1');
  const sub = welcome.querySelector('.sub');
  const eyebrow = welcome.querySelector('.eyebrow');
  const btn = welcome.querySelector('.btn');

  if(REDUCE_MOTION){
    welcome.querySelectorAll('.reveal-line').forEach(el=>el.classList.add('in'));
    return;
  }

  const chars = splitChars(heading);
  const words = splitWords(sub);
  gsap.set(chars, {opacity:0, y:40, filter:'blur(10px)'});
  gsap.set(words, {opacity:0, y:20, filter:'blur(6px)'});
  if(bg) gsap.set(bg, {scale:1.3});

  const tl = gsap.timeline({defaults:{ease:'power3.out'}});
  if(bg) tl.to(bg, {scale:1.12, duration:9, ease:'power2.inOut'}, 0);
  tl.add(()=>{ if(eyebrow) eyebrow.classList.add('in'); }, .05);
  tl.to(chars, {opacity:1, y:0, filter:'blur(0px)', duration:.6, stagger:.018}, .2);
  tl.to(words, {opacity:1, y:0, filter:'blur(0px)', duration:.45, stagger:.045, ease:'power3.out'}, '-=.25');
  tl.add(()=>{ if(btn) btn.classList.add('in'); }, '+=.03');
}

/* ================= LOADING ================= */
window.addEventListener('load', ()=>{
  setTimeout(()=>{
    const loadingEl = document.getElementById('loading');
    loadingEl.classList.add('ready');
    let dismissed = false;
    const dismiss = ()=>{
      if(dismissed) return;
      dismissed = true;
      loadingEl.classList.remove('ready');
      loadingEl.classList.add('hide');
      tryAutoplay();
      playOpening();
      setTimeout(()=> ScrollTrigger.refresh(), 300);
    };
    loadingEl.addEventListener('click', dismiss, {once:true});
    setTimeout(dismiss, 5000); // safety net in case the tap never happens
  }, 2000);
});

/* lazy-loaded images can change document height after ScrollTrigger's
   initial measurement; refresh once things settle so trigger positions
   (e.g. the ambient background) stay accurate */
window.addEventListener('load', ()=>{
  setTimeout(()=> ScrollTrigger.refresh(), 2500);
});

/* ================= SCROLL PROGRESS ================= */
const progress = document.getElementById('progress');
scroller.addEventListener('scroll', ()=>{
  const max = scroller.scrollHeight - scroller.clientHeight;
  progress.style.width = (scroller.scrollTop/max*100) + '%';
});

/* ================= SCROLL REVEAL (per-section GSAP timeline) ================= */
function initSectionReveal(section){
  if(section.id === 'welcome') return; // handled by opening sequence

  section.querySelectorAll('p:not(.reveal-line)').forEach(p=> p.classList.add('reveal-line'));

  const heading = section.querySelector('h1,h2');
  const subtitleEls = section.querySelectorAll('.eyebrow,.l1,.sub,.date');
  let headingSpans = [];
  let subtitleSpans = [];

  if(!REDUCE_MOTION && heading){
    headingSpans = splitChars(heading);
    gsap.set(headingSpans, {opacity:0, y:40, filter:'blur(10px)'});
  }
  if(!REDUCE_MOTION){
    subtitleEls.forEach(el=>{
      const spans = splitWords(el);
      if(spans.length) subtitleSpans.push(...spans);
    });
    if(subtitleSpans.length) gsap.set(subtitleSpans, {opacity:0, y:16, filter:'blur(6px)'});
  }

  function playReveal(){
    const lines = section.querySelectorAll('.reveal-line:not(.in)');
    lines.forEach((el,i)=> setTimeout(()=>el.classList.add('in'), i*110));
    if(headingSpans.length){
      gsap.to(headingSpans, {opacity:1,y:0,filter:'blur(0px)',duration:.55,stagger:.016,ease:'power3.out',delay:.03,overwrite:true});
    }
    if(subtitleSpans.length){
      gsap.to(subtitleSpans, {opacity:1,y:0,filter:'blur(0px)',duration:.42,stagger:.03,ease:'power3.out',delay:.1,overwrite:true});
    }
  }
  function resetReveal(){
    section.querySelectorAll('.reveal-line.in').forEach(el=> el.classList.remove('in'));
    if(headingSpans.length) gsap.set(headingSpans, {opacity:0,y:40,filter:'blur(10px)'});
    if(subtitleSpans.length) gsap.set(subtitleSpans, {opacity:0,y:16,filter:'blur(6px)'});
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top 72%',
    end: 'bottom 20%',
    onEnter: playReveal,
    onEnterBack: playReveal,
    onLeave: resetReveal,
    onLeaveBack: resetReveal
  });
}

if(REDUCE_MOTION){
  document.querySelectorAll('.reveal-line').forEach(el=> el.classList.add('in'));
} else {
  document.querySelectorAll('.slide').forEach(initSectionReveal);

  /* subtle scroll-linked parallax drift on the Wedding Details photo —
     kept to a single, safe target that has no other GSAP/CSS transform
     of its own, so it can't fight the reveal-line or d-hero styling */
  gsap.fromTo('.arch-frame', {y:-20}, {
    y:20, ease:'none',
    scrollTrigger:{ trigger:'#detail', scroller:scroller, start:'top bottom', end:'bottom top', scrub:true }
  });

  /* Our Journey: photo tiles scatter apart, then fly back into their
     grid position when the section is scrolled into view (and reset
     to scattered again on leave, so it replays every visit) */
  const journeyCards = gsap.utils.toArray('.journey-grid .j-card');
  if(journeyCards.length){
    const scatter = journeyCards.map(()=>({
      x: gsap.utils.random(-160,160),
      y: gsap.utils.random(-140,140),
      rotation: gsap.utils.random(-28,28)
    }));
    function scatterJourney(){
      journeyCards.forEach((card,i)=>{
        gsap.set(card, {x:scatter[i].x, y:scatter[i].y, rotation:scatter[i].rotation, opacity:0, overwrite:true});
      });
    }
    function assembleJourney(){
      journeyCards.forEach((card,i)=>{
        gsap.to(card, {x:0, y:0, rotation:0, opacity:1, duration:1, ease:'power3.out', delay:i*.06, overwrite:true});
      });
    }
    scatterJourney();
    ScrollTrigger.create({
      trigger:'#journey', scroller:scroller, start:'top 70%', end:'bottom 20%',
      onEnter:assembleJourney, onEnterBack:assembleJourney,
      onLeave:scatterJourney, onLeaveBack:scatterJourney
    });
  }
}

/* ================= AMBIENT BACKGROUND (Wedding Details onward) ================= */
(function(){
  const bgParallax = document.getElementById('bg-parallax');
  const bgStart = document.getElementById('detail');
  const bgEnd = document.getElementById('thankyou');
  if(!bgParallax || !bgStart || !bgEnd) return;
  ScrollTrigger.create({
    trigger: bgStart,
    endTrigger: bgEnd,
    start: 'top 85%',
    end: 'bottom bottom',
    onToggle: (self)=> bgParallax.classList.toggle('visible', self.isActive)
  });
})();

/* Safety net: reveal animations replay on every scroll in/out, so this
   can't be a one-shot "force everything visible" timer (that would
   pre-empt sections the user hasn't scrolled to yet). Instead, keep
   checking for content that is CURRENTLY on screen but somehow never
   got its reveal triggered (e.g. an edge-case viewport), and nudge
   only that into view. */
setInterval(()=>{
  document.querySelectorAll('.reveal-line:not(.in)').forEach(el=>{
    const rect = el.getBoundingClientRect();
    if(rect.bottom > 0 && rect.top < window.innerHeight) el.classList.add('in');
  });
}, 2000);

/* ================= NAV BUTTONS ================= */
/* scroller.scrollTo (not element.scrollIntoView) — more reliable across
   Android WebViews when the scrolling element isn't the window itself */
function scrollToSection(id){
  const el = document.getElementById(id);
  if(el) scroller.scrollTo({top: el.offsetTop, behavior:'smooth'});
}
document.getElementById('open-invite').addEventListener('click', ()=>{
  scrollToSection('reveal');
});
document.getElementById('to-form').addEventListener('click', ()=>{
  scrollToSection('form-section');
});

/* ================= COUNTDOWN ================= */
const target = new Date('2026-08-25T08:00:00+07:00').getTime();
function tickCountdown(){
  const now = Date.now();
  let diff = target - now;
  if(diff < 0) diff = 0;
  const d = Math.floor(diff/(1000*60*60*24));
  const h = Math.floor(diff/(1000*60*60)%24);
  const m = Math.floor(diff/(1000*60)%60);
  const s = Math.floor(diff/1000%60);
  document.getElementById('cd-days').textContent = String(d).padStart(2,'0');
  document.getElementById('cd-hours').textContent = String(h).padStart(2,'0');
  document.getElementById('cd-min').textContent = String(m).padStart(2,'0');
  document.getElementById('cd-sec').textContent = String(s).padStart(2,'0');
}
tickCountdown();
setInterval(tickCountdown, 1000);

/* ================= LIGHTBOX (shared) ================= */
(function(){
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  let imgs = [];
  let idx = 0;

  function show(i){
    idx = (i + imgs.length) % imgs.length;
    lbImg.src = imgs[idx].src;
  }
  function open(list, i){
    imgs = list;
    show(i);
    lb.classList.add('show');
  }
  function close(){ lb.classList.remove('show'); }

  function bindGallery(imgList, clickTargetOf){
    imgList.forEach((img, i)=>{
      clickTargetOf(img).addEventListener('click', ()=> open(imgList, i));
    });
  }

  bindGallery(Array.from(document.querySelectorAll('.journey-grid .j-card img')), (img)=> img.closest('.j-card'));

  const scrollImgs = Array.from(document.querySelectorAll('.scroll-gallery img'));
  const uniqueByIdx = [];
  scrollImgs.forEach(img=>{
    const i = parseInt(img.dataset.idx, 10);
    if(!uniqueByIdx[i]) uniqueByIdx[i] = img;
  });
  scrollImgs.forEach(img=>{
    const i = parseInt(img.dataset.idx, 10);
    img.addEventListener('click', ()=> open(uniqueByIdx, i));
  });

  document.getElementById('lb-close').addEventListener('click', close);
  document.getElementById('lb-next').addEventListener('click', ()=> show(idx + 1));
  document.getElementById('lb-prev').addEventListener('click', ()=> show(idx - 1));
  lb.addEventListener('click', (e)=>{ if(e.target === lb) close(); });
  document.addEventListener('keydown', (e)=>{
    if(!lb.classList.contains('show')) return;
    if(e.key === 'Escape') close();
    else if(e.key === 'ArrowRight') show(idx + 1);
    else if(e.key === 'ArrowLeft') show(idx - 1);
  });

  let touchStartX = null;
  lb.addEventListener('touchstart', (e)=>{ touchStartX = e.touches[0].clientX; }, {passive:true});
  lb.addEventListener('touchend', (e)=>{
    if(touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if(dx > 40) show(idx - 1);
    else if(dx < -40) show(idx + 1);
    touchStartX = null;
  });
})();

/* ================= MUSIC TOGGLE ================= */
const bgm = document.getElementById('bgm');
const musicBtn = document.getElementById('music-toggle');
const musicIcon = document.getElementById('music-icon');
let playing = false;
let autoplayAttempted = false;

function setPlaying(state){
  playing = state;
  musicIcon.classList.toggle('spin', state);
  musicIcon.src = state ? 'icons/disk_play.png' : 'icons/disk_pause.png';
}

function tryAutoplay(){
  if(autoplayAttempted || playing) return;
  autoplayAttempted = true;
  bgm.play().then(()=> setPlaying(true)).catch(()=>{ autoplayAttempted = false; });
}

window.addEventListener('load', tryAutoplay);
document.addEventListener('click', tryAutoplay, {once:true});
document.addEventListener('touchstart', tryAutoplay, {once:true, passive:true});

musicBtn.addEventListener('click', ()=>{
  if(playing){ bgm.pause(); setPlaying(false); }
  else{ bgm.play().then(()=> setPlaying(true)).catch(()=>{}); }
});

/* ================= THE QUESTION ================= */
/* guard against mobile browsers' scroll-anchoring jumping to a
   neighboring section when this section's height changes suddenly */
function holdScrollPosition(sectionId){
  const section = document.getElementById(sectionId);
  const before = section.getBoundingClientRect().top;
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      const drift = section.getBoundingClientRect().top - before;
      if(Math.abs(drift) > 1) scroller.scrollTop += drift;
    });
  });
}

document.getElementById('btn-yes').addEventListener('click', ()=>{
  confettiBurst();
  document.getElementById('letter-wrap').classList.add('show');
  document.getElementById('btn-yes').style.display='none';
  document.getElementById('btn-maybe').style.display='none';
  holdScrollPosition('question');
});
document.getElementById('btn-maybe').addEventListener('click', ()=>{
  document.getElementById('envelope-yes').style.display='none';
  document.getElementById('envelope-maybe').style.display='block';
  document.getElementById('letter-wrap').classList.add('show');
  document.getElementById('btn-yes').style.display='none';
  document.getElementById('btn-maybe').style.display='none';
  holdScrollPosition('question');
});
function confettiBurst(){
  if(typeof confetti !== 'function') return;
  const colors = ['#B4874F','#DCA9A0','#FBF5EC','#6E3A29'];
  confetti({ particleCount:120, spread:80, origin:{y:0.6}, colors });
  setTimeout(()=> confetti({ particleCount:60, spread:100, origin:{y:0.4}, colors }), 300);
}

/* ================= FORM ================= */
document.querySelectorAll('input[name=ukuran]').forEach(r=>{
  r.addEventListener('change', ()=>{
    const box = document.getElementById('custom-size-fields');
    if(r.value === 'Custom' && r.checked) box.classList.add('show');
    else if(r.checked) box.classList.remove('show');
  });
});

const attendingOnly = document.getElementById('attending-only-fields');
const attendingOnlyRadios = attendingOnly.querySelectorAll('input[required]');
document.querySelectorAll('input[name=konfirmasi]').forEach(r=>{
  r.addEventListener('change', ()=>{
    if(!r.checked) return;
    const isAttending = r.value === 'Attending';
    attendingOnly.style.display = isAttending ? '' : 'none';
    attendingOnlyRadios.forEach(field=> field.required = isAttending);
    if(!isAttending){
      document.querySelectorAll('input[name=ukuran]:checked, input[name=hijab]:checked').forEach(f=> f.checked = false);
      document.getElementById('custom-size-fields').classList.remove('show');
    }
  });
});

document.getElementById('rsvp-form').addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = {
    id: Date.now(),
    nama: document.getElementById('f-nama').value,
    konfirmasi: (document.querySelector('input[name=konfirmasi]:checked')||{}).value || '',
    ukuran: (document.querySelector('input[name=ukuran]:checked')||{}).value || '',
    dada: document.getElementById('f-dada').value,
    pinggang: document.getElementById('f-pinggang').value,
    pinggul: document.getElementById('f-pinggul').value,
    tinggi: document.getElementById('f-tinggi').value,
    hijab: (document.querySelector('input[name=hijab]:checked')||{}).value || '',
    catatan: document.getElementById('f-catatan').value,
    ucapan: document.getElementById('f-ucapan').value,
    waktu: new Date().toLocaleString('en-US')
  };
  const list = JSON.parse(localStorage.getItem('bridesmaid_rsvp') || '[]');
  list.push(data);
  localStorage.setItem('bridesmaid_rsvp', JSON.stringify(list));

  const waLines = [
    'Hi! I would like to confirm my attendance:',
    '',
    'Name: ' + (data.nama || '-'),
    'Attendance: ' + (data.konfirmasi || '-'),
    'Dress Size: ' + (data.ukuran || '-') + (data.ukuran === 'Custom' ? ' (Bust:' + (data.dada||'-') + ' Waist:' + (data.pinggang||'-') + ' Hips:' + (data.pinggul||'-') + ' Height:' + (data.tinggi||'-') + ')' : ''),
    'Hijab: ' + (data.hijab || '-'),
    'Notes: ' + (data.catatan || '-'),
    'Message: ' + (data.ucapan || '-')
  ];
  const waText = encodeURIComponent(waLines.join('\n'));
  window.open('https://wa.me/6289659050130?text=' + waText, '_blank');

  confettiBurst();
  showToast('Thank you! Your confirmation has been saved 💛');
  setTimeout(()=>{
    scrollToSection('thankyou');
  }, 700);
});

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=> t.classList.remove('show'), 3200);
}

/* ================= ADMIN DASHBOARD (?admin=1) ================= */
(function(){
  const params = new URLSearchParams(location.search);
  if(params.get('admin') !== '1') return;
  const admin = document.getElementById('admin');
  admin.classList.add('show');
  document.getElementById('close-admin').addEventListener('click', ()=> admin.classList.remove('show'));

  const list = JSON.parse(localStorage.getItem('bridesmaid_rsvp') || '[]');
  const hadir = list.filter(x=>x.konfirmasi==='Attending').length;
  document.getElementById('admin-stats').innerHTML = `
    <div class="stat"><b>${list.length}</b><span>Total Responses</span></div>
    <div class="stat"><b>${hadir}</b><span>Confirmed Attending</span></div>
    <div class="stat"><b>${list.length-hadir}</b><span>Not Sure Yet</span></div>
  `;
  const tbody = document.querySelector('#admin-table tbody');
  tbody.innerHTML = list.map(x=>`
    <tr>
      <td>${x.nama||'-'}</td>
      <td>${x.konfirmasi||'-'}</td>
      <td>${x.ukuran||'-'}${x.ukuran==='Custom' ? ` (Bust:${x.dada||'-'} Waist:${x.pinggang||'-'} Hips:${x.pinggul||'-'} Height:${x.tinggi||'-'})` : ''}</td>
      <td>${x.hijab||'-'}</td>
      <td>${x.catatan||'-'}</td>
      <td>${x.ucapan||'-'}</td>
    </tr>
  `).join('');

  document.getElementById('export-csv').addEventListener('click', ()=>{
    const headers = ['Name','Status','Size','Bust/Chest','Waist','Hips','Height','Hijab','Notes','Message','Submitted At'];
    const rows = list.map(x=>[x.nama,x.konfirmasi,x.ukuran,x.dada,x.pinggang,x.pinggul,x.tinggi,x.hijab,x.catatan,x.ucapan,x.waktu]);
    let csv = headers.join(',') + '\n' + rows.map(r=> r.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(["\uFEFF"+csv], {type:'text/csv;charset=utf-8;'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'bridesmaid-confirmations.csv';
    link.click();
  });
})();

/* ================= FALLING PETALS ================= */
const canvas = document.getElementById('petals');
const ctx = canvas.getContext('2d');
function resizeCanvas(){ canvas.width = innerWidth; canvas.height = innerHeight; }
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const PETAL_COUNT = window.innerWidth < 700 ? 14 : 26;
const petals = Array.from({length:PETAL_COUNT}, ()=> ({
  x: Math.random()*innerWidth,
  y: Math.random()*innerHeight,
  r: 5 + Math.random()*7,
  speed: 0.4 + Math.random()*0.9,
  drift: Math.random()*1 - 0.5,
  rot: Math.random()*360,
  rotSpeed: (Math.random()-0.5)*1.2,
  hue: Math.random() > 0.5 ? '#DCA9A0' : '#F1E2CB'
}));

function drawPetal(p){
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot * Math.PI/180);
  ctx.fillStyle = p.hue;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.ellipse(0,0,p.r,p.r*0.6,0,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}
function animatePetals(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  petals.forEach(p=>{
    p.y += p.speed;
    p.x += p.drift;
    p.rot += p.rotSpeed;
    if(p.y > innerHeight + 20){ p.y = -20; p.x = Math.random()*innerWidth; }
    if(p.x > innerWidth + 20) p.x = -20;
    if(p.x < -20) p.x = innerWidth + 20;
    drawPetal(p);
  });
  requestAnimationFrame(animatePetals);
}
animatePetals();

/* ================= CURSOR GLOW + TRAIL ================= */
const glow = document.getElementById('cursor-glow');
let mouseX = -100, mouseY = -100, glowX = -100, glowY = -100;
window.addEventListener('mousemove', (e)=>{
  mouseX = e.clientX; mouseY = e.clientY;
});
function tickGlow(){
  glowX += (mouseX - glowX) * 0.16;
  glowY += (mouseY - glowY) * 0.16;
  glow.style.left = glowX + 'px';
  glow.style.top = glowY + 'px';
  requestAnimationFrame(tickGlow);
}
if(!REDUCE_MOTION) requestAnimationFrame(tickGlow);
document.addEventListener('mouseover', (e)=>{
  const t = e.target;
  if(t.closest && t.closest('.btn,button')) glow.classList.add('on-btn');
  else glow.classList.remove('on-btn');
  if(t.closest && t.closest('img,.arch-frame,.j-card,.d-tile,.d-hero')) glow.classList.add('on-photo');
  else glow.classList.remove('on-photo');
});

/* ================= BUTTON RIPPLE ================= */
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.btn');
  if(!btn) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.6;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', ()=> ripple.remove());
});

/* ================= PARALLAX ON BG PHOTOS ================= */
['#welcome .bg','#reveal .bg'].forEach(sel=>{
  const el = document.querySelector(sel);
  if(!el) return;
  el.parentElement.addEventListener('mousemove', (e)=>{
    const x = (e.clientX / innerWidth - 0.5) * 18;
    const y = (e.clientY / innerHeight - 0.5) * 18;
    el.style.transform = `scale(1.12) translate(${x}px, ${y}px)`;
  });
});
