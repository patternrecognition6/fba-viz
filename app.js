// ── CLOB vs FBA — Animated Timeline with Manual Pauses ──

// ═══════════════════════════════════════════
// ORDER BOOK & VERIFIED MATH
// ═══════════════════════════════════════════
//
// Cancelled ($10.5K): C(48) E(50) F(55) G(60) H(65) I(70) J(75) K(80)
// Stale ($3.6K): A(46,200) B(47,200) D(49,200) L(85,1500) M(90,800) O(93,500) P(96,200)
//
// ── CLOB (sniper buys at posted prices) ──
// Near-money (A,B,D):
//   200×(99-46) + 200×(99-47) + 200×(99-49)
//   = 200×53 + 200×52 + 200×50 = 10600+10400+10000 = 31000¢ = $310
//   Avg fill: (46+47+49)/3 = 47.3¢ → loss 51.7¢/ct
//
// All stale:
//   $310 + 1500×14 + 800×9 + 500×6 + 200×3
//   = 31000 + 21000 + 7200 + 3000 + 600 = 62800¢ = $628
//   Weighted avg fill: 293600/3600 = 81.6¢ → loss 17.4¢/ct
//
// ── FBA (all sell at uniform 93¢) ──
// Per contract loss: 99-93 = 6¢
// Near-money: 600 × 6¢ = 3600¢ = $36
// All stale: 3600 × 6¢ = 21600¢ = $216
//
// ── COMPARISON ──
// Near-money: $310 vs $36 → 8.6× better, saved $274
// All stale:  $628 vs $216 → 2.9× better, saved $412

const BOOK = [
    { price:46, size:200,  who:'A' },
    { price:47, size:200,  who:'B' },
    { price:48, size:200,  who:'C' },
    { price:49, size:200,  who:'D' },
    { price:50, size:200,  who:'E' },
    { price:55, size:500,  who:'F' },
    { price:60, size:1500, who:'G' },
    { price:65, size:2000, who:'H' },
    { price:70, size:2000, who:'I' },
    { price:75, size:2500, who:'J' },
    { price:80, size:1600, who:'K' },
    { price:85, size:1500, who:'L' },
    { price:90, size:800,  who:'M' },
    { price:93, size:500,  who:'O' },
    { price:96, size:200,  who:'P' },
    // Orders above sniper range — exist from start, eaten by other buyers in phase 2
    { price:97, size:300,  who:'Q', aboveSniper:true },
    { price:98, size:400,  who:'R', aboveSniper:true },
    { price:99, size:200,  who:'S', aboveSniper:true },
];

const CANCELLED = new Set(['C','E','F','G','H','I','J','K']);
const STALE = BOOK.filter(o => !CANCELLED.has(o.who)).sort((a,b) => a.price - b.price);

const PRICE_LO = 40, PRICE_HI = 100;
const BATCH_LEN = 5;

// ═══════════════════════════════════════════
// TIMELINE (animation ends at 10s = batch 2 end)
// ═══════════════════════════════════════════

const NEWS_T      = 2.0;
const CANCEL_T    = 2.5;
const CANCEL_DUR  = 0.5;
const SNIPER_T    = 3.2;
const SNIPER_DUR  = 0.8;
const FBA_CLEAR_T = 5.0;
const P2_START    = 5.5;
const P2_END      = 9.5;
const CLOB_P2_WIPE_END = 7.0;
const CLOB_P2_NARROW_S = 7.5;
const END_T       = 10.0;

// FBA batch 1 snipers
const FBA_SNIPERS = [
    { id:'S1', color:'#fb923c', startT:2.5, prices:[{t:2.5,p:75},{t:3.2,p:82},{t:4.0,p:88},{t:4.5,p:91}] },
    { id:'S2', color:'#f472b6', startT:2.7, prices:[{t:2.7,p:78},{t:3.4,p:85},{t:4.1,p:90},{t:4.6,p:93}] },
    { id:'S3', color:'#34d399', startT:2.9, prices:[{t:2.9,p:80},{t:3.6,p:87},{t:4.2,p:92},{t:4.7,p:95}] },
    { id:'S4', color:'#60a5fa', startT:3.2, prices:[{t:3.2,p:82},{t:3.8,p:89},{t:4.3,p:93},{t:4.8,p:94}] },
    { id:'S5', color:'#c084fc', startT:3.5, prices:[{t:3.5,p:85},{t:4.0,p:91},{t:4.5,p:93}] },
];

