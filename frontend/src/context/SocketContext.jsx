import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [participant, setParticipant] = useState(null);
  const [myVotes, setMyVotes] = useState({}); // { [questionIndex]: "Patrick"|"Theresa" }

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("state_update", (state) => {
      setGameState(state);
    });

    socket.on("joined", (p) => {
      setParticipant(p);
    });

    socket.on("vote_ack", ({ vote, questionIndex }) => {
      setMyVotes((prev) => ({ ...prev, [questionIndex]: vote }));
    });

    return () => socket.disconnect();
  }, []);

  const join = (name, colorBase, colorAccent) => {
    socketRef.current?.emit("join", { name, colorBase, colorAccent });
  };

  const vote = (choice) => {
    socketRef.current?.emit("vote", { vote: choice });
  };

  const modStartGame = (timerDuration = 0) => socketRef.current?.emit("mod_start_game", { timerDuration });
  const modShowEvaluation = () => socketRef.current?.emit("mod_show_evaluation");
  const modNextQuestion = () => socketRef.current?.emit("mod_next_question");
  const modResetGame = () => socketRef.current?.emit("mod_reset_game");

  return (
    <SocketContext.Provider
      value={{
        connected,
        gameState,
        participant,
        myVotes,
        join,
        vote,
        modStartGame,
        modShowEvaluation,
        modNextQuestion,
        modResetGame,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
