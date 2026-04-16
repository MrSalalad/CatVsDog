// --- Toàn cục (Globals) ---
let imgs = {};
let snds = {};
let bgs = [];
let foodsArr = [], chilisArr = [], cactiArr = [];

let gameState = 'MENU';
let level = 1;
let soundEnabled = true;

let cat, dog, mouse;
let dogDebuffMult = 1.0;

// DOM Elements
let mainMenu, winScreen, loseScreen, playBtn, restartBtn, nextLevelBtn, soundToggle;
let cdDashUI, cdSlapUI, cdGrowlUI;

function preload() {
    imgs.cat = loadImage('assets/images/entities/cat.png');
    imgs.dog = loadImage('assets/images/entities/dog.png');
    imgs.mouse = loadImage('assets/images/entities/mouse.png');
    imgs.food = [
        loadImage('assets/images/foods/meat.png'), 
        loadImage('assets/images/foods/orange.png'), 
        loadImage('assets/images/foods/egg.png')
    ];
    imgs.chili = loadImage('assets/images/debuffs/chili.png');
    imgs.cactus = loadImage('assets/images/debuffs/cactus.png');
    imgs.heart = loadImage('assets/images/heart.png');

    imgs.catHit = loadImage('assets/images/debuffs/cat_hit.png');
    imgs.dogHit = loadImage('assets/images/debuffs/dog_hit.png');
    imgs.mouseHit = loadImage('assets/images/debuffs/mouse_hit.png');

    imgs.skillDash = loadImage('assets/images/skills/skill_dash.png');
    imgs.skillSlap = loadImage('assets/images/skills/skill_slap.png');
    imgs.skillGrowl = loadImage('assets/images/skills/skill_growl.png');
    
    imgs.skillSlapEffect = loadImage('assets/images/skills/slap_effect.png');
    imgs.skillGrowlEffect = loadImage('assets/images/skills/growl_effect.png');

    bgs.push(loadImage('assets/images/backgrounds/bg1.png'));
    bgs.push(loadImage('assets/images/backgrounds/bg2.png'));
    bgs.push(loadImage('assets/images/backgrounds/bg3.png'));

    soundFormats('mp3', 'wav');
    snds.bgm = loadSound('assets/audio/bgm.wav');
    snds.catHit = loadSound('assets/audio/cat_hit.wav');
    snds.dogHit = loadSound('assets/audio/dog_hit.wav');
    snds.mouseHit = loadSound('assets/audio/mouse_hit.wav');
    snds.catDash = loadSound('assets/audio/cat_dash.wav');
    snds.catSlap = loadSound('assets/audio/cat_slap.wav');
    snds.dogGrowl = loadSound('assets/audio/dog_growl.wav');
    snds.win = loadSound('assets/audio/win.wav');
    snds.lose = loadSound('assets/audio/lose.wav');
}