// FBA batch 2 actors
const FBA_P2 = [
    { id:'Sniper6', color:'#facc15', startT:5.5, type:'sniper', prices:[{t:5.5,p:94},{t:7,p:96},{t:9,p:98}] },
    { id:'Sniper7', color:'#fb923c', startT:6.0, type:'sniper', prices:[{t:6,p:95},{t:7.5,p:97},{t:9,p:99}] },
    { id:'Retail',  color:'#94a3b8', startT:6.0, type:'retail', prices:[{t:6,p:95},{t:8,p:97}] },
    { id:'Retail2', color:'#a1a1aa', startT:6.5, type:'retail', prices:[{t:6.5,p:96},{t:8.5,p:98}] },
    { id:'Retail3', color:'#78716c', startT:7.0, type:'retail', prices:[{t:7,p:97},{t:9,p:99}] },
    { id:'MM-P',    color:'#22d3ee', startT:5.5, type:'mm',     prices:[{t:5.5,p:92},{t:7,p:96},{t:9,p:98}] },
    { id:'MM-Q',    color:'#2dd4bf', startT:6.5, type:'mm',     prices:[{t:6.5,p:94},{t:8,p:97},{t:9.5,p:99}] },
];

// ═══════════════════════════════════════════
// PAUSES — last pause is at 10.0 (end of batch 2)
// ═══════════════════════════════════════════

const PAUSES = [
    {
        t: 0.5,
        center: '',
        clob: '$1K near price (46-50¢). $13K across the book up to 96¢. Total depth ~$14K.',
        fba:  '$1K near price (46-50¢). $13K across the book up to 96¢. Total depth ~$14K.',
    },
    {
        t: NEWS_T + 0.2,
        center: '<span style="color:#ef4444;font-size:1.15em;font-weight:800">⚡ BREAKING — Israel launches strikes on Gaza.</span> True probability → ~99¢.',
        clob: 'Every ask below 99¢ is now massively mispriced. The speed race begins.',
        fba:  'Same shock — but the batch window is still open (closes at 5s). No rush.',
    },
    {
        t: CANCEL_T + CANCEL_DUR + 0.2,
        center: '',
        clob: 'Fast MMs cancel <b>$10.5K</b> in 50ms. <b>$3.6K stays stale</b> at 46, 47, 49, 85, 90, 93, 96¢.',
        fba:  'MMs <b>keep all quotes</b>. No need to race — batch settlement at 5s protects them.',
    },
    {
        t: SNIPER_T + SNIPER_DUR + 0.3,
        center: '',
        clob: 'Sniper sweeps all stale orders: 46→47→49→85→90→93→96¢. Avg fill: <b>82¢</b>. Near-money filled at <b>~47¢</b>.',
        fba:  'Batch window open. Snipers arriving and competing on <b>price</b>, not speed.',
    },
    {
        t: 4.8,
        center: '',
        clob: '',
        fba:  '5 snipers pushed bids to <b>91-95¢</b>. Competition drives the clearing price far above any single bid.',
    },
    {
        t: FBA_CLEAR_T + 0.2,
        center: '',
        clob: '',
        fba:  'Batch 1 clears at <b style="color:#22c55e;font-size:1.1em">93¢</b>. ALL MMs sell at this uniform price — not at their posted quotes.',
    },
    {
        t: 8.0,
        center: 'Second 5s batch: both markets converge toward 99¢.',
        clob: 'Buyers wipe to <b>99.5¢</b>, then tight MM quotes in a narrow <b>99-99.5¢</b> band.',
        fba:  'Batch 2: slower snipers, retail traders, and new MM quotes.',
    },
    {
        t: END_T,
        last: true,
        center: '<b>Both reach ~99¢. Same final price — very different cost to market makers.</b>',
        clob: '<div style="font:700 15px Inter;color:#ef4444;margin-bottom:4px">FINAL RESULT</div>'
            + '<div style="font:600 12px Inter;color:#ef4444;margin-bottom:2px">Near-money MMs: sold at avg 47¢ → $310 lost</div>'
            + '<div style="font:600 12px Inter;color:#ef4444;margin-bottom:2px">All stale MMs: avg fill 82¢ → $628 total lost</div>'
            + '<div style="font:600 12px Inter;color:rgba(244,63,94,0.55);margin-top:3px">1 sniper captured all the surplus</div>',
        fba:  '<div style="font:700 15px Inter;color:#22c55e;margin-bottom:4px">FINAL RESULT</div>'
            + '<div style="font:600 12px Inter;color:#22c55e;margin-bottom:2px">Near-money MMs: sold at 93¢ → $36 lost (CLOB: $310 = 8.6×)</div>'
            + '<div style="font:600 12px Inter;color:#22c55e;margin-bottom:2px">All stale MMs: uniform 93¢ → $216 total (CLOB: $628 = 2.9×)</div>'
            + '<div style="font:600 12px Inter;color:rgba(34,197,94,0.55)">MMs saved $412 total. 5 snipers competed profits away</div>',
    },
];

