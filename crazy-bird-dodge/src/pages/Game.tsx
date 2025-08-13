import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { CENTER, MAP_H, MAP_W, PLAYER_SIZE, PLAYER_SPEED, STAGE_SECONDS, BIRD_FOLLOW_TIME, HUNTER_MAXIMUM_COUNT, BIRD_MAXIMUM_COUNT, VIEW_H, VIEW_W, BIRD_SPAWN_PER_SEC } from '../game/constants';
import { Sfx } from '../game/audio';
import { Bird, Hunter } from '../game/types';
import { birdSpeed, clamp, collide, makeBird, makeHunters, moveToward, rand } from '../game/logic';
import useRAF from '../game/useRAF';
import './game.css';

const sfx = new Sfx();

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const miniRef = useRef<HTMLCanvasElement | null>(null);

  // stage & state
  let gameInfo = {
    stage: 0,
    timeLeft: STAGE_SECONDS,
    lives: 3,
    score: 0,
    message: '잠시 후 미친새가 쫓아옵니다.'
  };
  
  let birds = Array<Bird>();
  let hunters = Array<Hunter>(HUNTER_MAXIMUM_COUNT);
  const setHunters = (tmpHunters: Hunter[]) => {
      hunters.length = 0;
      tmpHunters.forEach(h => {
          hunters.push(h);
      });
  };

  // player map position
  const player = useRef({ x: CENTER.x + rand(-200,200), y: CENTER.y + rand(-200,200) });
  const playerSpeed = PLAYER_SPEED;
  const birdSpd = useRef(birdSpeed(gameInfo.stage));
  const spawning = useRef(false);

  const pressed = useRef<{down:boolean; x:number; y:number}>({ down:false, x:0, y:0 });

  const initStage = () => {
    gameInfo.stage = gameInfo.stage + 1;
    gameInfo.timeLeft = STAGE_SECONDS;
    gameInfo.message = '잠시 후 미친새가 쫓아옵니다.';
    
    birds.length = 0;
    hunterKillsRef.current = 0; 
    bonusApplied.current = {}; 

    // init hunters per stage
    setHunters(makeHunters());

    // countdown timer
    const countdown = setInterval(() => {
        if (gameInfo.timeLeft <= 1 || gameInfo.lives < 1) { 
            clearInterval(countdown); 
            onStageClear(); 
            return 0; 
        }
        gameInfo.timeLeft = gameInfo.timeLeft - 1;
        // time scoring: stage1 5pt/sec, stage up +2/sec
        gameInfo.score = gameInfo.score + (5 + (gameInfo.stage - 1) * 2);

        spawning.current = gameInfo.timeLeft < BIRD_FOLLOW_TIME;

        // spawn birds: 3 per second from center
        if (spawning.current) {
            gameInfo.message = '';

            for (let idx = 0; idx < BIRD_SPAWN_PER_SEC; idx++) {
                birds.push(makeBird());
            }
        }
      }, 1000);
  };

  useEffect(() => {
    initStage();
  });

  // input handlers
  useEffect(() => {
    const c = canvasRef.current!;
    const onDown = (e: PointerEvent) => { pressed.current = { down:true, x:e.clientX, y:e.clientY }; };
    const onUp = () => { pressed.current.down = false; };
    const onMove = (e: PointerEvent) => { if (pressed.current.down) { pressed.current.x = e.clientX; pressed.current.y = e.clientY; } };
    c.addEventListener('pointerdown', onDown); window.addEventListener('pointerup', onUp); window.addEventListener('pointermove', onMove);
    return () => { c.removeEventListener('pointerdown', onDown); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointermove', onMove); };
  }, []);

  // main loop
  useRAF((dt) => {
    const cvs = canvasRef.current; if (!cvs) return;
    const ctx = cvs.getContext('2d')!;
    // update speeds for stage
    birdSpd.current = birdSpeed(gameInfo.stage);

    // move player towards pointer when dragging
    if (pressed.current.down) {
      const target = screenToWorld(pressed.current.x, pressed.current.y, player.current);
      const np = moveToward(player.current.x, player.current.y, target.x, target.y, playerSpeed, dt);
      player.current.x = clamp(np.x, 0, MAP_W); player.current.y = clamp(np.y, 0, MAP_H);
    }

    // birds follow player
    birds = birds.map(b => {
        const np = moveToward(b.x, b.y, player.current.x, player.current.y, birdSpd.current, dt);
        return { ...b, x: np.x, y: np.y };
    });

    // hunters move / follow / shoot
    hunters = hunters.map((h) => {
      const dx = player.current.x - h.x, dy = player.current.y - h.y; const d = Math.hypot(dx, dy);
      const targetPlayer = h.targetPlayer || d < 200; // if met -> follow
      let nx = h.x, ny = h.y;
      if (targetPlayer) { const mv = moveToward(h.x, h.y, player.current.x, player.current.y, h.speed, dt); nx = mv.x; ny = mv.y; }
      // shoot nearest bird if within radius
      const radius = 180;
      let shot = false;
      let targetIndex = -1; let minD = 130;
      birds.forEach((b, idx) => { 
          const dd = Math.hypot(b.x - nx, b.y - ny); 
          if (dd < radius && dd < minD && !b.beingShot) { 
              targetIndex = idx; minD = dd; } 
            });
      if (targetIndex >= 0) {
        const b = birds[targetIndex]; b.beingShot = true;
        setTimeout(() => {
          // kill if still exists
            const i = birds.findIndex((x) => x.id === b.id);
            if (i >= 0) {
                const copy = birds.slice();
                copy.splice(i, 1);
                birds = copy;
                sfx.shot.currentTime = 0; 
                //sfx.shot.play(); 
                hunterKillsRef.current++;
            }
        }, Math.floor(rand(0.2, h.shotCooldown) * 1000));
        shot = true;
      }
      return { ...h, x: nx, y: ny, targetPlayer };
    });

    // collisions birds-player
    const remain: Bird[] = [];
    for (const b of birds) {
        if (collide(b, player.current, 20)) {
            // hit
            if (!hitCooldownRef.current) {
            livesRef.current = Math.max(0, livesRef.current - 1);
            gameInfo.lives = livesRef.current;
            if (livesRef.current <= 0) { onStageDefeat(); }
            hitCooldownRef.current = 0.5; // 0.5s invuln
            }
        } else {
            remain.push(b);
        }
    }
    birds = remain;

    // dec hit cooldown
    if (hitCooldownRef.current > 0) hitCooldownRef.current = Math.max(0, hitCooldownRef.current - dt);

    // render
    render(ctx);

    // minimap
    drawMini();
  }, true);

  const livesRef = useRef(gameInfo.lives);
  const hitCooldownRef = useRef(0);
  useEffect(() => { livesRef.current = gameInfo.lives; }, [gameInfo.lives]);

  // helpers
  function screenToWorld(sx: number, sy: number, center: {x:number;y:number}) {
    const viewLeft = clamp(center.x - VIEW_W / 2, 0, MAP_W - VIEW_W);
    const viewTop = clamp(center.y - VIEW_H / 2, 0, MAP_H - VIEW_H);
    return { x: viewLeft + sx, y: viewTop + sy };
  }

  function render(ctx: CanvasRenderingContext2D) {
    // camera
    const viewLeft = clamp(player.current.x - VIEW_W / 2, 0, MAP_W - VIEW_W);
    const viewTop = clamp(player.current.y - VIEW_H / 2, 0, MAP_H - VIEW_H);

    // bg
    const bg = new Image(); bg.src = '/src/assets/game_bg.jpg';
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    ctx.drawImage(bg, -viewLeft, -viewTop, MAP_W, MAP_H);

    // birds
    ctx.font = '16px system-ui';
    birds.forEach((b) => {
      ctx.fillStyle = 'yellow';
      ctx.beginPath(); ctx.arc(b.x - viewLeft, b.y - viewTop, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('🐦', b.x - viewLeft - 8, b.y - viewTop + 6);
    });

    // hunters
    hunters.forEach((h) => {
      ctx.fillStyle = h.color; ctx.fillRect(h.x - viewLeft - 15, h.y - viewTop - 15, 30, 30);
      ctx.fillStyle = '#000'; ctx.fillText(h.name, h.x - viewLeft - 18, h.y - viewTop - 20);
    });

    // player centered
    ctx.fillStyle = 'cyan';
    ctx.fillRect(VIEW_W/2 - PLAYER_SIZE/2, VIEW_H/2 - PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
    ctx.fillStyle = '#fff'; ctx.fillText('✈️', VIEW_W/2 - 8, VIEW_H/2 + 6);

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(10, 10, 250, 36);
    ctx.fillStyle = '#fff'; ctx.fillText(`Stage ${gameInfo.stage}  Lives ${gameInfo.lives}  Time ${gameInfo.timeLeft}  Score ${gameInfo.score}`, 16, 34);

    if (gameInfo.message) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(VIEW_W/2 - 180, VIEW_H/2 - 26, 360, 48);
      ctx.fillStyle = '#fff'; ctx.fillText(gameInfo.message, VIEW_W/2 - 150, VIEW_H/2 + 4);
    }
  }

  const hunterKillsRef = useRef(0);
  const bonusApplied = useRef<{[k:number]:boolean}>({});
  useEffect(() => {
    const i = setInterval(() => {
      const kills = hunterKillsRef.current;
      const thresholds = [10,30,50,100];
      const bonus = [30,50,100,200];
      thresholds.forEach((th, idx) => {
        if (kills >= th && !bonusApplied.current[th]) {
          gameInfo.score = gameInfo.score + bonus[idx];
          bonusApplied.current[th] = true;
        }
      });
    }, 500);
    return () => clearInterval(i);
  }, []);

  function drawMini() {
    const mini = miniRef.current; if (!mini) return; const mctx = mini.getContext('2d')!;
    const W = 120, H = 120; mini.width = W; mini.height = H;
    mctx.fillStyle = 'rgba(0,0,0,0.6)'; mctx.fillRect(0,0,W,H);
    const sx = (x:number) => (x / MAP_W) * W; const sy = (y:number) => (y / MAP_H) * H;
    // player
    mctx.fillStyle = 'cyan'; mctx.beginPath(); mctx.arc(sx(player.current.x), sy(player.current.y), 4, 0, Math.PI*2); mctx.fill();
    // birds
    mctx.fillStyle = 'yellow'; birds.slice(0,60).forEach((b) => { mctx.fillRect(sx(b.x)-1, sy(b.y)-1, 2, 2); });
    // hunters
    hunters.forEach((h) => { mctx.fillStyle = h.color; mctx.fillRect(sx(h.x)-2, sy(h.y)-2, 4, 4); });
  }

  function onStageClear() {
    if(!spawning.current) {
        return;
    }
    spawning.current = false; 
    sfx.clear.currentTime = 0; 
    //sfx.clear.play();
    gameInfo.message = 'Stage clear';
    freezeAndPrompt('clear');
  }
  function onStageDefeat() {
    if(!spawning.current) {
        return;
    }
    spawning.current = false;
    gameInfo.message = 'Stage defeat';
    freezeAndPrompt('defeat');
  }

  async function freezeAndPrompt(type: 'clear'|'defeat') {
    // 저장: localStorage 사용 (Capacitor Preferences로 교체 가능)
    const stage = gameInfo.stage;
    const score = gameInfo.score;
    const record = { stage, score, result: type, killedBirds: hunterKillsRef.current, metHunters: 0, ts: Date.now() };
    const detail = `총 점수: ${gameInfo.score}\n이번 스테이지 새 잡음: ${record.killedBirds}\n`;
    const stoped = type === 'defeat' || !confirm(`'Stage clear'\n\n${detail}\n\n다음 스테이지로 진행할까요?`);
    const regame = confirm(`Stage defeat!\n\n${detail}\n\n게임을 다시 시작하시겠습니까?`);
    const raw = localStorage.getItem('score_history');
    const arr = raw ? JSON.parse(raw) : [];

    if(stoped) {
        arr.unshift(record);
        localStorage.setItem('score_history', JSON.stringify(arr));
    }

    setTimeout(() => {

      if (!stoped) {
        initStage();
      } else {
        if(!regame) {
            window.location.href = '/home';
        } else {
            gameInfo = {
                stage: 0,
                timeLeft: STAGE_SECONDS,
                lives: 3,
                score: 0,
                message: '잠시 후 미친새가 쫓아옵니다.'
              };
            initStage();
        }
      }
    }, 300);
  }

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="game" style={{ backgroundImage: 'url(/src/assets/game_bg.jpg)' }}>
          <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} className="viewport" />
          <canvas ref={miniRef} className="minimap" width={120} height={120} />
        </div>
      </IonContent>
    </IonPage>
  );
}