function setup() {
    let cvs = createCanvas(1024, 768);
    cvs.parent('gameContainer');

    snds.bgm.setVolume(0.2);
    snds.catHit.setVolume(0.8);
    snds.dogHit.setVolume(0.8);
    snds.mouseHit.setVolume(0.8);
    snds.catDash.setVolume(0.5);
    snds.catSlap.setVolume(0.6);
    snds.dogGrowl.setVolume(0.6);
    snds.win.setVolume(1.0);
    snds.lose.setVolume(1.0);

    snds.bgm.loop();

    cdDashUI = document.getElementById('cdDash');
    cdSlapUI = document.getElementById('cdSlap');
    cdGrowlUI = document.getElementById('cdGrowl');

    mainMenu = document.getElementById('mainMenu');
    winScreen = document.getElementById('winScreen');
    loseScreen = document.getElementById('loseScreen');
    soundToggle = document.getElementById('soundToggle');

    document.getElementById('playBtn').src = 'assets/images/btns/btn_play.png';
    document.getElementById('nextLevelBtn').src = 'assets/images/btns/btn_continue.png';
    document.getElementById('nextLevelBtn').style.height = '350px';
    document.getElementById('restartBtn').src = 'assets/images/btns/btn_restart.png';
    document.getElementById('iconDash').src = 'assets/images/skills/skill_dash.png';
    document.getElementById('iconSlap').src = 'assets/images/skills/skill_slap.png';
    document.getElementById('iconGrowl').src = 'assets/images/skills/skill_growl.png';
    soundToggle.src = 'assets/images/btns/sound_off.png';
    
    mainMenu.style.backgroundImage = "url('assets/images/backgrounds/bg_main.png')";
    winScreen.style.backgroundImage = "url('assets/images/backgrounds/bg_win.png')";
    loseScreen.style.backgroundImage = "url('assets/images/backgrounds/bg_lose.png')";

    document.getElementById('playBtn').onclick = () => {
        mainMenu.classList.remove('active'); mainMenu.classList.add('hidden');
        level = 1;
        initLevel();
        gameState = 'PLAYING';
        if (soundEnabled && getAudioContext().state !== 'running') getAudioContext().resume();
    };

    document.getElementById('nextLevelBtn').onclick = () => {
        winScreen.classList.remove('active'); winScreen.classList.add('hidden');
        
        if (level >= 3) {
            level = 1;
            gameState = 'MENU';
            mainMenu.classList.remove('hidden'); mainMenu.classList.add('active');
        } else {
            level++; 
            initLevel(); 
            gameState = 'PLAYING';
        }
    };

    document.getElementById('restartBtn').onclick = () => {
        loseScreen.classList.remove('active'); loseScreen.classList.add('hidden');
        level = 1; initLevel(); gameState = 'PLAYING';
    };

    soundToggle.onclick = () => {
        soundEnabled = !soundEnabled;
        soundToggle.src = soundEnabled ? 'assets/images/btns/sound_off.png' : 'assets/images/btns/sound_on.png';
        if(soundEnabled) {
            outputVolume(1);
            if(getAudioContext().state !== 'running') getAudioContext().resume();
        } else {
            outputVolume(0);
        }
    };
}

function spawnItem(arr, r, imgData) {
    let img = Array.isArray(imgData) ? random(imgData) : imgData;
    arr.push({ x: random(20, width-40), y: random(20, height-40), radius: r, img: img });
}

// --- THÔNG SỐ CÁC LEVEL ---
function initLevel() {
    cat = { x: width/2, y: height/2, radius: 20, speed: 4, angle: 0, lives: 3, score: 0, dashCooldown: 0, slapCooldown: 0, slapTimer: 0, stunTimer: 0, slowTimer: 0 };
    mouse = { x: 100, y: 100, radius: 15, speed: 3.5, angle: 0, stunTimer: 0 };

    let baseDogSpeed = 3.5;
    let foodCount, chiliCount, cactusCount;

    if (level === 1) {
        // Level 1: Tỉ lệ 1:0.5, Tốc độ chó * 1.0
        dog = { x: 900, y: 600, radius: 30, speed: baseDogSpeed * 1.0, dx: baseDogSpeed * 1.0, dy: baseDogSpeed * 1.0, angle: 0, stunTimer: 0, growlCooldown: 0, auraTimer: 0, slowTimer: 0 };
        foodCount = 8; chiliCount = 2; cactusCount = 2;
        dogDebuffMult = 1.0; // Level 1: Chịu 100% thời gian debuff
    } else if (level === 2) {
        // Level 2: Tỉ lệ 0.7:1, Tốc độ chó * 1.2
        dog = { x: 900, y: 600, radius: 30, speed: baseDogSpeed * 1.2, dx: baseDogSpeed * 1.2, dy: baseDogSpeed * 1.2, angle: 0, stunTimer: 0, growlCooldown: 0, auraTimer: 0, slowTimer: 0 };
        foodCount = 5; chiliCount = 4; cactusCount = 3;
        dogDebuffMult = 0.7; // Level 2: Chịu 70% thời gian
    } else if (level >= 3) {
        // Level 3: Tỉ lệ 0.5:1.2, Tốc độ chó * 1.5
        dog = { x: 900, y: 600, radius: 30, speed: baseDogSpeed * 1.5, dx: baseDogSpeed * 1.5, dy: baseDogSpeed * 1.5, angle: 0, stunTimer: 0, growlCooldown: 0, auraTimer: 0, slowTimer: 0 };
        foodCount = 3; chiliCount = 6; cactusCount = 5;
        dogDebuffMult = 0.4; // Level 3: Chịu 40% thời gian
    }

    foodsArr = []; chilisArr = []; cactiArr = [];
    for(let i=0; i<foodCount; i++) spawnItem(foodsArr, 12, imgs.food);
    for(let i=0; i<chiliCount; i++) spawnItem(chilisArr, 15, imgs.chili);
    for(let i=0; i<cactusCount; i++) spawnItem(cactiArr, 15, imgs.cactus);
}