// ═══════════════════════════════════════════
// STATE & COLORS
// ═══════════════════════════════════════════

const state = { time:0, playing:false, paused:false, speed:0.5, nextPause:0 };

const C = {
    bg:'#12141c', grid:'#181b24', gridText:'#2e3340',
    fair:'#3b82f6', news:'#ef4444',
    book:'#f59e0b', cancelFade:'#3a3530',
    eaten:'rgba(244,63,94,0.4)',
    sniper:'#f43f5e', sniperGlow:'rgba(244,63,94,0.2)', sniperTrail:'rgba(244,63,94,0.1)',
    batch:'#8b5cf6', batchBg:'rgba(139,92,246,0.04)', batchBorder:'rgba(139,92,246,0.18)',
    clear:'#22c55e', clearGlow:'rgba(34,197,94,0.08)',
    lossRed:'rgba(239,68,68,0.06)', lossBord:'rgba(239,68,68,0.25)',
    gainGreen:'rgba(34,197,94,0.06)', gainBord:'rgba(34,197,94,0.25)',
    post:'rgba(100,180,255,0.45)', postDim:'rgba(100,180,255,0.2)',
    convLine:'rgba(200,210,230,0.2)',
    playhead:'#ffffff', timeline:'#1e2230',
    narrow:'rgba(59,130,246,0.12)', narrowBord:'rgba(59,130,246,0.3)',
    mmQuote:'#22d3ee', mmQuoteDim:'rgba(34,211,238,0.3)',
};

// ═══════════════════════════════════════════
// DOM
// ═══════════════════════════════════════════

const clobCanvas = document.getElementById('clobCanvas');
const fbaCanvas  = document.getElementById('fbaCanvas');
const clobCtx = clobCanvas.getContext('2d');
const fbaCtx  = fbaCanvas.getContext('2d');
const clobNarr = document.getElementById('clobNarr');
const fbaNarr  = document.getElementById('fbaNarr');
const centerNarr = document.getElementById('centerNarr');
const contBtn  = document.getElementById('continueBtn');
const backBtn  = document.getElementById('backBtn');
const timeLabel = document.getElementById('timeLabel');

function resize() {
    for (const c of [clobCanvas, fbaCanvas]) {
        const r = c.parentElement.getBoundingClientRect();
        c.width = r.width*2; c.height = r.height*2;
    }
}
resize();
window.addEventListener('resize', resize);

const PAD = { top:42, bot:58, left:90, right:20 };
function p2y(cv,p) { return cv.height-PAD.bot-((p-PRICE_LO)/(PRICE_HI-PRICE_LO))*(cv.height-PAD.top-PAD.bot); }
function t2x(cv,t) { return PAD.left+(t/END_T)*(cv.width-PAD.left-PAD.right); }

function getActorPrice(a,t) {
    if (t<a.startT) return null;
    let p=a.prices[0].p;
    for (let i=0;i<a.prices.length;i++) {
        if (t>=a.prices[i].t) p=a.prices[i].p;
        else { const prev=a.prices[i-1]||{t:a.startT,p:a.prices[0].p}; p=prev.p+(a.prices[i].p-prev.p)*((t-prev.t)/(a.prices[i].t-prev.t)); break; }
    }
    return p;
}

// ═══════════════════════════════════════════
// SHARED DRAW
// ═══════════════════════════════════════════

