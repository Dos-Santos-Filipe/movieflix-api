import express from "express";
// import { PrismaClient } from "@prisma/client";
import pkg from "@prisma/client";
import { equal } from "assert";
import { release } from "os";
const { PrismaClient } = pkg;

const app = express();
const prisma = new PrismaClient();
const port = 3000;

app.use(express.json());

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

app.post("/movies", async (req, res) => {
  const { title, genre_id, language_id, oscar_count, release_date } = req.body;
  try {
    // verificar no banco se já existe um filme com o mesmo title
    const movieWithSameTitle = await prisma.movie.findFirst({
      where: {
        title: { equals: title, mode: "insensitive" },
      },
    });

    if (movieWithSameTitle) {
      return res
        .status(409)
        .send({ message: "Ja existe um filme com o mesmo title" });
    }

    await prisma.movie.create({
      data: {
        title: title,
        genre_id: genre_id,
        language_id: language_id,
        oscar_count: oscar_count,
        release_date: new Date(release_date),
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(400).send({ message: "Falha ao cadastrar um filme" });
  }
  res.status(201).send();
});

app.put("/movies/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const movie = await prisma.movie.findUnique({
      where: {
        id: id,
      },
    });

    if (!movie) {
      return res.status(404).send({ message: "Filme não encontrado" });
    }

    const data = { ...req.body };
    data.release_date = data.release_date
      ? new Date(data.release_date)
      : undefined;

    await prisma.movie.update({
      where: {
        id: id,
      },
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ message: `Falha ao atualizar um filme. Erro: ${error}` });
  }
  res.status(201).send();
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
