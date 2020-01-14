import * as event from "../event";
import * as gameEnded from "../events/game-event/game-ended";
import * as lobby from "../lobby";
import * as timeout from "../timeout";

/**
 * Indicates that the round should start if it is still appropriate to do so.
 */
export interface RoundStart {
  timeout: "RoundStart";
}

export const of = (): RoundStart => ({
  timeout: "RoundStart"
});

export const handle: timeout.Handler<RoundStart> = (
  server,
  timeout,
  gameCode,
  inLobby
) => {
  if (lobby.hasActiveGame(inLobby)) {
    const lobbyGame = inLobby.game;
    const gameRound = lobbyGame.round;

    const events = [];
    const scoreLimit = lobbyGame.rules.scoreLimit;
    if (scoreLimit !== undefined) {
      let max = scoreLimit;
      const winners = [];
      for (const [id, player] of lobbyGame.players) {
        if (player.score > max) {
          max = player.score;
          winners.length = 0;
        }
        if (player.score === max) {
          winners.push(id);
        }
      }
      if (winners.length > 0) {
        lobbyGame.winner = winners;
        events.push(event.targetAll(gameEnded.of(...winners)));

        return {
          inLobby,
          events
        };
      }
    }

    if (gameRound.stage === "Complete") {
      const result = lobbyGame.startNewRound(server, inLobby);
      return {
        inLobby,
        ...result
      };
    }
  }
  return {};
};