function drawBase(ctx) {
    const w=ctx.canvas.width, h=ctx.canvas.height;
    ctx.fillStyle=C.bg; ctx.fillRect(0,0,w,h);
    ctx.font='22px JetBrains Mono'; ctx.textAlign='right'; ctx.textBaseline='middle';
    for (let p=PRICE_LO;p<=PRICE_HI;p+=5) {
        const y=p2y(ctx.canvas,p);
        ctx.strokeStyle=C.grid; ctx.lineWidth=0.6;
        ctx.beginPath(); ctx.moveTo(PAD.left,y); ctx.lineTo(w-PAD.right,y); ctx.stroke();
        if (p%10===0||p===45||p===93) { ctx.fillStyle=C.gridText; ctx.fillText(p+'¢',PAD.left-8,y); }
    }
    const tlY=h-26;
    ctx.strokeStyle=C.timeline; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(PAD.left,tlY); ctx.lineTo(w-PAD.right,tlY); ctx.stroke();
    ctx.font='18px JetBrains Mono'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillStyle=C.gridText;
    for (let t=0;t<=END_T;t+=1) {
        const x=t2x(ctx.canvas,t);
        ctx.fillRect(x-0.5,tlY-4,1,8);
        if (t%2===0) ctx.fillText(t+'s',x,tlY+6);
    }
    const fy=p2y(ctx.canvas,45);
    ctx.setLineDash([6,5]); ctx.strokeStyle=C.fair; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(PAD.left,fy); ctx.lineTo(w-PAD.right,fy); ctx.stroke(); ctx.setLineDash([]);
    ctx.font='600 18px Inter'; ctx.fillStyle=C.fair; ctx.textAlign='left'; ctx.textBaseline='top';
    ctx.fillText('Fair 45¢',PAD.left+4,fy+4);
}

function drawBlock(ctx,price,size,alpha,color) {
    const w=ctx.canvas.width;
    const usableH = ctx.canvas.height - PAD.top - PAD.bot;
    const pxPerCent = usableH / (PRICE_HI - PRICE_LO);
    const usableW = w - PAD.left - PAD.right;

    // Tight zones: 46-50 (1¢ gaps) and 96-99 (1¢ gaps)
    const tight = (price >= 46 && price <= 50) || (price >= 96);
    const bH = tight
        ? Math.min(pxPerCent * 0.75, 12)   // thin for tight clusters
        : Math.min(pxPerCent * 3.5, 28);   // thick for sparse (5¢ gaps)
    const bW = Math.max(30, (size/2500) * usableW * 0.55);
    const y = p2y(ctx.canvas, price);
    const x = PAD.left + 10;
    ctx.globalAlpha=Math.max(0,alpha); ctx.fillStyle=color||C.book;
    ctx.beginPath(); ctx.roundRect(x,y-bH/2,bW,bH, tight?2:4); ctx.fill();
    // Only show text inside sparse (thick) blocks
    if (!tight && bW>40) { ctx.font='bold 18px JetBrains Mono'; ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('$'+size,x+6,y); }
    ctx.globalAlpha=1;
}

function drawNewsMarker(ctx) {
    if (state.time<NEWS_T) return;
    const w=ctx.canvas.width, h=ctx.canvas.height, x=t2x(ctx.canvas,NEWS_T);
    ctx.strokeStyle=C.news; ctx.lineWidth=2; ctx.globalAlpha=0.5;
    ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(x,PAD.top); ctx.lineTo(x,h-PAD.bot); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha=1;
    const dt=state.time-NEWS_T;
    if (dt<1.5) { ctx.fillStyle=`rgba(239,68,68,${0.10*(1-dt/1.5)})`; ctx.fillRect(x,PAD.top,w-PAD.right-x,h-PAD.top-PAD.bot); }
    ctx.font='900 26px Inter'; ctx.fillStyle=C.news; ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.fillText('⚡ STRIKES',x,PAD.top-2);
    const y99=p2y(ctx.canvas,99);
    ctx.setLineDash([6,4]); ctx.strokeStyle=C.news; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(PAD.left,y99); ctx.lineTo(w-PAD.right,y99); ctx.stroke(); ctx.setLineDash([]);
    ctx.font='700 18px Inter'; ctx.fillStyle=C.news; ctx.textAlign='right'; ctx.textBaseline='top';
    ctx.fillText('Fair → 99¢',w-PAD.right-4,y99+3);
}

function drawPlayhead(ctx) {
    const x=t2x(ctx.canvas,state.time), h=ctx.canvas.height;
    ctx.strokeStyle=C.playhead; ctx.lineWidth=1.5; ctx.globalAlpha=0.25;
    ctx.beginPath(); ctx.moveTo(x,PAD.top); ctx.lineTo(x,h-PAD.bot); ctx.stroke(); ctx.globalAlpha=1;
    ctx.beginPath(); ctx.arc(x,h-26,5,0,Math.PI*2); ctx.fillStyle=C.playhead; ctx.fill();
}

