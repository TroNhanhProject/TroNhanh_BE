const { io } = require("socket.io-client");

const SERVER = process.env.SOCKET_URL || "http://localhost:5000";

function wait(ms) { return new Promise(res => setTimeout(res, ms)); }

(async () => {
  console.log("Starting two-socket simulation against", SERVER);

  const userA = "sim_caller_aaa";
  const userB = "sim_receiver_bbb";

  const socketA = io(SERVER, { auth: { userId: userA }, transports: ["websocket"], reconnection: false });
  const socketB = io(SERVER, { auth: { userId: userB }, transports: ["websocket"], reconnection: false });

  socketA.on("connect", () => console.log("[A] connected", socketA.id));
  socketB.on("connect", () => console.log("[B] connected", socketB.id));

  socketA.on("user-added", (d) => console.log("[A] user-added", d));
  socketB.on("user-added", (d) => console.log("[B] user-added", d));

  socketB.on("webrtc-offer", ({ fromUserId, offer }) => {
    console.log("[B] got webrtc-offer from", fromUserId, "offer:", offer && typeof offer === 'object' ? 'object' : offer);
    // Respond with an answer
    const fakeAnswer = { type: "answer", sdp: "FAKE_ANSWER_SDP" };
    socketB.emit("webrtc-answer", { toUserId: fromUserId, answer: fakeAnswer });
    console.log("[B] emitted webrtc-answer to", fromUserId);
  });

  socketA.on("webrtc-answer", ({ fromUserId, answer }) => {
    console.log("[A] got webrtc-answer from", fromUserId, "answer:", answer);
  });

  socketA.on("webrtc-ice-candidate", ({ fromUserId, candidate }) => {
    console.log("[A] got ICE from", fromUserId, candidate);
  });
  socketB.on("webrtc-ice-candidate", ({ fromUserId, candidate }) => {
    console.log("[B] got ICE from", fromUserId, candidate);
  });

  // Wait for both to connect
  await wait(1500);

  if (socketA.connected && socketB.connected) {
    console.log("Both connected, A will send an offer to B...");
    const fakeOffer = { type: "offer", sdp: "FAKE_OFFER_SDP" };
    socketA.emit("webrtc-offer", { toUserId: userB, offer: fakeOffer });
    console.log("[A] emitted webrtc-offer to", userB);

    // Also send an ICE candidate from A to B
    setTimeout(() => {
      socketA.emit("webrtc-ice-candidate", { toUserId: userB, candidate: { candidate: "fake-candidate-a" } });
      console.log("[A] emitted fake ICE candidate to", userB);
    }, 500);
  } else {
    console.error("One or both sockets failed to connect:", socketA.connected, socketB.connected);
  }

  // let script run a little while to exchange messages
  setTimeout(() => {
    console.log("Simulation finished, closing sockets");
    socketA.disconnect();
    socketB.disconnect();
    process.exit(0);
  }, 4000);
})();
