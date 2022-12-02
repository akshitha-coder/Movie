const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//Get movies

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT movie_name
    FROM movie
    ORDER BY movie_id;
    `;

  const movies = await db.all(getMoviesQuery);

  const convertSnakeCaseToCamelCase = (movies) => {
    return { movieName: movies.movie_name };
  };

  const arr = [];
  for (let each of movies) {
    const a = convertSnakeCaseToCamelCase(each);
    arr.push(a);
  }
  response.send(arr);
});

//Post movie

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;

  const postMovieQuery = `
    INSERT INTO movie(director_id, movie_name, lead_actor)
    VALUES(
        ${directorId},
        '${movieName}',
        '${leadActor}'
    );
    `;

  const movie = await db.run(postMovieQuery);
  response.send("Movie Successfully Added");
});

//Get a movie

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieGetQuery = `
    SELECT *
    FROM movie
    WHERE movie_id = ${movieId};
    `;

  const movieDetails = await db.get(movieGetQuery);
  response.send(movieDetails);
});

//Update the movie details

app.put("/movies/:movieId/", async (request, response) => {
  const movieDetails = request.body;
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = movieDetails;

  const movieQuery = `
    UPDATE movie
    SET director_id = ${directorId},
    movie_name = '${movieName}',
    lead_actor = '${leadActor}'
    WHERE movie_id = ${movieId}
    `;
  await db.run(movieQuery);
  response.send("Movie Details Updated");
});

//Delete a movie

app.delete("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM movie
    WHERE movie_id = ${movieId};
    `;
  await db.run(deleteMovieQuery);

  response.send("Movie Removed");
});

//Get directors table

app.get("/directors/", async (request, response) => {
  const directorQuery = `
    SELECT *
    FROM director;
    `;

  const dbDetails = await db.all(directorQuery);

  const convertSnakeCaseToCamelCase = (dbObject) => {
    return {
      directorId: dbObject.director_id,
      directorName: dbObject.director_name,
    };
  };
  let arr = [];
  for (let each of dbDetails) {
    const result = convertSnakeCaseToCamelCase(each);
    arr.push(result);
  }

  response.send(arr);
});

//Get movies directed by specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;

  const movieNamesQuery = `
    SELECT movie_name
    FROM movie
    WHERE director_id = ${directorId};
    `;

  const movieList = await db.all(movieNamesQuery);
  response.send(movieList);
});

module.exports = app;