function drawActorDot(ctx,actor,t,sx) {
    const price=getActorPrice(actor,t); if (price===null) return;
    const y=p2y(ctx.canvas,price);
    // Trail
    ctx.strokeStyle=actor.color; ctx.lineWidth=1.5; ctx.globalAlpha=0.2;
    ctx.beginPath(); let s=false;
    for (const step of actor.prices) {
        if (t<step.t&&!s) break;
        const py=p2y(ctx.canvas,step.p), px=t2x(ctx.canvas,step.t);
        if (t<step.t) { ctx.lineTo(t2x(ctx.canvas,t),p2y(ctx.canvas,price)); break; }
        if (!s) { ctx.moveTo(px,py); s=true; } else ctx.lineTo(px,py);
    }
    if (s) ctx.stroke(); ctx.globalAlpha=1;
    // Dot
    const r=actor.type==='retail'?6:actor.type==='mm'?7:9;
    ctx.beginPath(); ctx.arc(sx,y,r,0,Math.PI*2); ctx.fillStyle=actor.color; ctx.fill();
    ctx.beginPath(); ctx.arc(sx,y,r+8,0,Math.PI*2); ctx.fillStyle=actor.color+'18'; ctx.fill();
    // Label
    ctx.font=(actor.type==='retail'?'400':'500')+' 15px Inter'; ctx.fillStyle=actor.color;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText(actor.id+' @'+Math.round(price),sx+r+10,y);
}

// ═══════════════════════════════════════════
// CLOB
// ═══════════════════════════════════════════

function drawCLOB() {
    const ctx=clobCtx, w=ctx.canvas.width, h=ctx.canvas.height, t=state.time;
    drawBase(ctx); drawNewsMarker(ctx);

    for (const order of BOOK) {
        if (CANCELLED.has(order.who)) {
            if (t<CANCEL_T) drawBlock(ctx,order.price,order.size,1);
            else if (t<CANCEL_T+CANCEL_DUR) drawBlock(ctx,order.price,order.size,1-(t-CANCEL_T)/CANCEL_DUR*0.9,C.cancelFade);
        } else if (order.aboveSniper) {
            // Orders at 97-99: visible from start, eaten by other buyers in phase 2
            if (t>P2_START) {
                const wp=Math.min(1,(t-P2_START)/(CLOB_P2_WIPE_END-P2_START));
                const ep=1-Math.pow(1-wp,2);
                const wipePrice=96+ep*3.5;
                if (order.price < wipePrice) {
                    drawBlock(ctx,order.price,order.size,0.25,C.eaten);
                } else {
                    drawBlock(ctx,order.price,order.size,1);
                }
            } else {
                drawBlock(ctx,order.price,order.size,1);
            }
        } else {
            if (t>=SNIPER_T) {
                const sp=Math.min(1,(t-SNIPER_T)/SNIPER_DUR);
                const eN=Math.floor(sp*STALE.length);
                const idx=STALE.findIndex(o=>o.who===order.who);
                if (idx<eN) drawBlock(ctx,order.price,order.size,0.25,C.eaten);
                else if (idx===eN&&sp<1) {
                    drawBlock(ctx,order.price,order.size,1);
                    const sy=p2y(ctx.canvas,order.price), sx=PAD.left+150;
                    const loY=p2y(ctx.canvas,STALE[0].price);
                    ctx.strokeStyle=C.sniperTrail; ctx.lineWidth=10;
                    ctx.beginPath(); ctx.moveTo(sx,loY); ctx.lineTo(sx,sy); ctx.stroke();
                    ctx.beginPath(); ctx.arc(sx,sy,12,0,Math.PI*2); ctx.fillStyle=C.sniper; ctx.fill();
                    ctx.beginPath(); ctx.arc(sx,sy,24,0,Math.PI*2); ctx.fillStyle=C.sniperGlow; ctx.fill();
                    ctx.font='700 22px Inter'; ctx.fillStyle=C.sniper;
                    ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('SNIPER',sx+30,sy);
                } else drawBlock(ctx,order.price,order.size,1);
            } else drawBlock(ctx,order.price,order.size,1);
        }
    }

    // Line where main sniper stopped (96¢) — shown after sniper sweep is done
    if (t>SNIPER_T+SNIPER_DUR) {
        const y96=p2y(ctx.canvas,96);
        ctx.setLineDash([5,3]); ctx.strokeStyle='rgba(244,63,94,0.45)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(PAD.left,y96); ctx.lineTo(w-PAD.right,y96); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font='600 18px Inter'; ctx.fillStyle='rgba(244,63,94,0.6)';
        ctx.textAlign='right'; ctx.textBaseline='top';
        ctx.fillText('Sniper stopped @ 96¢',w-PAD.right-8,y96+3);
    }

    // Result zone after sniper
    if (t>SNIPER_T+SNIPER_DUR+0.2) {
        const y99=p2y(ctx.canvas,99), y47=p2y(ctx.canvas,47.3), y82=p2y(ctx.canvas,81.6);
        ctx.fillStyle=C.lossRed; ctx.fillRect(PAD.left+4,y99,w*0.40,y47-y99);
        ctx.strokeStyle=C.lossBord; ctx.lineWidth=1; ctx.strokeRect(PAD.left+4,y99,w*0.40,y47-y99);
        // Price line — dashed, stops at result box edge (like FBA style)
        ctx.setLineDash([5,3]); ctx.strokeStyle='#ef4444'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(PAD.left,y82); ctx.lineTo(PAD.left+4+w*0.40,y82); ctx.stroke(); ctx.setLineDash([]);

        const boxR2 = PAD.left + 4 + w*0.40;
        const sx2 = boxR2 + 16;
        ctx.textAlign='left';

        // Name
        ctx.font='800 26px Inter'; ctx.fillStyle='#ef4444'; ctx.textBaseline='bottom';
        ctx.fillText('SNIPER SWEEP', sx2, y82-6);
        // Price data
        ctx.font='700 22px Inter'; ctx.fillStyle='#ef4444'; ctx.textBaseline='top';
        ctx.fillText('Avg fill: 82¢', sx2, y82+6);
        ctx.font='600 20px Inter';
        ctx.fillText('Near-money: 47¢', sx2, y82+32);
        // Loss
        ctx.font='700 22px Inter';
        ctx.fillText('MMs loss: up to 52¢/ct', sx2, y82+58);
        // Snipers
        ctx.font='600 18px Inter'; ctx.fillStyle='rgba(244,63,94,0.6)';
        ctx.fillText('1 sniper takes all', sx2, y82+84);
    }

    // Phase 2: other buyers wipe orders 97-99 (above where sniper stopped)
    if (t>P2_START) {
        const wp=Math.min(1,(t-P2_START)/(CLOB_P2_WIPE_END-P2_START));
        const ep=1-Math.pow(1-wp,2);
        const wipePrice=96+ep*3.5;  // 96→99.5
        const wy=p2y(ctx.canvas,wipePrice);
        const y96=p2y(ctx.canvas,96);

        // Rising wipe line
        ctx.strokeStyle=C.sniper; ctx.lineWidth=2; ctx.globalAlpha=0.5;
        ctx.beginPath(); ctx.moveTo(PAD.left,wy); ctx.lineTo(w-PAD.right,wy); ctx.stroke(); ctx.globalAlpha=1;

        // Buyer dot climbing from 96 upward through the above-sniper orders
        if (wp<1) {
            const sx=PAD.left+150;
            ctx.strokeStyle=C.sniperTrail; ctx.lineWidth=8;
            ctx.beginPath(); ctx.moveTo(sx,y96); ctx.lineTo(sx,wy); ctx.stroke();
            ctx.beginPath(); ctx.arc(sx,wy,8,0,Math.PI*2); ctx.fillStyle=C.sniper; ctx.fill();
            ctx.font='600 17px Inter'; ctx.fillStyle=C.sniper;
            ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('Other buyers',sx+16,wy);
        }
        // (Tight band visual removed — not needed)
    }
    drawPlayhead(ctx);
}

