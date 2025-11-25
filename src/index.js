// src/index.js
import express from 'express';
import cors from 'cors';
import {
  getTodayShowtimes,
  filterFromNow,
  groupByMovie,
  pickRandomMovie
} from './services/scraper.js';

const app = express();
const PORT = 3001;

app.use(cors());

app.get('/api/random-movie', async (req, res) => {
  try {
    const cineSlug = req.query.cine || 'cineplanet-san-miguel';

    const allShowtimes = await getTodayShowtimes(cineSlug);

    const futuras = filterFromNow(allShowtimes);

    const agrupadas = groupByMovie(futuras);

    const randomMovie = pickRandomMovie(agrupadas);

    if (!randomMovie) {
      return res.status(404).json({
        message: 'No se encontraron funciones a partir de la hora actual 🙁'
      });
    }

    res.json({
      cine: cineSlug,
      titulo: randomMovie.titulo,
      horarios: randomMovie.horarios
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Error obteniendo datos del cine',
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
