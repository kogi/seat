const addBtn = document.getElementById("add-button");
const clearBtn = document.getElementById("clear-button");
const seatInput = document.getElementById("seat-input");
const myclassroom = document.getElementById("classroom");
const createBtn = document.getElementById("create-button");

let isSpecific = false;

let position = [];
let specificSeat = [];

myclassroom.addEventListener("click", (e) => {
    console.log(e.target);
    const ele = e.target;
    if (ele.name === "seat-div") {
        modeToSpecific(ele);
    } else if (ele.name === "seat") {
        modeToSpecific(ele.parentElement);
    }
});

function modeToSpecific(ele) {
    console.log(ele.className);
    if (ele.className.includes("spe")) {
        specificSeat.splice(specificSeat.indexOf(parseInt(ele.id * 1 + 1)), 1);
        ele.classList.remove("spe");
    } else {
        specificSeat.push(parseInt(ele.id * 1 + 1));
        ele.classList.add("spe");
    }
}

addBtn.addEventListener("click", (e) => {
    if (!(seatInput.value >= 1)) {
        return false;
    }
    position.push(parseInt(seatInput.value));
    generateRow(position, specificSeat);
});

clearBtn.addEventListener("click", (e) => {
    position = [];
    generateRow(position, specificSeat);
});

seatInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        addBtn.click();
    }
});

createBtn.addEventListener("click", (e) => {
    createClassroom(position);
});

function generateRow(position, specificSeat) {
    console.log(specificSeat);
    const max = getMax(position);
    let seatStyle;
    let fontSize;
    let seatWidth = (window.innerWidth - (max - 1) * 10) / max;
    let seatHeight = (window.innerHeight * 0.6 - (position.length - 1) * 10) / position.length;
    if (seatWidth > window.innerHeight * 0.168) {
        seatWidth = window.innerHeight * 0.168;
    }

    if (seatHeight * 1.68 > seatWidth) {
        fontSize = seatWidth / 2;
        seatStyle = "width:" + seatWidth + "px";
    } else {
        fontSize = seatHeight / 2;
        seatStyle = "height:" + seatHeight + "px";
    }
    console.log(seatStyle);
    let currentIndex = 0;
    myclassroom.innerHTML = "";
    for (let j = 0; j < position.length; j++) {
        let rowDiv = document.createElement("div");
        rowDiv.className = "seat-row";
        for (let i = 0; i < position[j]; i++) {
            let div = document.createElement("div");
            div.className = "seat";
            if (specificSeat.includes(currentIndex)) {
                div.classList.add("spe");
            }
            div.id = String(currentIndex);
            div.id = currentIndex;
            div.style = seatStyle;
            div.name = "seat-div";
            let p = document.createElement("p");
            p.innerHTML = currentIndex + 1;
            p.style.fontSize = fontSize + "px";
            p.name = "seat";
            div.appendChild(p);
            rowDiv.appendChild(div);
            currentIndex++;
        }

        myclassroom.appendChild(rowDiv);
    }
}

function createClassroom(p) {
    let seatlength = 0;
    for (let i = 0; i < p.length; i++) {
        seatlength += p[i];
    }
    if (seatlength < 1 || seatlength % 1 != 0) {
        console.log("error");
        return;
    }
    fetch("/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            seatlength: parseInt(seatlength),
            position: position,
            specificSeat: specificSeat,
        }),
    })
        .then((res) => {
            if (!res.ok) {
                throw new Error(res.statusText);
            }
            return res.json();
        })
        .then((data) => {
            showCode(data.message);
        })
        .catch((err) => {
            console.log(err);
        });
}

function getMax(array) {
    let temp = 0;
    for (i in array) {
        if (temp < array[i]) {
            temp = array[i];
        }
    }
    return temp;
}

function showCode(c) {
    const create = document.getElementById("create");
    const code = document.getElementById("code");
    const codeText = document.getElementById("code-text");
    codeText.innerHTML = c;
    create.style.opacity = "0";
    create.style.height = "15vh";
    setTimeout(() => {
        history.replaceState({}, "", "./?code=" + c);
        create.style.display = "none";
        code.style = "";
        getResult(c);
    }, 300);
}

function getResult(c) {
    fetch(`/classroom/${c}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((res) => {
            if (!res.ok) {
                throw new Error(res.statusText);
            }

            return res.json();
        })
        .then((data) => {
            if (data.error) {
                console.log(data.error);
                return;
            } else {
                console.log(data.result);
                showResult(data.result, c);
            }
        });
}

function showResult(r, c) {
    for (let i = 0; i < r.length; i++) {
        if (r[i] != 0) {
            const seat = document.getElementById(String(r[i] - 1));
            seat.getElementsByTagName("p")[0].innerHTML = "No." + (i + 1);
            seat.classList.add("in");
        }
    }
    setTimeout(() => {
        getResult(c);
    }, 500);
}

window.addEventListener("load", (e) => {
    const search = new URLSearchParams(location.search);
    if (search.get("code")) {
        fetch(`/classroom/${search.get("code")}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(res.statusText);
                }

                return res.json();
            })
            .then((data) => {
                console.log(data);
                console.log(`/classroom/${search.get("code")}`);
                if (data.error) {
                    location.href = "/";
                    return;
                } else {
                    generateRow(data.position, data.specificSeat);
                    showCode(search.get("code"));
                }
            });
    }
});

document.getElementsByClassName("title")[0].addEventListener("click", () => {
    location.href = "/";
});
