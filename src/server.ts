import express, { Request, Response, Handler } from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import swaggerUi from "swagger-ui-express";

import swaggerDocument from "../swagger.json" with { type: "json" };

const app = express();
const prisma = new PrismaClient();
const port = 3000;

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (req, res) => {
  res.send("Hello Apolo!");
});

app.get("/movies", async (_, res: Response) => {
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

app.post("/movies", async (req: Request, res: Response) => {
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

    const movie = await prisma.movie.create({
      data: {
        title: title,
        genre_id: genre_id,
        language_id: language_id,
        oscar_count: oscar_count,
        release_date: new Date(release_date),
      },
    });
    res.status(201).json(movie);

  } catch (error) {
    console.log(error);

    return res.status(400).send({ message: "Falha ao cadastrar um filme" });
  }
});

app.put("/movies/:id", async (req: Request, res: Response) => {
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
    res.status(200).send();

  } catch (error) {
    console.error("Erro ao atualizar um filme: ", error);
    return res
      .status(400)
      .send({ message: `Falha ao atualizar um filme. Erro: ${error}` });
  }
});

app.delete("/movies/:id", async (req: Request, res: Response) => {
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

    await prisma.movie.delete({
      where: {
        id: id,
      },
    });
    res.status(204).send();

  } catch (error) {
    console.error("Erro ao deletar um filme: ", error);
    return res.status(400).send({ message: "Falha ao deletar um filme" });
  }
});

app.get("/movies/:genreName", async (req: Request, res: Response) => {
  const genreName = req.params.genreName;
  try {
    const filteredMovies = await prisma.movie.findMany({
      include: {
        genres: true,
        languages: true,
      },
      where: {
        genres: {
          name: {
            equals: genreName,
            mode: "insensitive",
          },
        },
      },
    });
    res.status(200).send(filteredMovies);

  } catch (error) {
    console.error(error);
    return res.status(400).send({ message: "Falha ao filtrar filmes" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
