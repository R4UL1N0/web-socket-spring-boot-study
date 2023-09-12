'use strict'

const loginPage = document.querySelector(".login-page")
const chatPage = document.querySelector(".chat-page")

const loginForm = document.querySelector("#login-form")
const messageForm = document.querySelector("#message-form")

const usernameInput = document.querySelector("#username-input")
const messageInput = document.querySelector("#message")

const messagesArea = document.querySelector(".messages-area")

const connecting = document.querySelector(".connecting")

let stompClient = null
let username = null

let colors =  ['#21996F3', '#32c787', '#00BCD4', '#ff5652', '#ffc107', '#ff85af', '#FF9800', '#39bbb0']

function connect(e) {
    e.preventDefault()

    username = usernameInput.value.trim() 
    if (username) {
        loginPage.classList.add('hidden')
        chatPage.classList.remove('hidden')

        var socket = new SocketJS('/ws')
        stompClient = Stomp.over(socket)

        stompClient.conect({}, onConnected, onError)
    }
    usernameInput.value = ""
    console.log(username)
}

function onMessageReceived(payload) {
    const message = JSON.parse(payload.body)

    const messageEl = document.createElement('li')

    if (message.type === "JOIN") {
        messageEl.classList.add('event-message')
        message.value = message.sender + ' joined!'
    } else if (message.type === 'LEAVE') {
        messageEl.classList.add('event-message')
        message.value = message.sender + ' left!'
    } else {
        messageEl.classList.add('chat-message')

        const avatarEl = document.createElement('i')
        const avatarText = document.createTextNode(message.sender[0])
        avatarEl.appendChild(avatarText)
        avatarEl.style.backgroundColor = getAvatarColor(message.sender)

        messageEl.appendChild(avatarEl)

        const usernameEl = document.createElement('span')
        const usernameText = document.createTextNode(message.sender)
        usernameEl.appendChild(usernameText)
        messageEl.appendChild(usernameEl)
    }

    const textEl = document.createElement('p')
    const messageText = document.createTextNode(message.value)
    textEl.appendChild(messageText)

    messageEl.appendChild(textEl)

    messagesArea.appendChild(messageEl)
    messagesArea.scrollTop = messagesArea.scrollHeight
}

function getAvatarColor(messageSender) {
    let hash = 0
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i)
    }
    const index = Math.abs(hash % colors.length)
    return colors[index]

}

function sendMessage(e) {
    e.preventDefault()

    const messageContent = messageInput.value.trim()
    if (messageContent && stompClient) {
        const chatMessage = {
            sender: username,
            content: messageContent,
            type: 'CHAT'
        }

        stompClient.send(
            'app/chat.sendMessage',
            {},
            JSON.stringify(chatMessage)
        )

        messageInput.value = ""
    }
}

function onConnected() {

    // subscribe to the public topic
    stompClient.subscribe('/topic/public', onMessageReceived)

    // tell username to the server
    stompClient.send(
        'app/chat.addUser',
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    )

    connecting.classList.add("hidden")
}

function onError() {
    connecting.textContent = "Could not connect to Web Socket"
    connecting.style.color = "red"
}

loginForm.addEventListener('submit', connect, true)
messageForm.addEventListener('submit', sendMessage, true)