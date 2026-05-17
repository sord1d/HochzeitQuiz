import React from "react";
import { Routes, Route } from "react-router-dom";
import { SocketProvider, useSocket } from "./context/SocketContext";
import OnboardingScreen from "./components/screens/OnboardingScreen";
import LobbyScreen from "./components/screens/LobbyScreen";
import VotingScreen from "./components/screens/VotingScreen";
import EvaluationScreen from "./components/screens/EvaluationScreen";
import FinishedScreen from "./components/screens/FinishedScreen";
import ModeratorScreen from "./components/screens/ModeratorScreen";
import BeamerScreen from "./components/screens/BeamerScreen";

function ParticipantView() {
  const { participant, gameState } = useSocket();
  const status = gameState?.status ?? "LOBBY";

  if (!participant) return <OnboardingScreen />;
  if (status === "LOBBY") return <LobbyScreen />;
  if (status === "VOTING") return <VotingScreen />;
  if (status === "EVALUATION") return <EvaluationScreen />;
  if (status === "FINISHED") return <FinishedScreen />;
  return <LobbyScreen />;
}

export default function App() {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/moderator" element={<ModeratorScreen />} />
        <Route path="/beamer" element={<BeamerScreen />} />
        <Route path="*" element={<ParticipantView />} />
      </Routes>
    </SocketProvider>
  );
}
