const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const playersList = `SELECT * FROM player_details`;

  const allPlayesrList = await db.all(playersList);
  response.send(
    allPlayesrList.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = `SELECT * FROM player_details
  WHERE player_id= ${playerId}`;

  const playerInfo = await db.get(playerDetails);
  response.send(convertPlayerDbObjectToResponseObject(playerInfo));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerDetails = `UPDATE player_details SET player_name='${playerName}'
  WHERE player_id= ${playerId}`;

  await db.run(updatePlayerDetails);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetails = `SELECT * FROM match_details
  WHERE match_id= ${matchId}`;

  const playerInfo = await db.get(matchDetails);
  response.send(convertMatchDbObjectToResponseObject(playerInfo));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const matchList = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id = ${playerId}`;

  const playerMatches = await db.all(matchList);
  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDbObjectToResponseObject(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const matchList = `
  SELECT 
  * 
  FROM player_match_score NATURAL JOIN 
  player_details 
  WHERE match_id = ${matchId}`;

  const playerMatches = await db.all(matchList);
  response.send(
    playerMatches.map((eachMatch) =>
      convertPlayerDbObjectToResponseObject(eachMatch)
    )
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const matchList = `
  SELECT 
        player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS total_score,
        SUM(fours) AS total_fours,
        SUM(sixes) AS total_sixes
  FROM player_match_score NATURAL JOIN 
        player_details 
  WHERE player_id = ${playerId}`;

  const playerMatches = await db.get(matchList);
  response.send(playerMatches);
});

module.exports = app;
