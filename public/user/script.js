const sendBtn = document.getElementById("send");
const partiBtn = document.getElementById("participate");
const student_number = document.getElementById("student-number");
const classcode = document.getElementById("classcode");
const errorElement = document.getElementById("error");
const modeChange = document.getElementById("mode");
const seatNum = document.getElementById("seat-number");

let code = -1;
let seatMode = "rand";

modeChange.addEventListener("click", (e) => {
    changeSeleted(e.target.name);
});

partiBtn.addEventListener("click", (e) => {
    if (classcode.value == "" || code != -1) {
        return false;
    }
    classcode.disabled = true;
    fetch(`/classroom/${classcode.value}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((res) => {
            if (!res.ok) {
                (errorElement.innerHTML = res.status), res.statusText;
                classcode.disabled = false;
                throw new Error(res.statusText);
            }

            return res.json();
        })
        .then((data) => {
            if (data.error) {
                errorElement.innerHTML = data.error;
                console.log(data.error);
                classcode.disabled = false;
                return;
            } else {
                console.log(data.result);
                code = classcode.value;
                nextStep();
            }
        });
});

sendBtn.addEventListener("click", (e) => {
    if (!(student_number.value >= 1) || code === -1 || e.isTrusted === false) {
        return false;
    }
    let specificSeatNum;
    if (seatMode === "rand") {
        specificSeatNum = -1;
    } else if (seatMode === "spe") {
        if (seatNum.value >= 1) {
            specificSeatNum = parseInt(seatNum.value);
        }
    }
    fetch(`/classroom/${code}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            student_number: student_number.value,
            specific_seat: specificSeatNum,
        }),
    })
        .then((res) => {
            if (!res.ok) {
                (errorElement.innerHTML = res.status), res.statusText;
                throw new Error(res.statusText);
            }
            return res.json();
        })
        .then((data) => {
            if (data.error) {
                errorElement.innerHTML = data.error;
                console.log(data.error);
                return;
            } else {
                showSeat(data.message, data.index);
            }
        });
});

const codeDiv = document.getElementById("code-input");
const numberDiv = document.getElementById("number-input");
const showDiv = document.getElementById("show");
const resultNum = document.getElementById("result");

function nextStep() {
    errorElement.innerHTML = "";
    codeDiv.style.opacity = 0;
    setTimeout(() => {
        codeDiv.style.display = "none";
        numberDiv.style.display = "";
        setTimeout(() => {
            numberDiv.style.opacity = 1;
        }, 100);
    }, 500);
}

function showSeat(n, i) {
    errorElement.innerHTML = "";
    resultNum.innerHTML = n;
    numberDiv.style.opacity = 0;
    setTimeout(() => {
        numberDiv.style.display = "none";
        showDiv.style.display = "";
        showDiv.style.opacity = 1;
        resultNum.style.scale = 0.0;
        setTimeout(() => {
            resultNum.style.scale = 1.2;
            setTimeout(() => {
                resultNum.style.scale = 1;
            }, 200);
        }, 200);
    }, 300);
}

const infoInput = document.getElementById("info-input");
const infoLabel = document.getElementById("info-label");
const speInput = document.getElementById("spe-input");

function changeSeleted(m) {
    seatMode = m;
    const mode = document.getElementsByClassName("mode-button");
    if (m === "rand") {
        if (!mode[0].classList.contains("selected")) {
            mode[0].classList.add("selected");
            mode[1].classList.remove("selected");
            infoInput.style.opacity = 0;
            sendBtn.style.opacity = 0;
            setTimeout(() => {
                speInput.style.opacity = 0;
                sendBtn.innerHTML = "抽選";
                sendBtn.style.opacity = 1;
                infoInput.style.opacity = 1;
            }, 500);
        }
    } else if (m === "spe") {
        if (!mode[1].classList.contains("selected")) {
            mode[1].classList.add("selected");
            mode[0].classList.remove("selected");
            infoInput.style.opacity = 0;
            sendBtn.style.opacity = 0;
            setTimeout(() => {
                speInput.style.opacity = 1;
                sendBtn.innerHTML = "指定";
                sendBtn.style.opacity = 1;
                infoInput.style.opacity = 1;
            }, 500);
        }
    }
}

document.getElementsByClassName("title")[0].addEventListener("click", () => {
    location.href = "/";
});

function debug() {
    classcode.value = "0000";
    partiBtn.click();
}

// debug();
