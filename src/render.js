const { desktopCapturer, remote } = require("electron");

const { Menu, dialog } = remote

const { writeFile } = require("fs");

const videoViewport = document.getElementById("videoViewport");

const startButton = document.getElementById("startButton");
startButton.onclick = (e) => {
    mediaRecorder.start();
    startButton.classList.add("is-danger");
    startButton.innerText = "Recording";
};

const stopButton = document.getElementById("stopButton");
stopButton.onclick = (e) => {
    mediaRecorder.stop();
    stopButton.classList.remove("is-danger");
    stopButton.innerText = "Start";
};


const sourceSelectButton = document.getElementById("sourceSelect");
sourceSelectButton.onclick = getAvailableVideoSources;

const Language = {
    "zh-cn": {
        "startButton": "开始",
        "stopButton": "停止",
        "sourceSelect": "选择源",
        "saveDialogSaveButton": "保存视频",
    }
}

async function getAvailableVideoSources () {
    const inputSources = await desktopCapturer.getSources({
        types: ["window", "screen"]
    });

    const videoSourcesSelectorMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => {
                    selectSource(source)
                }
            }
        })
    );
    videoSourcesSelectorMenu.popup();
}

let mediaRecorder;
const streamChunk = [];


const recordOptions = {
    mimeType: "video/webm; codecs=vp9",
};

async function selectSource (source) {
    sourceSelectButton.innerText = source.name;

    const videoStreamConstraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: source.id,
            }
        }
    }

    const videoStream = await navigator.mediaDevices.getUserMedia(videoStreamConstraints);
    videoViewport.srcObject = videoStream;
    videoViewport.play();

    mediaRecorder = new MediaRecorder(videoStream, recordOptions);

    mediaRecorder.ondataavailable = handleDataAvailable
    mediaRecorder.onstop = handleStop
}

function handleDataAvailable (event) {
    streamChunk.push(event.data);
}

async function handleStop (event) {
    const blob = new Blob(streamChunk, recordOptions);

    const buffer = Buffer.from(await blob.arrayBuffer());
    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: Language["zh-cn"].saveDialogSaveButton,
        defaultPath: `video${Date.now()}.webm`
    });

    writeFile(filePath, buffer, (err) => {
        if (err) {
            console.error(err);
        }
    })
}