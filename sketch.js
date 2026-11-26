let bgImage; // 儲存背景圖片 bg/3.png
let bgOffsetX = 0; // 記錄背景水平捲動偏移量（負值代表背景往左移動）
let characterSprite; // 儲存角色一的精靈圖
let walkSprite; // 儲存角色一的走路精靈圖
let magicSprite; // 儲存角色一的施法精靈圖
let magicEffectSprite; // 儲存角色一的魔法特效精靈圖
let characterX; // 儲存角色一目前的水平中心位置
let isWalking = false; // 記錄角色是否已切換為走路動畫
let facingDirection = 1; // 記錄角色朝向（1 為右，-1 為左）
let isCasting = false; // 記錄角色是否正在播放施法動畫
let magicStartFrame = 0; // 記錄施法動畫開始時的畫面計數
let magicDirection = 1; // 記錄施法時鎖定的方向
let spaceIsDown = false; // 記錄空白鍵是否已按住以避免重複觸發
let activeEffects = []; // 儲存目前畫面上飛行中的魔法特效

// 角色 2 相關變數
let c2StopSprite; // 角色二靜止精靈圖 (2/stop/stop.png)
let c2AttackSprite; // 角色二攻擊精靈圖 (2/攻擊/attack.png)
let c2IsAttacking = false; // 記錄角色二目前是否處於攻擊狀態
let c2AnimStartFrame = 0; // 記錄角色二目前狀態開始的畫面計數

// 數學選擇題與互動狀態
let currentQuestion = null; // 儲存目前加法題目 { a, b, answer, options, selectedIndex, isCorrect }
let hasAnsweredCurrentEncounter = false; // 記錄本次接近是否已作答
let quizFeedbackText = ""; // 作答後顯示的提示文字
let quizButtons = []; // 儲存四個選項按鈕的hit box { x, y, w, h, value, index }

// 三秒特效狀態
let fireworksEndTime = 0; // 煙火結束時間戳記（毫秒）
let lightningEndTime = 0; // 閃電結束時間戳記（毫秒）
let fireworkParticles = []; // 煙火粒子陣列
let nextFireworkLaunchTime = 0; // 下一次發射煙火的時間戳記
let lightningBolts = []; // 閃電路徑陣列
let nextLightningBoltTime = 0; // 下一次產生閃電的時間戳記

const frameCountInSprite = 10; // 設定精靈圖包含的影格數
const frameWidth = 139.5; // 設定每個影格的寬度（1395 除以 10）
const frameHeight = 196; // 設定每個影格的高度
const walkFrameCount = 9; // 設定走路精靈圖包含的影格數
const walkFrameWidth = 1246 / walkFrameCount; // 計算走路動畫每格的寬度
const walkFrameHeight = 198; // 設定走路動畫每格的高度
const magicFrameCount = 4; // 設定施法精靈圖包含的影格數
const magicFrameWidth = 1039 / magicFrameCount; // 計算施法動畫每格的寬度
const magicFrameHeight = 146; // 設定施法動畫每格的高度
const effectFrameCount = 5; // 設定魔法特效精靈圖包含的影格數
const effectFrameWidth = 740 / effectFrameCount; // 計算魔法特效每格的寬度
const effectFrameHeight = 19; // 設定魔法特效每格的高度
const framesPerStep = 8; // 設定動畫每隔幾個畫面更新一格

// 角色 2 精靈圖參數
const c2StopFrameCount = 8;
const c2StopFrameWidth = 699 / c2StopFrameCount;
const c2StopFrameHeight = 190;

const c2AttackFrameCount = 14;
const c2AttackFrameWidth = 1871 / c2AttackFrameCount;
const c2AttackFrameHeight = 177;

