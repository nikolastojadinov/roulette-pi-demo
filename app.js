let balance = 100.00;
let totalBet = 0.00;

const balanceEl = document.getElementById("balance");
const totalBetEl = document.getElementById("totalBet");
const numbersGrid = document.getElementById("numbersGrid");
const spinBtn = document.getElementById("spin");
const wheel = document.getElementById("wheel");
const ctx = wheel.getContext("2d");

const numbers = [
    { num: 0, color: "green" },
    { num: 32, color: "red" }, { num: 15, color: "black" },
    { num: 19, color: "red" }, { num: 4, color: "black" },
    { num: 21, color: "red" }, { num: 2, color: "black" },
    { num: 25, color: "red" }, { num: 17, color: "black" },
    { num: 34, color: "red" }, { num: 6, color: "black" },
    { num: 27, color: "red" }, { num: 13, color: "black" },
    { num: 36, color: "red" }, { num: 11, color: "black" },
    { num: 30, color: "red" }, { num: 8, color: "black" },
    { num: 23, color: "red" }, { num: 10, color: "black" },
    { num: 5, color: "red" }, { num: 24, color: "black" },
    { num: 16, color: "red" }, { num: 33, color: "black" },
    { num: 1, color: "red" }, { num: 20, color: "black" },
    { num: 14, color: "red" }, { num: 31, color: "black" },
    { num: 9, color: "red" }, { num: 22, color: "black" },
    { num: 18, color: "red" }, { num: 29, color: "black" },
    { num: 7, color: "red" }, { num: 28, color: "black" }
];

// Generiši grid brojeva
numbers.forEach(n => {
    const btn = document.createElement("button");
    btn.innerText = n.num;
    btn.classList.add(n.color);
    btn.onclick = () => placeBet(1);
    numbersGrid.appendChild(btn);
});

function placeBet(amount) {
    totalBet += amount;
    totalBetEl.innerText = totalBet.toFixed(2);
}

function drawWheel() {
    const radius = wheel.width / 2;
    const step = (2 * Math.PI) / numbers.length;

    numbers.forEach((n, i) => {
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, i * step, (i + 1) * step);
        ctx.fillStyle = n.color;
        ctx.fill();
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(i * step + step / 2);
        ctx.textAlign = "center";
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText(n.num, radius - 30, 5);
        ctx.restore();
    });
}

drawWheel();

spinBtn.onclick = () => {
    const result = numbers[Math.floor(Math.random() * numbers.length)];
    alert("Ball landed on " + result.num + " (" + result.color + ")");
    balance -= totalBet;
    balanceEl.innerText = balance.toFixed(2);
    totalBet = 0;
    totalBetEl.innerText = totalBet.toFixed(2);
};
