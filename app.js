const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
const database = path.join(__dirname, "covid19India.db");

app.use(express.json());

db = null;

const initializationServer = async () => {
  try {
    db = await open({
      filename: database,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running athttp://localhost:3000");
    });
  } catch (e) {
    console.log(`BD Error is ${e.message}`);
    process.exit(1);
  }
};
initializationServer();

const stateTableObjecting = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const districtTableObjecting = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// get all state Names............

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray.map((eachState) => stateTableObjecting(eachState)));
});
// get states as per search id

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const sqlQuery = `
    SELECT * FROM state WHERE state_id = ${stateId};`;
  const state = await db.get(sqlQuery);
  response.send(stateTableObjecting(state));
});

// create a district in data base

app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const sqlQuery = `INSERT INTO
   district (state_id, district_name,  cases, cured, active, deaths)
   VALUES (${stateId},'${districtName}',  ${cases}, ${cured}, ${active}, ${deaths});`;
  await db.run(sqlQuery);
  response.send("District Successfully Added");
});

// get district id's

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const sqlQuery = ` SELECT * FROM district WHERE district_id = ${districtId};`;
  const result = await db.get(sqlQuery);
  response.send(districtTableObjecting(result));
});

// delete district from district table

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const sqlQuery = `
    DELETE FROM district WHERE district_id = ${districtId};`;
  const result = await db.run(sqlQuery);
  response.send("District Removed");
});

// update district details.....

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const sqlQuery = `
    UPDATE district 
    SET
     district_name = '${districtName}',
     state_id = ${stateId}, 
     cases = ${cases},
     cured =  ${cured}, 
     active = ${active},
     deaths = ${deaths}
    WHERE district_id = ${districtId};`;
  await db.run(sqlQuery);
  response.send("District Details Updated");
});

// /states/:stateId/stats/

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const stats = await db.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

// getting district name...

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const sqlQuery = ` 
    SELECT state_name
     FROM 
     district
    NATURAL JOIN state
    WHERE district_id = ${districtId};`;
  const result = await db.get(sqlQuery);
  response.send({ stateName: result.state_name });
});

module.exports = app;
