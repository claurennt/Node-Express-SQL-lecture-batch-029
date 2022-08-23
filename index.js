//we need it to read environmental variables
require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3000;

const db = require("./database/client.js");

//parse the body of any request coming from html forms
app.use(express.urlencoded({ extended: true }));

//parse the body of any request not coming through an html form
app.use(express.json());

//allow CORS from any origin
app.use(cors());

app.get("/", (req, res) => {
  res.send("Welcome to my Movies API");
});

//GET request to get all movies from the DB
app.get("/api/movies", async (req, res) => {
  // const { rows: movies }
  try {
    const { rows } = await db.query("SELECT * from Movies;");
    return res.status(200).send(rows);
  } catch (err) {
    console.log(err);
    return res.status(500).send("Something went wrong");
  }
});

//GET request to get one movie from the DB
app.get("/api/movies/:id", async (req, res) => {
  const { id } = req.params;

  try {
    //prepared statement to avoid SQL injections
    const {
      rows: [movie],
      rowCount,
    } = await db.query(`SELECT * FROM Movies WHERE id=$1;`, [id]);

    //if there is no movie with the id, return 404
    if (!rowCount)
      return res.status(404).send(`The movie with id ${id} does not exist`);

    return res.status(200).send(movie);
  } catch (err) {
    console.log(err);
    return res.status(500).send("Something went wrong");
  }
});

//POST request to add a movie to the DB
app.post("/api/movies", async (req, res) => {
  const { title, director, year } = req.body;

  //block request if the payload is missing a required field
  if (!title || !director || !year)
    return res
      .status(400)
      .send("The request body must have values for title, director,year");

  try {
    const {
      rows: [createdMovie],
    } = await db.query(
      "INSERT INTO Movies (title,director,year) VALUES ($1,$2,$3) RETURNING *",
      [title, director, year]
    );

    return res.status(201).send(createdMovie);
  } catch (err) {
    console.log(err);
    return res.status(500).send("Something went wrong");
  }
});

//PUT request to update a movie in the DB
app.put("/api/movies/:id", async (req, res) => {
  const { id } = req.params;

  const { title, director, year } = req.body;

  //block request if the payload is missing a required field
  if (!title || !director || !year)
    return res
      .status(400)
      .send("Please provide values for title, director, year");

  try {
    const {
      rowCount,
      rows: [updatedMovie],
    } = await db.query(
      "UPDATE Movies SET title=$1,director=$2,year=$3 WHERE id=$4 RETURNING *",
      [title, director, year, id]
    );

    // inform the user if they try to update a movie that does not exist
    if (!rowCount)
      return res
        .status(404)
        .send(
          `The movie with id ${id} that you are trying to update does not exist`
        );

    return res.status(201).send(updatedMovie);
  } catch (err) {
    console.log(err);
    return res.status(500).send("Something went wrong");
  }
});

app.delete("/api/movies/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const {
      rows: [deletedMovie],
      rowCount,
    } = await db.query("DELETE FROM Movies WHERE id=$1 RETURNING *", [id]);

    // inform the user if they try to delete a movie that does not exist
    if (!rowCount)
      return res
        .status(404)
        .send(
          `The movie with id ${id} that you are trying to delete does not exist`
        );

    return res.status(200).send(deletedMovie);
  } catch (err) {
    console.log(err);
    return res.status(500).send("Something went wrong");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