// ═══════════════════════════════════════════
// FBA
// ═══════════════════════════════════════════

function drawFBA() {
    const ctx=fbaCtx, w=ctx.canvas.width, h=ctx.canvas.height, t=state.time;
    drawBase(ctx); drawNewsMarker(ctx);

    // Book blocks
    const POST_CLEAR_CONTINUE = FBA_CLEAR_T + 0.3; // after user taps continue past clear pause
    if (t<FBA_CLEAR_T) {
        // Before clear: all orders visible normally
        for (const order of BOOK) drawBlock(ctx,order.price,order.size,0.6);
    } else if (t < POST_CLEAR_CONTINUE) {
        // At clear (paused): filled orders in grey, resting orders in orange
        for (const order of BOOK) {
            if (order.price <= 93) {
                drawBlock(ctx,order.price,order.size,0.4,'rgba(120,120,140,0.5)'); // grey = filled
            } else {
                drawBlock(ctx,order.price,order.size,0.6,'#fb923c'); // orange = resting
            }
        }
    } else {
        // After continue: filled orders gone, resting stay orange, new orders appear
        for (const order of BOOK) {
            if (order.price > 93) {
                drawBlock(ctx,order.price,order.size,0.5,'#fb923c');
            }
        }
        // New batch 2 orders — sparse, just below clearing price
        const b2col = '#fb923c';
        drawBlock(ctx, 85, 200, 0.5, b2col);
        drawBlock(ctx, 89, 300, 0.5, b2col);
        drawBlock(ctx, 92, 250, 0.5, b2col);
    }

    // Batch 1 box (0-5s) — just the background shading, labels are in HTML
    if (t>=NEWS_T) {
        const b1x=t2x(ctx.canvas,0), b1e=t2x(ctx.canvas,BATCH_LEN);
        ctx.fillStyle=C.batchBg; ctx.fillRect(b1x,PAD.top,b1e-b1x,h-PAD.top-PAD.bot);
        ctx.strokeStyle=C.batchBorder; ctx.lineWidth=1; ctx.setLineDash([5,4]);
        ctx.strokeRect(b1x,PAD.top,b1e-b1x,h-PAD.top-PAD.bot); ctx.setLineDash([]);
    }

    // Batch 2 box (5-10s) — just the background shading
    if (t>=FBA_CLEAR_T) {
        const b2x=t2x(ctx.canvas,BATCH_LEN), b2e=t2x(ctx.canvas,BATCH_LEN*2);
        ctx.fillStyle=C.batchBg; ctx.fillRect(b2x,PAD.top,b2e-b2x,h-PAD.top-PAD.bot);
        ctx.strokeStyle=C.batchBorder; ctx.lineWidth=1; ctx.setLineDash([5,4]);
        ctx.strokeRect(b2x,PAD.top,b2e-b2x,h-PAD.top-PAD.bot); ctx.setLineDash([]);
    }

    // Batch 1 snipers — hidden after clear
    if (t>=2.5 && t<FBA_CLEAR_T) {
        for (let i=0;i<FBA_SNIPERS.length;i++) {
            drawActorDot(ctx,FBA_SNIPERS[i],t,w*0.5+i*30);
        }
    }

    // CLEAR @ 93 — drawn BEFORE batch 2 actors so actors go on top
    if (t>=FBA_CLEAR_T) {
        const cy=p2y(ctx.canvas,93), y99=p2y(ctx.canvas,99);

        // Price line — dashed, stops at result box edge (matching CLOB style)
        ctx.fillStyle=C.clearGlow; ctx.fillRect(PAD.left,cy-10,PAD.left+4+w*0.40-PAD.left,20);
        ctx.setLineDash([5,3]); ctx.strokeStyle=C.clear; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(PAD.left,cy); ctx.lineTo(PAD.left+4+w*0.40,cy); ctx.stroke(); ctx.setLineDash([]);

        // Result box
        const boxR = PAD.left + 4 + w*0.40;
        ctx.fillStyle=C.gainGreen; ctx.fillRect(PAD.left+4,y99,w*0.40,cy-y99);
        ctx.strokeStyle=C.gainBord; ctx.lineWidth=1; ctx.strokeRect(PAD.left+4,y99,w*0.40,cy-y99);

        // Stats — to the right of the box (matching CLOB layout)
        const sx = boxR + 16;
        ctx.textAlign='left';

        // Name
        ctx.font='800 26px Inter'; ctx.fillStyle=C.clear; ctx.textBaseline='bottom';
        ctx.fillText('CLEARING (BATCH 1)', sx, cy-6);
        // Price data
        ctx.font='700 22px Inter'; ctx.fillStyle='#22c55e'; ctx.textBaseline='top';
        ctx.fillText('Uniform price: 93¢', sx, cy+6);
        ctx.font='600 20px Inter';
        ctx.fillText('All MMs sell at 93¢', sx, cy+32);
        // Loss
        ctx.font='700 22px Inter';
        ctx.fillText('MMs loss: 6¢/ct', sx, cy+58);
        // Snipers
        ctx.font='600 18px Inter'; ctx.fillStyle='rgba(34,197,94,0.6)';
        ctx.fillText('5 snipers competed', sx, cy+84);
        // Comparison
        ctx.font='700 20px Inter'; ctx.fillStyle='#22c55e';
        ctx.fillText('8.6× better (near-money)', sx, cy+110);
        ctx.font='700 20px Inter';
        ctx.fillText('2.9× better (average)', sx, cy+134);
    }

    // CLEARING (BATCH 2) — appears at END_T (10s), right side, same Y as batch 1
    if (t>=END_T) {
        const cy=p2y(ctx.canvas,93); // same horizontal as batch 1 clear line
        const rx = w - PAD.right - 10;

        // Price line — dashed, right portion at 93¢ level
        ctx.setLineDash([5,3]); ctx.strokeStyle=C.clear; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(w*0.60,cy); ctx.lineTo(rx,cy); ctx.stroke(); ctx.setLineDash([]);

        ctx.textAlign='right';
        ctx.font='800 22px Inter'; ctx.fillStyle=C.clear; ctx.textBaseline='bottom';
        ctx.fillText('CLEARING (BATCH 2)', rx, cy-6);
        ctx.font='700 20px Inter'; ctx.fillStyle='#22c55e'; ctx.textBaseline='top';
        ctx.fillText('Uniform price: 99¢', rx, cy+6);
    }

    // Batch 2 actors — far right, above the clear stats
    if (t>P2_START) {
        for (let i=0;i<FBA_P2.length;i++) {
            drawActorDot(ctx,FBA_P2[i],t, w*0.70+i*22);
        }

        // (Convergence line removed — batch 2 actors show the movement)
    }
    drawPlayhead(ctx);
}

