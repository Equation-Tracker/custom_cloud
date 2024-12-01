document.getElementById("b").addEventListener("click", async (e) => {
    e.preventDefault();
    const file = document.getElementById("f").files[0];
    console.log(file);
    const form = new FormData();
    form.append("file", file);
    form.append("filePath", "users");
    setTimeout(() => console.log(form), 500);
    const res = await fetch("http://localhost:4000/upload", {
        method: "POST",
        body: form,
        headers: {
            filePath: "",
        },
    });
    const data = await res.json();
    console.log(data);
});
// const res = await fetch("http://localhost:4000/download/Myfile.jpg", {
//     method: "POST",
//     headers: {
//         "Content-Type": "application/json"
//     },
//     body: JSON.stringify({ token: "15ffa8cb-7cc9-47f7-90a2-d0a4f8c2d469" })
// });
// const blob = await res.blob();
// const url = URL.createObjectURL(blob);
// const a = document.createElement("a");
// a.href = url;
// a.download = "Myfile.jpg";
// document.body.appendChild(a);
// a.click();
// document.body.removeChild(a);
const res = await fetch("http://localhost:4000/listFiles", {
    method: "POST",
});
const allFiles = document.getElementById("allFiles");
if (res.status === 404) {
    allFiles.innerHTML = "<span style='color: red;'>No file exists</span>";
}
(await res.json()).files?.forEach((file) => {
    const li = document.createElement("li");
    li.innerHTML =
        file.type === "file"
            ? file.fileName
            : `<span style="color: blue;">${file.name}</span>`;
    if (file.type === "directory") {
        li.addEventListener("click", () => getFile(`${file.name}`));
    }
    else {
        li.addEventListener("click", () => getURL(`${file.name}`))
    }
    li.oncontextmenu = async event => {
        event.preventDefault();
        if (confirm("Do you want to delete this file?")) {
            const res = await fetch("http://localhost:4000/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ path: `${file.name}` })
            });
            alert((await res.json()).message);
        }
    }
    allFiles.appendChild(li);
});

async function getFile(filePath) {
    const res = await fetch("http://localhost:4000/listFiles/" + filePath, {
        method: "POST",
    });
    (await res.json()).files?.forEach((file) => {
        const li = document.createElement("li");
        li.innerHTML =
            file.type === "file"
                ? filePath + "/" + file.fileName
                : `<span style="color: blue;">${filePath + "/" + file.name}</span>`;
        if (file.type === "directory") {
            li.addEventListener("click", () => getFile(`${filePath}/${file.name}`));
        }
        else {
            li.addEventListener("click", () => getURL(`${filePath}/${file.name}`))
        }
        li.oncontextmenu = async event => {
            event.preventDefault();
            if (confirm("Do you want to delete this file?")) {
                const res = await fetch("http://localhost:4000/delete", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ path: `${filePath}/${file.name}` })
                });
                alert((await res.json()).message);
            }
        }
        allFiles.appendChild(li);
    });
}

async function getURL(filePath) {
    const res = await fetch("http://localhost:4000/getToken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath }),
    });
    const { url, downloadURL, token } = await res.json();
    window.open(url, "_blank");
}
