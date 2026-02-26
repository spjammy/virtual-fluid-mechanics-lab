const maxPoints = 10;
let currentCount = 1;
let positions = Array.from({length: maxPoints}, () => ({x: 0}));
let flowSpeed = 1;

for (let frame = 0; frame < 5; frame++) {
    currentCount++;
    for (let i = 0; i < currentCount && i < maxPoints; i++) {
        positions[i].x += flowSpeed;
    }
    console.log(`Frame ${frame}, positions:`, positions.slice(0, 3).map(p => p.x));
    
    let p1 = positions[0];
    let p2 = positions[1];
    console.log(`p2.x < p1.x: ${p2.x < p1.x}`);
}