function preload() {
  bgImage = loadImage("bg/3.png");
  characterSprite = loadImage("1/stop/stop.png");
  walkSprite = loadImage("1/walk/walk.png");
  magicSprite = loadImage("1/magic/magic.png");
  magicEffectSprite = loadImage("1/magic_effect/magic_effect.png");

  c2StopSprite = loadImage("2/stop/stop.png");
  c2AttackSprite = loadImage("2/攻擊/attack.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  characterX = (width * 2) / 3;
  frameRate(60);
  c2AnimStartFrame = frameCount;
}

function generateAdditionQuestion() {
  const a = floor(random(10, 50));
  const b = floor(random(10, 50));
  const answer = a + b;
  const optionSet = new Set([answer]);

  while (optionSet.size < 4) {
    const delta = floor(random(-12, 13));
    const candidate = answer + delta;
    if (candidate >= 0 && candidate !== answer) {
      optionSet.add(candidate);
    }
  }

  const options = Array.from(optionSet);
  for (let i = options.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  currentQuestion = {
    a,
    b,
    answer,
    options,
    selectedIndex: null,
    isCorrect: null
  };
  hasAnsweredCurrentEncounter = false;
  quizFeedbackText = "";
}

function triggerFireworks() {
  const now = millis();
  fireworksEndTime = now + 3000;
  nextFireworkLaunchTime = now;
  spawnFireworkBurst(random(width * 0.2, width * 0.8), random(height * 0.15, height * 0.45));
}

function spawnFireworkBurst(cx, cy) {
  const palette = ["#FF4D4F", "#FFD666", "#40A9FF", "#73D13D", "#FF85C0", "#B37FEB"];
  const burstColor = color(random(palette));
  for (let i = 0; i < 36; i++) {
    const angle = (TWO_PI * i) / 36 + random(-0.08, 0.08);
    const speed = random(2.5, 7.5);
    fireworkParticles.push({
      x: cx,
      y: cy,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed - 1.2,
      alpha: 255,
      size: random(4, 8),
      col: burstColor
    });
  }
}

function triggerLightning() {
  const now = millis();
  lightningEndTime = now + 3000;
  nextLightningBoltTime = now;
  spawnLightningBolt();
}

function spawnLightningBolt() {
  const startX = random(width * 0.15, width * 0.85);
  const points = [{ x: startX, y: 0 }];
  let curX = startX;
  let curY = 0;
  const segments = 9;
  const stepY = (height * 0.72) / segments;

  for (let i = 1; i <= segments; i++) {
    curX += random(-45, 45);
    curY = i * stepY;
    points.push({ x: curX, y: curY });
  }

  lightningBolts.push({
    points,
    createdAt: millis(),
    duration: 240
  });
}

function drawFireworksEffect() {
  const now = millis();
  const active = now < fireworksEndTime;

  if (active && now >= nextFireworkLaunchTime) {
    spawnFireworkBurst(random(width * 0.18, width * 0.82), random(height * 0.14, height * 0.46));
    nextFireworkLaunchTime = now + 320;
  }

  for (let i = fireworkParticles.length - 1; i >= 0; i--) {
    const p = fireworkParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.14;
    p.vx *= 0.985;
    p.alpha -= 4.5;

    if (p.alpha <= 0) {
      fireworkParticles.splice(i, 1);
      continue;
    }

    push();
    noStroke();
    const c = color(red(p.col), green(p.col), blue(p.col), p.alpha);
    fill(c);
    ellipse(p.x, p.y, p.size, p.size);
    pop();
  }
}

function drawLightningEffect() {
  const now = millis();
  const active = now < lightningEndTime;

  if (active && now >= nextLightningBoltTime) {
    spawnLightningBolt();
    nextLightningBoltTime = now + 260;
  }

  if (active && (now % 180) < 55) {
    push();
    noStroke();
    fill(255, 255, 220, 45);
    rect(0, 0, width, height);
    pop();
  }

  for (let i = lightningBolts.length - 1; i >= 0; i--) {
    const bolt = lightningBolts[i];
    const age = now - bolt.createdAt;
    if (age > bolt.duration) {
      lightningBolts.splice(i, 1);
      continue;
    }

    const fade = map(age, 0, bolt.duration, 255, 0);
    push();
    noFill();
    strokeJoin(ROUND);

    // 外層電光光暈
    stroke(80, 180, 255, fade * 0.65);
    strokeWeight(10);
    beginShape();
    for (const pt of bolt.points) {
      vertex(pt.x, pt.y);
    }
    endShape();

    // 內層亮白閃電核心
    stroke(255, 255, 255, fade);
    strokeWeight(3.5);
    beginShape();
    for (const pt of bolt.points) {
      vertex(pt.x, pt.y);
    }
    endShape();
    pop();
  }
}

function drawQuizBox() {
  quizButtons = [];
  if (!c2IsAttacking || !currentQuestion) return;

  const boxW = width / 3;
  const boxH = height / 2;
  const boxX = width / 2 - boxW / 2; // 方框中間對準畫布中間
  const boxY = 16; // 方框上方靠近畫布上方

  push();
  // 透明度為 90 的黃色方框（p5.js color alpha 範圍為 0~255）
  fill(255, 230, 50, 90);
  stroke(180, 130, 0, 210);
  strokeWeight(2.5);
  rect(boxX, boxY, boxW, boxH, 14);

  // 題目文字
  fill(35, 25, 0);
  noStroke();
  textAlign(CENTER, TOP);
  const titleSize = constrain(min(boxW * 0.085, boxH * 0.14), 16, 30);
  textSize(titleSize);
  textStyle(BOLD);
  text("數學加法挑戰", boxX + boxW / 2, boxY + boxH * 0.06);

  const qSize = constrain(min(boxW * 0.12, boxH * 0.19), 22, 42);
  textSize(qSize);
  text(
    `${currentQuestion.a} + ${currentQuestion.b} = ?`,
    boxX + boxW / 2,
    boxY + boxH * 0.21
  );

  // 四個選項按鈕（2x2 排列）
  const gridTop = boxY + boxH * 0.44;
  const gridAreaH = boxH * 0.36;
  const gapX = boxW * 0.06;
  const gapY = gridAreaH * 0.14;
  const btnW = (boxW * 0.84 - gapX) / 2;
  const btnH = (gridAreaH - gapY) / 2;
  const gridLeft = boxX + boxW * 0.08;

  for (let i = 0; i < currentQuestion.options.length; i++) {
    const col = i % 2;
    const row = floor(i / 2);
    const bx = gridLeft + col * (btnW + gapX);
    const by = gridTop + row * (btnH + gapY);
    const optVal = currentQuestion.options[i];

    const isHovered =
      mouseX >= bx && mouseX <= bx + btnW && mouseY >= by && mouseY <= by + btnH;

    let btnFill = isHovered && !hasAnsweredCurrentEncounter
      ? color(255, 248, 170, 235)
      : color(255, 255, 255, 215);
    let btnStroke = color(120, 85, 0, 200);

    if (currentQuestion.selectedIndex === i) {
      btnFill = currentQuestion.isCorrect
        ? color(120, 230, 130, 235)
        : color(255, 120, 120, 235);
    }

    fill(btnFill);
    stroke(btnStroke);
    strokeWeight(2);
    rect(bx, by, btnW, btnH, 10);

    fill(25, 25, 25);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(constrain(btnH * 0.46, 15, 28));
    textStyle(BOLD);
    text(String(optVal), bx + btnW / 2, by + btnH / 2);

    quizButtons.push({
      x: bx,
      y: by,
      w: btnW,
      h: btnH,
      value: optVal,
      index: i
    });
  }

  // 作答回饋訊息
  if (quizFeedbackText) {
    fill(currentQuestion.isCorrect ? color(10, 110, 30) : color(175, 20, 20));
    noStroke();
    textAlign(CENTER, BOTTOM);
    textSize(constrain(min(boxW * 0.065, boxH * 0.1), 14, 22));
    textStyle(BOLD);
    text(quizFeedbackText, boxX + boxW / 2, boxY + boxH - boxH * 0.04);
  }

  pop();
}

function draw() {
  background("#87CEEB");

  const bgAspect = bgImage && bgImage.height > 0 ? bgImage.width / bgImage.height : 1;
  const singleBgWidth = Math.round(max(width, height * bgAspect));
  const singleBgHeight = Math.round(height);

  const minBgOffset = width - singleBgWidth * 2;
  const maxBgOffset = singleBgWidth;
  const anchorX = (width * 2) / 3;

  const movingRight = keyIsDown(RIGHT_ARROW);
  const movingLeft = keyIsDown(LEFT_ARROW);
  isWalking = movingRight || movingLeft;
  const movementStep = constrain(width * 0.004, 2, 8);

  const characterScale = (height / 3) / frameHeight;
  const characterWidth = frameWidth * characterScale;
  const characterHeight = height / 3;

  if (movingRight) {
    isWalking = true;
    facingDirection = 1;
    if (characterX < anchorX) {
      characterX = min(anchorX, characterX + movementStep);
    } else if (bgOffsetX > minBgOffset) {
      bgOffsetX = max(minBgOffset, bgOffsetX - movementStep);
    } else {
      characterX += movementStep;
    }
  } else if (movingLeft) {
    isWalking = true;
    facingDirection = -1;
    if (characterX > anchorX) {
      characterX = max(anchorX, characterX - movementStep);
    } else if (bgOffsetX < maxBgOffset) {
      bgOffsetX = min(maxBgOffset, bgOffsetX + movementStep);
    } else {
      characterX -= movementStep;
    }
  }

  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2);

  // 繪製三張左右串接的背景圖片（左 i=-1、中 i=0、右 i=1）
  if (bgImage) {
    push();
    imageMode(CORNER);
    for (let i = -1; i <= 1; i++) {
      const drawX = Math.round(bgOffsetX + i * singleBgWidth);
      image(bgImage, drawX, 0, singleBgWidth, singleBgHeight);
    }
    pop();
  }

  // 角色 2 位於最左側背景圖（i = -1）的中間
  const leftBgX = bgOffsetX - singleBgWidth;
  const character2X = leftBgX + singleBgWidth / 2;

  // 使用雙門檻避免角色 1 在邊界附近時狀態反覆跳動
  const distToC2 = abs(characterX - character2X);
  const enterThreshold = max(150, singleBgWidth * 0.14);
  const exitThreshold = enterThreshold + 45;

  const nextAttackState = c2IsAttacking
    ? distToC2 <= exitThreshold
    : distToC2 < enterThreshold;

  if (nextAttackState !== c2IsAttacking) {
    c2IsAttacking = nextAttackState;
    c2AnimStartFrame = frameCount;

    if (c2IsAttacking) {
      generateAdditionQuestion();
    } else {
      currentQuestion = null;
      quizFeedbackText = "";
    }
  }

  const c2Sprite = c2IsAttacking && c2AttackSprite ? c2AttackSprite : c2StopSprite;
  const c2FrameCount = c2IsAttacking ? c2AttackFrameCount : c2StopFrameCount;
  const c2FrameWidth = c2IsAttacking ? c2AttackFrameWidth : c2StopFrameWidth;
  const c2FrameHeight = c2IsAttacking ? c2AttackFrameHeight : c2StopFrameHeight;

  if (c2Sprite && c2Sprite.width > 0 && c2Sprite.height > 0) {
    const c2Scale = (height / 3) / c2FrameHeight;
    const c2ActiveWidth = c2FrameWidth * c2Scale;
    const c2ActiveHeight = c2FrameHeight * c2Scale;
    const c2Y = height - c2ActiveHeight / 2;

    const c2ElapsedFrames = max(0, frameCount - c2AnimStartFrame);
    const c2FrameIndex = floor(c2ElapsedFrames / framesPerStep) % c2FrameCount;

    const rawSourceX = c2FrameIndex * c2FrameWidth;
    const safeSourceX = min(c2Sprite.width - 1, max(0, rawSourceX));
    const safeSourceW = min(c2FrameWidth, c2Sprite.width - safeSourceX);

    // 角色 1 在角色 2 左邊時轉向
    const c2Facing = characterX < character2X ? -1 : 1;

    push();
    translate(Math.round(character2X), Math.round(c2Y));
    scale(c2Facing, 1);
    image(
      c2Sprite,
      0,
      0,
      c2ActiveWidth,
      c2ActiveHeight,
      safeSourceX,
      0,
      safeSourceW,
      c2FrameHeight
    );
    pop();
  }

  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) {
    isCasting = false;
    activeEffects.push({
      x: characterX + (magicDirection * characterWidth) / 2,
      y: height - characterHeight * 0.58,
      direction: magicDirection
    });
  }

  const activeSprite = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite;
  const activeFrameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite;
  const activeFrameWidth = isCasting ? magicFrameWidth : isWalking ? walkFrameWidth : frameWidth;
  const activeFrameHeight = isCasting ? magicFrameHeight : isWalking ? walkFrameHeight : frameHeight;
  const elapsedMagicFrames = frameCount - magicStartFrame;
  const frameIndex = isCasting
    ? floor(elapsedMagicFrames / framesPerStep)
    : floor(frameCount / framesPerStep) % activeFrameCount;
  const sourceX = frameIndex * activeFrameWidth;
  const activeWidth = activeFrameWidth * characterScale;
  const activeHeight = activeFrameHeight * characterScale;
  const characterY = height - activeHeight / 2;

  if (activeSprite && activeSprite.width > 0 && activeSprite.height > 0) {
    push();
    translate(characterX, characterY);
    scale(isCasting ? magicDirection : facingDirection, 1);
    image(
      activeSprite,
      0,
      0,
      activeWidth,
      activeHeight,
      sourceX,
      0,
      activeFrameWidth,
      activeFrameHeight
    );
    pop();
  }

  const effectScale = characterScale;
  const effectWidth = effectFrameWidth * effectScale;
  const effectHeight = effectFrameHeight * effectScale;
  const effectSpeed = max(6, width * 0.008);
  for (let effectIndex = activeEffects.length - 1; effectIndex >= 0; effectIndex--) {
    const effect = activeEffects[effectIndex];
    effect.x += effect.direction * effectSpeed;
    if (effect.x > width || effect.x < 0) {
      activeEffects.splice(effectIndex, 1);
      continue;
    }
    const effectFrameIndex = floor(frameCount / framesPerStep) % effectFrameCount;
    if (magicEffectSprite && magicEffectSprite.width > 0 && magicEffectSprite.height > 0) {
      push();
      translate(effect.x, effect.y);
      scale(effect.direction, 1);
      image(
        magicEffectSprite,
        0,
        0,
        effectWidth,
        effectHeight,
        effectFrameIndex * effectFrameWidth,
        0,
        effectFrameWidth,
        effectFrameHeight
      );
      pop();
    }
  }

  // 繪製上方黃色題目方框與三秒答對／答錯特效
  drawQuizBox();
  drawFireworksEffect();
  drawLightningEffect();
}