function playSnd(snd) {
    if (soundEnabled) snd.play();
}

function draw() {
    background(44, 62, 80);
    let bg = bgs[(level-1) % bgs.length];
    if (bg) {
        imageMode(CORNER);
        image(bg, 0, 0, width, height);
    }

    if(gameState !== 'PLAYING') return;

    let dt = deltaTime;

    // --- TIMERS ---
    cat.dashCooldown = max(0, cat.dashCooldown - dt);
    cat.slapCooldown = max(0, cat.slapCooldown - dt);
    cat.slapTimer = max(0, cat.slapTimer - dt);
    cat.stunTimer = max(0, cat.stunTimer - dt);
    cat.slowTimer = max(0, cat.slowTimer - dt);

    dog.growlCooldown = max(0, dog.growlCooldown - dt);
    dog.auraTimer = max(0, dog.auraTimer - dt);
    dog.stunTimer = max(0, dog.stunTimer - dt);
    dog.slowTimer = max(0, dog.slowTimer - dt);

    mouse.stunTimer = max(0, mouse.stunTimer - dt);

    // --- UI LABEL ---
    cdDashUI.innerText = cat.dashCooldown > 0 ? ceil(cat.dashCooldown/1000) : 'J';
    cdSlapUI.innerText = cat.slapCooldown > 0 ? ceil(cat.slapCooldown/1000) : 'K';
    cdGrowlUI.innerText = dog.growlCooldown > 0 ? ceil(dog.growlCooldown/1000) : 'AUTO';

    // --- SKILLS INPUT ---
    if (keyIsDown(74) /* J */ && cat.dashCooldown <= 0 && cat.stunTimer <= 0) {
        cat.x -= cos(cat.angle) * 150;
        cat.y -= sin(cat.angle) * 150;
        cat.dashCooldown = 20000;
        playSnd(snds.catDash);
    }

    if (keyIsDown(75) /* K */ && cat.slapCooldown <= 0 && cat.stunTimer <= 0) {
        cat.slapTimer = 250;
        cat.slapCooldown = 25000;
        playSnd(snds.catSlap);

        let fx = cat.x + cos(cat.angle) * 50;
        let fy = cat.y + sin(cat.angle) * 50;
        let slapR = 60;

        if (dist(fx, fy, dog.x, dog.y) < dog.radius + slapR) { 
            dog.stunTimer = 3000 * dogDebuffMult; 
            playSnd(snds.dogHit); 
        }
        if (dist(fx, fy, mouse.x, mouse.y) < mouse.radius + slapR) { 
            mouse.stunTimer = 3000; 
            playSnd(snds.mouseHit); 
        }
    }

    if (dog.growlCooldown <= 0 && dist(dog.x, dog.y, cat.x, cat.y) < 200 && dog.stunTimer <= 0) {
        dog.auraTimer = 5000;
        dog.growlCooldown = 25000;
        playSnd(snds.dogGrowl);
    }

    // --- TÍNH TOÁN SPEED ---
    let cSpd = cat.speed;
    if (cat.slowTimer > 0) cSpd /= 2;
    if (dog.auraTimer > 0 && dist(cat.x, cat.y, dog.x, dog.y) < 250) cSpd /= 2;

    let dSpd = dog.speed;
    if (dog.slowTimer > 0) dSpd /= 2;

    let mSpd = dog.auraTimer > 0 && dist(mouse.x, mouse.y, dog.x, dog.y) < 250 ? mouse.speed/2 : mouse.speed;

    // --- CHUYỂN ĐỘNG ---
    if (cat.stunTimer <= 0) {
        let dx = 0, dy = 0;
        if (keyIsDown(UP_ARROW) || keyIsDown(87)) dy -= cSpd;
        if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) dy += cSpd;
        if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) dx -= cSpd;
        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) dx += cSpd;
        cat.x += dx; cat.y += dy;
        if (dx !== 0 || dy !== 0) cat.angle = atan2(dy, dx);
        cat.x = constrain(cat.x, cat.radius, width - cat.radius);
        cat.y = constrain(cat.y, cat.radius, height - cat.radius);
    }

    // --- CHUYỂN ĐỘNG CỦA CHUỘT ---
    if (mouse.stunTimer <= 0) {
        let distCat = dist(cat.x, cat.y, mouse.x, mouse.y);
        let distDog = dist(dog.x, dog.y, mouse.x, mouse.y);
        let threat = null;

        if (distCat < 250 && distDog < 250) {
            threat = distCat < distDog ? cat : dog;
        } else if (distCat < 250) {
            threat = threat = cat;
        } else if (distDog < 250) {
            threat = dog;
        }

        if (threat) {
            let mDx = 0, mDy = 0;
            
            if (threat.x < mouse.x) mDx = mSpd;
            if (threat.x > mouse.x) mDx = -mSpd;
            if (threat.y < mouse.y) mDy = mSpd;
            if (threat.y > mouse.y) mDy = -mSpd;
            
            mouse.x += mDx; 
            mouse.y += mDy;
            
            if (mDx !== 0 || mDy !== 0) mouse.angle = atan2(mDy, mDx);

            if(mouse.x <= mouse.radius || mouse.x >= width - mouse.radius) mouse.x -= mDx*2;
            if(mouse.y <= mouse.radius || mouse.y >= height - mouse.radius) mouse.y -= mDy*2;
        }
    }

    if (dog.stunTimer <= 0) {
        let ratio = dSpd / dog.speed;
        dog.x += dog.dx * ratio;
        dog.y += dog.dy * ratio;
        
        if (dog.x - dog.radius < 0) {
            dog.x = dog.radius;
            dog.dx *= -1;                
        } else if (dog.x + dog.radius > width) {
            dog.x = width - dog.radius;
            dog.dx *= -1;
        }

        if (dog.y - dog.radius < 0) {
            dog.y = dog.radius;
            dog.dy *= -1;
        } else if (dog.y + dog.radius > height) {
            dog.y = height - dog.radius;
            dog.dy *= -1;
        }

        dog.angle = atan2(dog.dy, dog.dx);
    }

    // --- ĂN UỐNG & DEBUFF ---
    function handleEating(ent) {
        if (dist(ent.x, ent.y, mouse.x, mouse.y) < ent.radius + mouse.radius) {
            ent.radius = min(150, ent.radius + 10);
            if (ent === cat) { cat.score += 50; playSnd(snds.mouseHit); } 
            mouse.x = random(width); mouse.y = random(height);
        }
        for (let f of foodsArr) {
            if (dist(ent.x, ent.y, f.x, f.y) < ent.radius + f.radius) {
                ent.radius = min(150, ent.radius + 3);
                if (ent === cat) cat.score += 10;
                f.x = random(width); f.y = random(height);
                f.img = random(imgs.food);
            }
        }
        for (let c of chilisArr) {
            if (dist(ent.x, ent.y, c.x, c.y) < ent.radius + c.radius) {
                ent.slowTimer = (ent === dog) ? 4000 * dogDebuffMult : 4000;
                
                if (ent === cat) playSnd(snds.catHit);
                if (ent === dog) playSnd(snds.dogHit);
                c.x = random(width); c.y = random(height);
            }
        }
        for (let c of cactiArr) {
            if (dist(ent.x, ent.y, c.x, c.y) < ent.radius + c.radius) {
                ent.stunTimer = (ent === dog) ? 3000 * dogDebuffMult : 3000;
                
                if (ent === cat) playSnd(snds.catHit);
                if (ent === dog) playSnd(snds.dogHit);
                c.x = random(width); c.y = random(height);
            }
        }
    }

    handleEating(cat);
    handleEating(dog);

    // --- MÈO CHẠM CHÓ ---
    if (dist(cat.x, cat.y, dog.x, dog.y) < cat.radius + dog.radius) {
        if (cat.radius > dog.radius) {
            playSnd(snds.win);
            gameState = 'WIN';
            
            // Cập nhật text chiến thắng dựa trên level hiện tại
            let winTitle = document.querySelector('#winScreen h1');
            if (winTitle) {
                if (level >= 3) {
                    winTitle.innerText = "YOU BEAT THE GAME!";
                } else {
                    winTitle.innerText = "LEVEL " + level + " CLEARED!";
                }
            }

            winScreen.classList.remove('hidden'); winScreen.classList.add('active');
        } else {
            cat.lives--;
            playSnd(snds.catHit);
            dog.x = random(width); dog.y = random(height);
            if (cat.lives <= 0) {
                playSnd(snds.lose);
                gameState = 'LOSE';
                loseScreen.classList.remove('hidden'); loseScreen.classList.add('active');
            }
        }
    }

    // --- RENDER HÌNH ẢNH MỌI THỨ ---
    let offset = -HALF_PI;

    function drawEntity(img, x, y, size, angle) {
        push();
        translate(x, y);
        rotate(angle);
        imageMode(CENTER);
        if (img) image(img, 0, 0, size, size);
        else { fill(128); circle(0,0,size); }
        pop();
    }

    for (let f of foodsArr) drawEntity(f.img, f.x, f.y, f.radius*2, 0); 
    for (let c of chilisArr) drawEntity(c.img, c.x, c.y, c.radius*2, 0);
    for (let c of cactiArr) drawEntity(c.img, c.x, c.y, c.radius*2, 0);

    // Chuột
    let mImg = mouse.stunTimer > 0 ? imgs.mouseHit : imgs.mouse;
    drawEntity(mImg, mouse.x, mouse.y, mouse.radius*2, mouse.angle + offset);
    if (mouse.stunTimer > 0) { fill('yellow'); textAlign(CENTER); textSize(16); text('STUNNED', mouse.x, mouse.y-30); }

    // Chó
    if (dog.auraTimer > 0) {
        fill(142, 68, 173, 50); noStroke();
        circle(dog.x, dog.y, 500);

        push();
        
        let distanceBehind = dog.radius + 30; 
        
        translate(dog.x - cos(dog.angle) * distanceBehind, dog.y - sin(dog.angle) * distanceBehind);
        
        rotate(dog.angle + offset); 
        imageMode(CENTER);
        image(imgs.skillGrowlEffect, 0, 0, dog.radius*2, dog.radius*2);
        pop();
    }

    let dImg = (dog.slowTimer > 0 || dog.stunTimer > 0) ? imgs.dogHit : imgs.dog;
    drawEntity(dImg, dog.x, dog.y, dog.radius*2, dog.angle + offset);
    
    if (dog.slowTimer > 0) { fill('orange'); textAlign(CENTER); text('SLOWED', dog.x, dog.y-3); }
    if (dog.stunTimer > 0) { fill('yellow'); textAlign(CENTER); text('STUNNED', dog.x, dog.y-50); }

    // Mèo
    let cImg = (cat.slowTimer > 0 || cat.stunTimer > 0) ? imgs.catHit : imgs.cat;
    drawEntity(cImg, cat.x, cat.y, cat.radius*2, cat.angle + offset);

    if (cat.slapTimer > 0) {
        let fx = cat.x + cos(cat.angle) * 50;
        let fy = cat.y + sin(cat.angle) * 50;
        fill(241, 196, 15, 100); noStroke();
        circle(fx, fy, 120);

        push();
        translate(fx, fy);
        rotate(cat.angle + offset + radians(-45));
        imageMode(CENTER);
        image(imgs.skillSlapEffect, 0, 0, 70, 70);
        pop();
    }

    if (cat.slowTimer > 0) { fill('orange'); textAlign(CENTER); text('SLOWED', cat.x, cat.y-30); }
    if (cat.stunTimer > 0) { fill('yellow'); textAlign(CENTER); text('STUNNED', cat.x, cat.y-50); }

    // --- VẼ GIAO DIỆN CHÍNH TRÊN MÀN ---
    fill(255); textSize(24); textAlign(LEFT);
    text(`Level: ${level}  |  Score: ${cat.score}`, 20, 40);
    text(`Your Size: ${cat.radius.toFixed(0)}  |  Dog Size: ${dog.radius.toFixed(0)}`, 20, 70);

    for (let i=0; i<cat.lives; i++) {
        imageMode(CORNER);
        image(imgs.heart, 20 + (i*40), 90, 30, 30);
    }
}