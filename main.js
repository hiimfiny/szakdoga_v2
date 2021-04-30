//Változó a WebSocket használatához
const  webSocket = new WebSocket("ws://127.0.0.1:3001")

let localStream
let pc
let roomid
let config = {
    iceServers: [
        {
            "urls": 
            ["stun:stun.l.google.com:19302", 
            "stun:stun1.l.google.com:19302", 
            "stun:stun2.l.google.com:19302"]
        }
    ]
}

navigator.getUserMedia = ( navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);
    
roomid=roomidGen()

function sendRoomId(){
    roomid = roomidGen()
    
    sendData({
        type: "store_room"
    })
}

function roomidGen(){
    let r = Math.random().toString(36).substring(6);
    console.log("random", r);
    document.getElementById("roomid-field").value=r
    return r
}

webSocket.onmessage  = (event) =>{
    handleSignalingData(JSON.parse(event.data))
}

function handleSignalingData(data){
    switch(data.type){
        case "answer":
            pc.setRemoteDescription(data.answer)
            break
        case "offer":
            pc.setRemoteDescription(data.offer)
            createAndSendAnswer()
            break    
        case "candidate":
            pc.addIceCandidate(data.candidate)
    }
}
function createAndSendAnswer(){
    pc.createAnswer((answer) =>{
        pc.setLocalDescription(answer)
        sendData({
            type: "send_answer",
            answer: answer
        })
    }, error =>{
        console.log(error)
    })
}

function sendData(data){
    data.roomid = roomid
    webSocket.send(JSON.stringify(data))
}

function startvideo(){
    document.getElementById("local-video").srcObject=navigator.getUserMedia({
        video: true,
        audio: true})
}
function startCall(){
    sendData({
        type: "store_room"
    })

    document.getElementById("video-call-div").style.display="inline"

    navigator.getUserMedia({
        video: true,
        audio: true
    }, (stream) =>{
        localStream=stream
        document.getElementById("local-video").srcObject = localStream

        pc  = new RTCPeerConnection(config)
        pc.addStream(localStream)

        pc.onaddstream = (e) => {
            document.getElementById("remote-video").srcObject=e.stream
        }
        pc.onicecandidate = ((e) => {
            if (e.candidate == null) return
            sendData({
                type: "store_candidate",
                candidate: e.candidate
            })
        })
        createAndSendOffer()

    }, (error) =>  {
        console.log(error)
    })

}
function joinCall(){
    roomid=document.getElementById("roomid-input").value
    document.getElementById("video-call-div").style.display="inline"

    navigator.getUserMedia({
        video: true,
        audio: true
    }, (stream) =>{
        localStream=stream
        document.getElementById("local-video").srcObject = localStream

        pc  = new RTCPeerConnection(config)
        pc.addStream(localStream)

        pc.onaddstream = (e) => {
            document.getElementById("remote-video").srcObject=e.stream
        }
        pc.onicecandidate = ((e) => {
            if (e.candidate == null) return
            sendData({
                type: "send_candidate",
                candidate: e.candidate
            })
        })
        
        sendData({
            type: "join_call"
        })

    }, (error) =>  {
        console.log(error)
    })

}

function createAndSendOffer() {
    pc.createOffer((offer) => {
        sendData({
            type: "store_offer",
            offer: offer
        })
        pc.setLocalDescription(offer)
    }, (error) => {console.log(error)
    })
}

let isAudio = true
function muteAudio(){
    isAudio= !isAudio
    localStream.getAudioTracks()[0].enabled = isAudio
}

let isVideo = true
function muteVideo(){
    isVideo= !isVideo
    localStream.getVideoTracks()[0].enabled = isVideo
}

let screen = false
function screenShare(){
    
    let shareStream = navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true
    })
    localStream.getVideoTracks[0]=shareStream


    screen=!screen
}