// ═══════════════════════════════════════════
// CONTROLS & LOOP
// ═══════════════════════════════════════════

function showPause(i) {
    centerNarr.innerHTML = PAUSES[i].center||'';
    clobNarr.innerHTML   = PAUSES[i].clob||'';
    fbaNarr.innerHTML    = PAUSES[i].fba||'';
}
function updateBack() { backBtn.classList.toggle('hidden',state.nextPause<=1); }

let lastFrame=null;
function loop(ts) {
    if (!lastFrame) lastFrame=ts;
    const dt=(ts-lastFrame)/1000; lastFrame=ts;

    if (state.playing && !state.paused) {
        state.time += dt*state.speed;

        // Check pause points
        if (state.nextPause<PAUSES.length && state.time>=PAUSES[state.nextPause].t) {
            state.time = PAUSES[state.nextPause].t;
            state.paused = true;
            showPause(state.nextPause);

            const isLast = PAUSES[state.nextPause].last;
            state.nextPause++;
            contBtn.classList.remove('dim');
            contBtn.textContent = isLast ? '▶ REPLAY' : '▶ CONTINUE';
            updateBack();

            // If last pause, stop playing entirely
            if (isLast) state.playing = false;
        }

        // Safety: don't exceed end
        if (state.time >= END_T) {
            state.time = END_T;
            state.playing = false;
            state.paused = true;
            contBtn.classList.remove('dim');
            contBtn.textContent = '▶ REPLAY';
        }

        timeLabel.textContent = state.time.toFixed(1)+'s';
    }

    drawCLOB(); drawFBA();
    requestAnimationFrame(loop);
}

