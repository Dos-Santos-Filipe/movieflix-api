import express from "express";
// import { PrismaClient } from "@prisma/client";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const app = express();
const prisma = new PrismaClient();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello Apolo!");
});

app.get("/movies", async (_, res) => {
  const movies = await prisma.movie.findMany({
    orderBy: {
      title: "asc",
    },
    include: {
      genres: true,
      languages: true,
    },
  });
  res.json(movies);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