function mousePressed() {
  if (!c2IsAttacking || !currentQuestion || hasAnsweredCurrentEncounter) return;

  for (const btn of quizButtons) {
    if (
      mouseX >= btn.x &&
      mouseX <= btn.x + btn.w &&
      mouseY >= btn.y &&
      mouseY <= btn.y + btn.h
    ) {
      hasAnsweredCurrentEncounter = true;
      currentQuestion.selectedIndex = btn.index;
      const correct = btn.value === currentQuestion.answer;
      currentQuestion.isCorrect = correct;

      if (correct) {
        quizFeedbackText = "答對了！放煙火慶祝！";
        triggerFireworks();
      } else {
        quizFeedbackText = `答錯了！正確答案是 ${currentQuestion.answer}`;
        triggerLightning();
      }
      break;
    }
  }
}

function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    isWalking = true;
    facingDirection = 1;
    return false;
  }
  if (keyCode === LEFT_ARROW) {
    isWalking = true;
    facingDirection = -1;
    return false;
  }
  if (keyCode === 32) {
    if (!spaceIsDown && !isCasting) {
      isCasting = true;
      magicStartFrame = frameCount;
      magicDirection = facingDirection;
    }
    spaceIsDown = true;
    return false;
  }
}

function keyReleased() {
  if (keyCode === 32) {
    spaceIsDown = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  characterX = constrain(characterX, 1, width - 1);
}