contBtn.addEventListener('click',()=>{
    // Replay from beginning
    if (!state.playing && state.time >= END_T - 0.1) {
        state.time=0; state.nextPause=0; state.paused=false; state.playing=true;
        centerNarr.innerHTML=''; clobNarr.innerHTML=''; fbaNarr.innerHTML='';
        contBtn.classList.add('dim'); contBtn.textContent='▶ CONTINUE';
        updateBack(); return;
    }
    // Continue from pause
    if (state.paused) {
        state.paused=false;
        state.playing=true;
        contBtn.classList.add('dim');
        return;
    }
    // First press: start
    state.playing=true; contBtn.classList.add('dim'); contBtn.textContent='▶ CONTINUE';
});

backBtn.addEventListener('click',()=>{
    if (state.nextPause<=1) return;
    state.nextPause=Math.max(0,state.nextPause-2);
    state.time=PAUSES[state.nextPause].t; state.paused=true; state.playing=true;
    showPause(state.nextPause); state.nextPause++;
    contBtn.classList.remove('dim'); contBtn.textContent='▶ CONTINUE';
    updateBack(); timeLabel.textContent=state.time.toFixed(1)+'s';
});

document.getElementById('resetBtn').addEventListener('click',()=>{
    state.time=0; state.playing=false; state.paused=false; state.nextPause=0; lastFrame=null;
    centerNarr.innerHTML=''; clobNarr.innerHTML=''; fbaNarr.innerHTML='';
    contBtn.classList.remove('dim'); contBtn.textContent='▶ START';
    timeLabel.textContent='0.0s'; updateBack(); drawCLOB(); drawFBA();
});

document.getElementById('speedSel').addEventListener('change',function(){state.speed=parseFloat(this.value);});
document.addEventListener('keydown',(e)=>{
    if(e.key===' '||e.key==='ArrowRight'){e.preventDefault();contBtn.click();}
    if(e.key==='ArrowLeft'){e.preventDefault();backBtn.click();}
});

requestAnimationFrame(loop);
